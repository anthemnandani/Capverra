/**
 * POST /api/stripe/register-checkout
 *
 * Simple flow (no bcrypt, no pending_registrations table):
 *   1. Validate inputs
 *   2. Check email not already registered
 *   3. Create Supabase auth user immediately (email_confirm: true)
 *   4. Insert into `users` table
 *   5. Create Stripe Checkout Session with user_id in metadata
 *   6. Return { url }
 *
 * Webhook (checkout.session.completed) then:
 *   - Reads user_id from metadata
 *   - Creates user_plan_purchases row
 *   - Updates users.active_purchase_id
 */

import { type NextRequest, NextResponse } from "next/server"
import { createSupabaseAdminClient } from "@/lib/supabase/server"
import { stripe } from "@/lib/stripe/client"
import { getPlan, type PlanId } from "@/lib/plans"

export const dynamic = "force-dynamic"

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function POST(request: NextRequest) {
  // ── Parse body ────────────────────────────────────────────────────────────
  let name: string, email: string, password: string, planId: PlanId

  try {
    const body = await request.json()
    name     = (body.name     ?? "").trim()
    email    = (body.email    ?? "").trim().toLowerCase()
    password = (body.password ?? "")
    planId   = body.plan_id
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
  }

  // ── Validate ──────────────────────────────────────────────────────────────
  if (!name)                 return NextResponse.json({ error: "Name is required" }, { status: 400 })
  if (!EMAIL_RE.test(email)) return NextResponse.json({ error: "Invalid email address" }, { status: 400 })
  if (password.length < 6)   return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 })

  const plan = getPlan(planId)
  if (!plan.stripePriceId || plan.id === "free") {
    return NextResponse.json({ error: "Invalid plan selected" }, { status: 400 })
  }

  const adminSupabase = createSupabaseAdminClient()

  // ── Check if email already exists ────────────────────────────────────────
  const { data: existingUsers } = await adminSupabase.auth.admin.listUsers()
  const emailTaken = existingUsers?.users?.some(
    (u) => u.email?.toLowerCase() === email
  )
  if (emailTaken) {
    return NextResponse.json(
      { error: "An account with this email already exists. Please sign in." },
      { status: 409 }
    )
  }

  // ── Create Supabase auth user ─────────────────────────────────────────────
  const { data: authData, error: authError } = await adminSupabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,          // skip email confirmation
    user_metadata: { name },
  })

  if (authError || !authData.user) {
    console.error("[register-checkout] Failed to create auth user:", authError)
    return NextResponse.json(
      { error: authError?.message ?? "Failed to create account. Please try again." },
      { status: 500 }
    )
  }

  const userId = authData.user.id

  // ── Insert into users table ───────────────────────────────────────────────
  await adminSupabase.from("users").upsert({
    id:                  userId,
    email,
    name,
    role:                "client",
    plan_name:           "free",   // will be updated by webhook after payment
    subscription_status: "free",
    created_at:          new Date().toISOString(),
    updated_at:          new Date().toISOString(),
  })

  // ── Get or create Stripe customer ─────────────────────────────────────────
  let stripeCustomerId: string | null = null
  try {
    const existing = await stripe.customers.list({ email, limit: 1 })
    if (existing.data.length > 0) {
      stripeCustomerId = existing.data[0].id
    } else {
      const customer = await stripe.customers.create({
        email,
        name,
        metadata: { supabase_user_id: userId },
      })
      stripeCustomerId = customer.id
    }

    if (stripeCustomerId) {
      await adminSupabase
        .from("users")
        .update({ stripe_customer_id: stripeCustomerId })
        .eq("id", userId)
    }
  } catch (err) {
    console.error("[register-checkout] Stripe customer error:", err)
    // Non-fatal
  }

  // ── Create Stripe Checkout Session ────────────────────────────────────────
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"

  try {
    const session = await stripe.checkout.sessions.create({
      mode:       "payment",
      line_items: [{ price: plan.stripePriceId, quantity: 1 }],
      success_url: `${appUrl}/api/stripe/complete-registration?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url:  `${appUrl}/pricing?checkout=cancel`,
      ...(stripeCustomerId
        ? { customer: stripeCustomerId }
        : { customer_email: email }),
      metadata: {
        user_id:           userId,
        plan_id:           plan.id,
        report_limit:      String(plan.reportLimit),
        identity_limit:    String(plan.identityLimit),
        jurisdiction_limit: String(plan.jurisdictionLimit),
      },
      payment_intent_data: {
        metadata: { user_id: userId, plan_id: plan.id },
      },
    })

    return NextResponse.json({ url: session.url })
  } catch (err) {
    console.error("[register-checkout] Stripe session creation failed:", err)

    // Clean up the auth user so the same email can retry
    await adminSupabase.auth.admin.deleteUser(userId)

    return NextResponse.json(
      { error: "Failed to create checkout session. Please try again." },
      { status: 500 }
    )
  }
}