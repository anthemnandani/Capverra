/**
 * GET /api/stripe/complete-registration?session_id=xxx
 *
 * Stripe redirects here after successful payment.
 * Auth user already exists (created in register-checkout) with a known password.
 *
 * Flow (same as signup page):
 *  1. Verify Stripe payment
 *  2. Save purchase to DB (if webhook hasn't fired yet)
 *  3. Return an inline HTML page that calls signInWithPassword() in the browser
 *     and redirects to /dashboard — exactly like signup page does.
 *     No extra routes, no magic links, no callbacks.
 */

import { type NextRequest, NextResponse } from "next/server"
import { createSupabaseAdminClient } from "@/lib/supabase/server"
import { stripe } from "@/lib/stripe/client"
import { getPlan } from "@/lib/plans"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  const appUrl    = process.env.NEXT_PUBLIC_APP_URL ?? `https://${request.headers.get("host")}`
  const sessionId = request.nextUrl.searchParams.get("session_id")

  if (!sessionId) {
    return NextResponse.redirect(`${appUrl}/pricing?error=missing_session`)
  }

  // ── 1. Verify Stripe session ──────────────────────────────────────────────
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
  const plan          = getPlan(planId)

  // ── 2. Save purchase if webhook hasn't fired yet ──────────────────────────
  const { data: existingPurchase } = await adminSupabase
    .from("user_plan_purchases")
    .select("id")
    .eq("stripe_session_id", sessionId)
    .single()

  if (!existingPurchase) {
    const amountPaid       = session.amount_total ? session.amount_total / 100 : plan.price
    const stripeCustomerId = typeof session.customer === "string" ? session.customer : null
    const paymentIntent    = typeof session.payment_intent === "string" ? session.payment_intent : null

    const { data: purchase } = await adminSupabase
      .from("user_plan_purchases")
      .insert({
        user_id:               userId,
        plan_id:               planId,
        stripe_session_id:     sessionId,
        stripe_payment_intent: paymentIntent,
        stripe_customer_id:    stripeCustomerId,
        amount_paid:           amountPaid,
        currency:              session.currency ?? "usd",
        reports_total:         plan.reportLimit,
        reports_used:          0,
        status:                "active",
        purchased_at:          new Date().toISOString(),
      })
      .select("id")
      .single()

    if (purchase) {
      await adminSupabase
        .from("users")
        .update({
          plan_name:           planId,
          subscription_status: "active",
          active_purchase_id:  purchase.id,
          stripe_customer_id:  stripeCustomerId,
          updated_at:          new Date().toISOString(),
        })
        .eq("id", userId)
    }
  }

  // ── 3. Fetch user email ───────────────────────────────────────────────────
  const { data: userRow } = await adminSupabase
    .from("users")
    .select("email")
    .eq("id", userId)
    .single()

  const email = userRow?.email ?? ""

  if (!email) {
    return NextResponse.redirect(`${appUrl}/login?registered=1`)
  }

  // ── 4. Generate a one-time password reset token so we can sign in ─────────
  // We don't store the plain-text password (security), so we use admin
  // generateLink to get a fresh OTP token, then sign in via verifyOtp
  // IN THE BROWSER — exactly the same pattern as signup's signInWithPassword.
  // The inline HTML page below does everything client-side; no extra routes.
  const { data: linkData, error: linkError } = await adminSupabase.auth.admin.generateLink({
    type:  "magiclink",
    email,
  })

  if (linkError || !linkData?.properties?.hashed_token) {
    console.error("[complete-registration] generateLink failed:", linkError)
    return NextResponse.redirect(
      `${appUrl}/login?registered=1&email=${encodeURIComponent(email)}`
    )
  }

  const hashedToken = linkData.properties.hashed_token
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

  // ── 5. Return inline HTML that signs user in via browser (no extra page) ──
  // This is equivalent to what signup page does with signInWithPassword —
  // it runs in the browser so Supabase sets session cookies correctly.
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Signing you in…</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #0a0a0a;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      color: #a1a1aa;
    }
    .wrap { display: flex; flex-direction: column; align-items: center; gap: 16px; }
    .spinner {
      width: 40px; height: 40px;
      border: 4px solid rgba(255,255,255,0.1);
      border-top-color: #a78bfa;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    p { font-size: 14px; }
  </style>
</head>
<body>
  <div class="wrap">
    <div class="spinner"></div>
    <p>Setting up your account…</p>
  </div>
  <script type="module">
    import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm'

    const supabase = createClient(
      ${JSON.stringify(supabaseUrl)},
      ${JSON.stringify(supabaseKey)}
    )

    async function signIn() {
      const { error } = await supabase.auth.verifyOtp({
        token_hash: ${JSON.stringify(hashedToken)},
        type: 'magiclink',
      })

      if (error) {
        console.error('Sign-in error:', error.message)
        // Fallback to login page with email pre-filled
        window.location.href = '/login?registered=1&email=${encodeURIComponent(email)}'
        return
      }

      // Signed in successfully — go to dashboard
      window.location.href = '/dashboard'
    }

    signIn()
  </script>
</body>
</html>`

  return new NextResponse(html, {
    status: 200,
    headers: { "Content-Type": "text/html; charset=utf-8" },
  })
}