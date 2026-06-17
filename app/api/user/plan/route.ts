// GET /api/user/plan
import { NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { getPlan } from "@/lib/plans"

export const dynamic = "force-dynamic"

export async function GET() {
  const supabase = await createSupabaseServerClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // ── Fetch user row ────────────────────────────────────────────────────────
  const { data: userData, error: userError } = await supabase
    .from("users")
    .select("id, plan_name, subscription_status, active_purchase_id")
    .eq("id", user.id)
    .single()

  if (userError || !userData) {
    return NextResponse.json({ error: "User not found" }, { status: 404 })
  }

  const planId = userData.plan_name ?? "free"
  const plan   = getPlan(planId)

  // ── Paid plan with active purchase ────────────────────────────────────────
  if (userData.active_purchase_id && planId !== "free") {
    const { data: purchase } = await supabase
      .from("user_plan_purchases")
      .select("id, plan_id, reports_total, reports_used, status, purchased_at, exhausted_at")
      .eq("id", userData.active_purchase_id)
      .single()

    if (purchase) {
      const reportsRemaining = Math.max(0, purchase.reports_total - purchase.reports_used)
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
  }

  // ── Free plan — count actual reports used ─────────────────────────────────
  const { count: reportsUsed } = await supabase
    .from("optimization_reports")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("is_deleted", false)

  const used      = reportsUsed ?? 0
  const remaining = Math.max(0, plan.reportLimit - used)

  return NextResponse.json({
    plan_id:             "free",
    plan_name:           "Free",
    reports_total:       plan.reportLimit,
    reports_used:        used,
    reports_remaining:   remaining,
    identity_limit:      plan.identityLimit,
    jurisdiction_limit:  plan.jurisdictionLimit,
    subscription_status: "free",
    has_active_plan:     false,
    purchase_id:         null,
    purchased_at:        null,
    exhausted_at:        null,
  })
}