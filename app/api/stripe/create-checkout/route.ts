// POST /api/stripe/create-checkout
// Creates a Stripe Checkout Session for one-time plan purchase

import { type NextRequest, NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { createSupabaseAdminClient } from "@/lib/supabase/server"
import { stripe } from "@/lib/stripe/client"
import { getPlan, type PlanId } from "@/lib/plans"

export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
  // ── Auth ──────────────────────────────────────────────────────────────────
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // ── Parse body ────────────────────────────────────────────────────────────
  let planId: PlanId
  try {
    const body = await request.json()
    planId = body.plan_id
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
  }

  const plan = getPlan(planId)

  if (!plan.stripePriceId || plan.id === "free") {
    return NextResponse.json(
      { error: "Invalid plan selected" },
      { status: 400 }
    )
  }

  // ── Fetch user from DB ────────────────────────────────────────────────────
  const adminSupabase = createSupabaseAdminClient()
  const { data: userData, error: userError } = await adminSupabase
    .from("users")
    .select("id, email, name, stripe_customer_id")
    .eq("id", user.id)
    .single()

  if (userError || !userData) {
    return NextResponse.json({ error: "User not found" }, { status: 404 })
  }

  // ── Get or create Stripe customer ─────────────────────────────────────────
  let stripeCustomerId = userData.stripe_customer_id

  if (!stripeCustomerId) {
    const customer = await stripe.customers.create({
      email: userData.email,
      name: userData.name ?? undefined,
      metadata: { supabase_user_id: user.id },
    })
    stripeCustomerId = customer.id

    // Save customer ID immediately
    await adminSupabase
      .from("users")
      .update({ stripe_customer_id: stripeCustomerId, updated_at: new Date().toISOString() })
      .eq("id", user.id)
  }

  // ── Create Checkout Session ───────────────────────────────────────────────
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? `https://${request.headers.get("host")}`
console.log("Selected Plan:", planId)
console.log("Stripe Price ID:", plan.stripePriceId)
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    customer: stripeCustomerId,
    line_items: [
      {
        price: plan.stripePriceId,
        quantity: 1,
      },
    ],
    success_url: `${appUrl}/assets?checkout=success&plan=${planId}`,
    cancel_url: `${appUrl}/assets?checkout=cancel`,
    metadata: {
      user_id: user.id,
      plan_id: planId,
      report_limit: String(plan.reportLimit),
      identity_limit: String(plan.identityLimit),
      jurisdiction_limit: String(plan.jurisdictionLimit),
    },
    payment_intent_data: {
      metadata: {
        user_id: user.id,
        plan_id: planId,
      },
    },
  })

  // ── Log checkout created ──────────────────────────────────────────────────
  await adminSupabase.from("payment_logs").insert({
    user_id: user.id,
    event_type: "checkout.created",
    stripe_object_id: session.id,
    amount: plan.price,
    currency: "usd",
    metadata: {
      plan_id: planId,
      session_id: session.id,
      stripe_customer_id: stripeCustomerId,
    },
  })

  return NextResponse.json({ url: session.url })
}