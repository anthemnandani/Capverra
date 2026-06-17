// POST /api/stripe/webhook
// Handles Stripe webhook events — idempotent, uses admin client (no user session)

import { type NextRequest, NextResponse } from "next/server"
import { createSupabaseAdminClient } from "@/lib/supabase/server"
import { stripe } from "@/lib/stripe/client"
import { getPlan } from "@/lib/plans"
import type Stripe from "stripe"

export const dynamic = "force-dynamic"

// Stripe requires raw body for signature verification
export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = request.headers.get("stripe-signature")

  if (!signature) {
    return NextResponse.json({ error: "Missing stripe-signature" }, { status: 400 })
  }

  // ── Verify webhook signature ──────────────────────────────────────────────
  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err) {
    console.error("[webhook] Signature verification failed:", err)
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
  }

  const adminSupabase = createSupabaseAdminClient()

  // ── Idempotency check — same event dobara process na ho ──────────────────
  const { data: existingLog } = await adminSupabase
    .from("payment_logs")
    .select("id")
    .eq("stripe_event_id", event.id)
    .single()

  if (existingLog) {
    // Already processed
    return NextResponse.json({ received: true, duplicate: true })
  }

  // ── Route events ──────────────────────────────────────────────────────────
  try {
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutCompleted(
          event.data.object as Stripe.Checkout.Session,
          event.id,
          adminSupabase
        )
        break

      case "payment_intent.payment_failed":
        await handlePaymentFailed(
          event.data.object as Stripe.PaymentIntent,
          event.id,
          adminSupabase
        )
        break

      default:
        // Log unhandled events for visibility
        await adminSupabase.from("payment_logs").insert({
          event_type: `unhandled.${event.type}`,
          stripe_event_id: event.id,
          stripe_object_id: (event.data.object as any).id ?? null,
          metadata: { event_type: event.type },
        })
    }
  } catch (err) {
    console.error(`[webhook] Error handling ${event.type}:`, err)

    // Log error but return 200 so Stripe doesn't retry infinitely
    await adminSupabase.from("payment_logs").insert({
      event_type: `error.${event.type}`,
      stripe_event_id: `${event.id}_error`,
      error_message: err instanceof Error ? err.message : String(err),
      metadata: { event_type: event.type, event_id: event.id },
    })
  }

  return NextResponse.json({ received: true })
}

// ── checkout.session.completed ────────────────────────────────────────────────
async function handleCheckoutCompleted(
  session: Stripe.Checkout.Session,
  eventId: string,
  adminSupabase: ReturnType<typeof createSupabaseAdminClient>
) {
  const { user_id, plan_id, report_limit } = session.metadata ?? {}

  if (!user_id || !plan_id) {
    console.error("[webhook] Missing metadata in checkout session:", session.id)
    return
  }

  const plan = getPlan(plan_id)
  const reportsTotal = report_limit ? parseInt(report_limit, 10) : plan.reportLimit
  const amountPaid = session.amount_total ? session.amount_total / 100 : plan.price
  const stripeCustomerId = typeof session.customer === "string"
    ? session.customer
    : session.customer?.id ?? null

  // ── Insert purchase row ───────────────────────────────────────────────────
  const { data: purchase, error: purchaseError } = await adminSupabase
    .from("user_plan_purchases")
    .insert({
      user_id,
      plan_id,
      stripe_session_id: session.id,
      stripe_payment_intent:
        typeof session.payment_intent === "string"
          ? session.payment_intent
          : session.payment_intent?.id ?? null,
      stripe_customer_id: stripeCustomerId,
      amount_paid: amountPaid,
      currency: session.currency ?? "usd",
      reports_total: reportsTotal,
      reports_used: 0,
      status: "active",
      purchased_at: new Date().toISOString(),
    })
    .select("id")
    .single()

  if (purchaseError || !purchase) {
    console.error("[webhook] Failed to insert purchase:", purchaseError)
    throw new Error(`Purchase insert failed: ${purchaseError?.message}`)
  }

  // ── Update users table ────────────────────────────────────────────────────
  const { error: userUpdateError } = await adminSupabase
    .from("users")
    .update({
      plan_name: plan_id,
      subscription_status: "active",
      stripe_customer_id: stripeCustomerId,
      active_purchase_id: purchase.id,
      updated_at: new Date().toISOString(),
    })
    .eq("id", user_id)

  if (userUpdateError) {
    console.error("[webhook] Failed to update user:", userUpdateError)
    throw new Error(`User update failed: ${userUpdateError.message}`)
  }

  // ── Log success ───────────────────────────────────────────────────────────
  await adminSupabase.from("payment_logs").insert({
    user_id,
    purchase_id: purchase.id,
    event_type: "payment.succeeded",
    stripe_event_id: eventId,
    stripe_object_id: session.id,
    amount: amountPaid,
    currency: session.currency ?? "usd",
    metadata: {
      plan_id,
      reports_total: reportsTotal,
      stripe_customer_id: stripeCustomerId,
    },
  })

  console.log(
    `[webhook] ✓ Purchase activated — user: ${user_id}, plan: ${plan_id}, purchase: ${purchase.id}`
  )
}

// ── payment_intent.payment_failed ─────────────────────────────────────────────
async function handlePaymentFailed(
  paymentIntent: Stripe.PaymentIntent,
  eventId: string,
  adminSupabase: ReturnType<typeof createSupabaseAdminClient>
) {
  const userId = paymentIntent.metadata?.user_id ?? null
  const planId = paymentIntent.metadata?.plan_id ?? null

  await adminSupabase.from("payment_logs").insert({
    user_id: userId,
    event_type: "payment.failed",
    stripe_event_id: eventId,
    stripe_object_id: paymentIntent.id,
    amount: paymentIntent.amount ? paymentIntent.amount / 100 : null,
    currency: paymentIntent.currency,
    error_message:
      paymentIntent.last_payment_error?.message ?? "Payment failed",
    metadata: {
      plan_id: planId,
      failure_code: paymentIntent.last_payment_error?.code ?? null,
    },
  })

  console.log(
    `[webhook] ✗ Payment failed — user: ${userId}, plan: ${planId}, intent: ${paymentIntent.id}`
  )
}