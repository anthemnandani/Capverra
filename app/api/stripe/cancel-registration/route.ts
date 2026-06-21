/**
 * GET /api/stripe/cancel-registration?user_id=xxx
 *
 * Stripe redirects here when a user cancels checkout before paying
 * (cancel_url). The auth user was already created in register-checkout
 * BEFORE the Stripe session, so if they bail out here, that auth user
 * is now orphaned: it exists with no payment, and permanently blocks
 * that email from registering again ("account already exists").
 *
 * This route deletes that orphaned auth user — but ONLY if it's safe:
 *   - The user must still be on the free plan with no active_purchase_id
 *     (i.e. they genuinely never completed any payment, ever).
 *   - This guards against deleting a real paying customer in the rare
 *     case the user re-used an old/stale cancel link, or opened two
 *     checkout sessions and completed a different one.
 *
 * If anything looks even slightly off, we do nothing and just redirect —
 * worst case is one harmless leftover free-tier row, which is far safer
 * than risking deletion of a paying customer's account.
 */

import { type NextRequest, NextResponse } from "next/server"
import { createSupabaseAdminClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? `https://${request.headers.get("host")}`
  const userId = request.nextUrl.searchParams.get("user_id")

  if (!userId) {
    return NextResponse.redirect(`${appUrl}/pricing?checkout=cancel`)
  }

  try {
    const adminSupabase = createSupabaseAdminClient()

    // ── Safety check: only delete if this user never actually paid ──────────
    const { data: userRow, error: userError } = await adminSupabase
      .from("users")
      .select("id, active_purchase_id, plan_name, subscription_status")
      .eq("id", userId)
      .single()

    if (userError || !userRow) {
      // Nothing to clean up, or already gone — just redirect.
      return NextResponse.redirect(`${appUrl}/pricing?checkout=cancel`)
    }

    const neverPaid =
      !userRow.active_purchase_id &&
      (userRow.plan_name === "free" || !userRow.plan_name) &&
      userRow.subscription_status !== "active"

    if (neverPaid) {
      // Double-check there's truly no purchase row for this user before
      // deleting — belt-and-suspenders against any edge case where
      // active_purchase_id wasn't set yet but a purchase exists.
      const { count: purchaseCount } = await adminSupabase
        .from("user_plan_purchases")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId)

      if (!purchaseCount) {
        // Safe to delete — remove auth user (cascades to `users` row via FK).
        const { error: deleteError } = await adminSupabase.auth.admin.deleteUser(userId)
        if (deleteError) {
          console.error("[cancel-registration] Failed to delete orphaned user:", deleteError)
          // Non-fatal — user can still retry, will just hit "already exists"
          // and need to contact support. Logged for visibility.
        } else {
          console.log(`[cancel-registration] Cleaned up orphaned auth user: ${userId}`)
        }
      }
    }
  } catch (err) {
    // Never block the user's redirect on cleanup failure.
    console.error("[cancel-registration] Unexpected error during cleanup:", err)
  }

  return NextResponse.redirect(`${appUrl}/pricing?checkout=cancel`)
}