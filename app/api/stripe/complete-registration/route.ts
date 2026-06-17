/**
 * GET /api/stripe/complete-registration?session_id=xxx
 *
 * Stripe redirects here after successful payment.
 * Auth user already exists (created in register-checkout).
 * This route just signs the user in and redirects to dashboard.
 *
 * The webhook handles the actual subscription data (purchase row, active_purchase_id).
 * Both are idempotent — whichever runs first wins.
 */

import { type NextRequest, NextResponse } from "next/server"
import { createSupabaseAdminClient } from "@/lib/supabase/server"
import { stripe } from "@/lib/stripe/client"
import { getPlan } from "@/lib/plans"

export const dynamic = "force-dynamic"


export async function GET(request: NextRequest) {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? `https://${request.headers.get("host")}`
    const sessionId = request.nextUrl.searchParams.get("session_id")
    console.log("appUrl:", appUrl);
    if (!sessionId) {
        return NextResponse.redirect(`${appUrl}/pricing?error=missing_session`)
    }

    // ── Verify Stripe session is paid ─────────────────────────────────────────
    let session: Awaited<ReturnType<typeof stripe.checkout.sessions.retrieve>>
    try {
        session = await stripe.checkout.sessions.retrieve(sessionId)
    } catch {
        return NextResponse.redirect(`${appUrl}/pricing?error=session_not_found`)
    }

    if (session.payment_status !== "paid") {
        return NextResponse.redirect(`${appUrl}/pricing?error=payment_incomplete`)
    }

    const userId = session.metadata?.user_id
    const planId = session.metadata?.plan_id

    if (!userId || !planId) {
        return NextResponse.redirect(`${appUrl}/pricing?error=invalid_session`)
    }

    const adminSupabase = createSupabaseAdminClient()
    const plan = getPlan(planId)

    // ── Ensure subscription is saved (in case webhook hasn't fired yet) ───────
    const { data: existingPurchase } = await adminSupabase
        .from("user_plan_purchases")
        .select("id")
        .eq("stripe_session_id", sessionId)
        .single()

    if (!existingPurchase) {
        // Webhook hasn't fired yet — save it now
        const amountPaid = session.amount_total ? session.amount_total / 100 : plan.price
        const stripeCustomerId = typeof session.customer === "string" ? session.customer : null
        const paymentIntent = typeof session.payment_intent === "string" ? session.payment_intent : null

        const { data: purchase } = await adminSupabase
            .from("user_plan_purchases")
            .insert({
                user_id: userId,
                plan_id: planId,
                stripe_session_id: sessionId,
                stripe_payment_intent: paymentIntent,
                stripe_customer_id: stripeCustomerId,
                amount_paid: amountPaid,
                currency: session.currency ?? "usd",
                reports_total: plan.reportLimit,
                reports_used: 0,
                status: "active",
                purchased_at: new Date().toISOString(),
            })
            .select("id")
            .single()

        if (purchase) {
            await adminSupabase
                .from("users")
                .update({
                    plan_name: planId,
                    subscription_status: "active",
                    active_purchase_id: purchase.id,
                    stripe_customer_id: stripeCustomerId,
                    updated_at: new Date().toISOString(),
                })
                .eq("id", userId)
        }
    }

    // ── Sign user in via magic link → redirect to dashboard ───────────────────
    try {
        const { data: userRow } = await adminSupabase
            .from("users")
            .select("email")
            .eq("id", userId)
            .single()

        if (!userRow?.email) throw new Error("User email not found")

        const { data, error } = await adminSupabase.auth.admin.generateLink({
            type: "magiclink",
            email: userRow.email,
            options: { redirectTo: `${appUrl}/dashboard` },
        })

        if (error || !data?.properties?.action_link) throw error

        return NextResponse.redirect(data.properties.action_link)
    } catch (err) {
        console.error("[complete-registration] Sign-in failed:", err)
        // Fallback: send to login with success message
        const { data: userRow } = await adminSupabase
            .from("users")
            .select("email")
            .eq("id", userId)
            .single()

        const email = userRow?.email ?? ""
        return NextResponse.redirect(
            `${appUrl}/login?registered=1&email=${encodeURIComponent(email)}`
        )
    }
}