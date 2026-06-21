// GET /api/user/plan
import { NextResponse } from "next/server"
import { createSupabaseServerClient, createSupabaseAdminClient } from "@/lib/supabase/server"
import { getPlan } from "@/lib/plans"

export const dynamic = "force-dynamic"

function log(step: string, data: Record<string, unknown> = {}, level: "info" | "warn" | "error" = "info") {
  const msg = `[user/plan] [${step}]`
  if (level === "error") console.error(msg, data)
  else if (level === "warn") console.warn(msg, data)
  else console.log(msg, data)
}

export async function GET() {
  // Normal client — session/auth check ke liye (RLS-aware)
  const supabase = await createSupabaseServerClient()

  // Admin client — data fetch ke liye (RLS bypass)
  // Kyun: user_plan_purchases aur users table pe RLS policies
  // sometimes authenticated user ko apna hi data read nahi karne deti
  // jab policy correctly set nahi hoti. Admin client se yeh guarantee hai
  // ki data hamesha milega agar DB mein hai.
  const adminSupabase = createSupabaseAdminClient()

  // ── Step 1: Auth verify (normal client — secure) ──────────────────────────
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  log("AUTH", {
    userId: user?.id ?? null,
    email:  user?.email ?? null,
    error:  authError?.message ?? null,
  })

  if (authError || !user) {
    log("UNAUTHORIZED", {}, "error")
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // ── Step 2: users table fetch (admin client — RLS bypass) ─────────────────
  const { data: userData, error: userError } = await adminSupabase
    .from("users")
    .select("id, plan_name, subscription_status, active_purchase_id")
    .eq("id", user.id)
    .single()

  log("USER_ROW", {
    planName:          userData?.plan_name ?? null,
    subscriptionStatus: userData?.subscription_status ?? null,
    activePurchaseId:  userData?.active_purchase_id ?? null,
    error:             userError?.message ?? null,
  })

  if (userError || !userData) {
    log("USER_NOT_FOUND", { userId: user.id }, "error")
    return NextResponse.json({ error: "User not found" }, { status: 404 })
  }

  const planId = userData.plan_name ?? "free"
  const plan   = getPlan(planId)

  // ── Step 3: Paid plan — purchase row fetch ────────────────────────────────
  if (userData.active_purchase_id && planId !== "free") {
    log("FETCHING_PURCHASE", {
      purchaseId: userData.active_purchase_id,
      planId,
    })

    const { data: purchase, error: purchaseError } = await adminSupabase
      .from("user_plan_purchases")
      .select("id, plan_id, reports_total, reports_used, status, purchased_at, exhausted_at")
      .eq("id", userData.active_purchase_id)
      .single()

    log("PURCHASE_ROW", {
      found:         !!purchase,
      reportsTotal:  purchase?.reports_total ?? null,
      reportsUsed:   purchase?.reports_used ?? null,
      status:        purchase?.status ?? null,
      error:         purchaseError?.message ?? null,
    })

    if (purchase) {
      const reportsRemaining = Math.max(0, purchase.reports_total - purchase.reports_used)

      log("RETURNING_PAID_PLAN", {
        planId,
        planName:        plan.name,
        reportsTotal:    purchase.reports_total,
        reportsUsed:     purchase.reports_used,
        reportsRemaining,
        status:          purchase.status,
      })

      return NextResponse.json({
        plan_id:             planId,
        plan_name:           plan.name,
        reports_total:       purchase.reports_total,
        reports_used:        purchase.reports_used,
        reports_remaining:   reportsRemaining,
        identity_limit:      plan.identityLimit,
        jurisdiction_limit:  plan.jurisdictionLimit,
        subscription_status: purchase.status,
        has_active_plan:     purchase.status === "active",
        purchase_id:         purchase.id,
        purchased_at:        purchase.purchased_at,
        exhausted_at:        purchase.exhausted_at,
      })
    }

    // Purchase ID exists in users table but row not found — data inconsistency
    log("PURCHASE_ROW_MISSING", {
      active_purchase_id: userData.active_purchase_id,
      hint: "users.active_purchase_id points to non-existent purchase row",
    }, "warn")
  }

  // ── Step 4: Free plan — count reports used ────────────────────────────────
  log("FETCHING_FREE_PLAN_USAGE", { userId: user.id, planId })

  const { count: reportsUsed, error: countError } = await adminSupabase
    .from("optimization_reports")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("is_deleted", false)

  log("FREE_PLAN_USAGE", {
    reportsUsed: reportsUsed ?? 0,
    error:       countError?.message ?? null,
  })

  const used      = reportsUsed ?? 0
  const remaining = Math.max(0, (plan.reportLimit ?? 1) - used)

  log("RETURNING_FREE_PLAN", {
    reason:    planId !== "free" ? "purchase_row_missing_fallback" : "plan_is_free",
    planId,
    reportsTotal:    plan.reportLimit,
    reportsUsed:     used,
    reportsRemaining: remaining,
  })

  return NextResponse.json({
    plan_id:             planId === "free" ? "free" : planId,
    plan_name:           planId === "free" ? "Free" : plan.name,
    reports_total:       plan.reportLimit,
    reports_used:        used,
    reports_remaining:   remaining,
    identity_limit:      plan.identityLimit,
    jurisdiction_limit:  plan.jurisdictionLimit,
    subscription_status: userData.subscription_status ?? "free",
    has_active_plan:     false,
    purchase_id:         null,
    purchased_at:        null,
    exhausted_at:        null,
  })
}