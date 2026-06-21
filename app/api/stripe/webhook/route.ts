/**
 * POST /api/stripe/webhook
 *
 * Handles Stripe webhook events — idempotent, admin client only.
 *
 * Two paths:
 *  A) user_id in metadata         → existing user upgrade (dashboard flow)
 *  B) user_id in metadata         → new registration (pricing page flow)
 *     Both are the same now — auth user always exists before checkout.
 *
 * Race-safety note: complete-registration (the success_url redirect) and
 * this webhook can both try to insert the same purchase row at nearly the
 * same time. A unique constraint on user_plan_purchases.stripe_session_id
 * (see migration 001_unique_stripe_session_id.sql) makes the DB reject the
 * second insert instead of creating a duplicate. handleCheckoutCompleted
 * below catches that specific conflict (Postgres code 23505) and falls
 * back to reading the row the other path already created.
 */

import { type NextRequest, NextResponse } from "next/server"
import { createSupabaseAdminClient } from "@/lib/supabase/server"
import { stripe } from "@/lib/stripe/client"
import { getPlan } from "@/lib/plans"
import type Stripe from "stripe"

export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
  const body      = await request.text()
  const signature = request.headers.get("stripe-signature")

  if (!signature) {
    return NextResponse.json({ error: "Missing stripe-signature" }, { status: 400 })
  }

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

  // ── Idempotency check ─────────────────────────────────────────────────────
  const { data: existingLog } = await adminSupabase
    .from("payment_logs")
    .select("id")
    .eq("stripe_event_id", event.id)
    .single()

  if (existingLog) {
    return NextResponse.json({ received: true, duplicate: true })
  }

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
        await adminSupabase.from("payment_logs").insert({
          event_type:       `unhandled.${event.type}`,
          stripe_event_id:  event.id,
          stripe_object_id: (event.data.object as any).id ?? null,
          metadata:         { event_type: event.type },
        })
    }
  } catch (err) {
    console.error(`[webhook] Error handling ${event.type}:`, err)
    await adminSupabase.from("payment_logs").insert({
      event_type:       `error.${event.type}`,
      stripe_event_id:  `${event.id}_error`,
      error_message:    err instanceof Error ? err.message : String(err),
      metadata:         { event_type: event.type, event_id: event.id },
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
    console.warn("[webhook] checkout.session.completed: missing user_id or plan_id in metadata", session.id)
    return
  }

  const plan             = getPlan(plan_id)
  const reportsTotal     = report_limit ? parseInt(report_limit, 10) : plan.reportLimit
  const amountPaid       = session.amount_total ? session.amount_total / 100 : plan.price
  const stripeCustomerId = typeof session.customer === "string" ? session.customer : null
  const paymentIntent    = typeof session.payment_intent === "string" ? session.payment_intent : null

  // ── Idempotency: skip if purchase row already exists ──────────────────────
  const { data: existingPurchase } = await adminSupabase
    .from("user_plan_purchases")
    .select("id")
    .eq("stripe_session_id", session.id)
    .single()

  let purchaseId: string

  if (existingPurchase) {
    // complete-registration route already saved it
    purchaseId = existingPurchase.id
    console.log("[webhook] Purchase already exists (created by redirect route):", purchaseId)
  } else {
    const { data: purchase, error: purchaseError } = await adminSupabase
      .from("user_plan_purchases")
      .insert({
        user_id,
        plan_id,
        stripe_session_id:     session.id,
        stripe_payment_intent: paymentIntent,
        stripe_customer_id:    stripeCustomerId,
        amount_paid:           amountPaid,
        currency:              session.currency ?? "usd",
        reports_total:         reportsTotal,
        reports_used:          0,
        status:                "active",
        purchased_at:          new Date().toISOString(),
      })
      .select("id")
      .single()

    if (purchaseError) {
      // Race condition: complete-registration's redirect inserted the row
      // in between our existence check and our insert. The unique
      // constraint on stripe_session_id rejects us with code 23505 —
      // that's expected here, not a real failure. Just read the row
      // the other path created and continue normally.
      const isUniqueViolation =
        (purchaseError as any)?.code === "23505" ||
        purchaseError.message?.toLowerCase().includes("duplicate key")

      if (isUniqueViolation) {
        console.log("[webhook] Race detected on insert — fetching row created by the other path:", session.id)
        const { data: raceWinner, error: refetchError } = await adminSupabase
          .from("user_plan_purchases")
          .select("id")
          .eq("stripe_session_id", session.id)
          .single()

        if (refetchError || !raceWinner) {
          console.error("[webhook] Could not fetch purchase row after unique-violation race:", refetchError)
          throw new Error(`Purchase insert failed (race, then refetch failed): ${refetchError?.message}`)
        }

        purchaseId = raceWinner.id
      } else {
        console.error("[webhook] Failed to insert purchase:", purchaseError)
        throw new Error(`Purchase insert failed: ${purchaseError.message}`)
      }
    } else if (!purchase) {
      throw new Error("Purchase insert returned no data and no error")
    } else {
      purchaseId = purchase.id
    }
  }

  // ── Always update users table (idempotent) ────────────────────────────────
  await adminSupabase
    .from("users")
    .update({
      plan_name:           plan_id,
      subscription_status: "active",
      active_purchase_id:  purchaseId,
      ...(stripeCustomerId ? { stripe_customer_id: stripeCustomerId } : {}),
      updated_at:          new Date().toISOString(),
    })
    .eq("id", user_id)

  // ── Log ───────────────────────────────────────────────────────────────────
  await adminSupabase.from("payment_logs").insert({
    user_id,
    purchase_id:      purchaseId,
    event_type:       "payment.succeeded",
    stripe_event_id:  eventId,
    stripe_object_id: session.id,
    amount:           amountPaid,
    currency:         session.currency ?? "usd",
    metadata: {
      plan_id,
      reports_total:     reportsTotal,
      stripe_customer_id: stripeCustomerId,
    },
  })

  console.log(`[webhook] ✓ Purchase activated — user: ${user_id}, plan: ${plan_id}, purchase: ${purchaseId}`)
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
    user_id:          userId,
    event_type:       "payment.failed",
    stripe_event_id:  eventId,
    stripe_object_id: paymentIntent.id,
    amount:           paymentIntent.amount ? paymentIntent.amount / 100 : null,
    currency:         paymentIntent.currency,
    error_message:    paymentIntent.last_payment_error?.message ?? "Payment failed",
    metadata: {
      plan_id,
      failure_code: paymentIntent.last_payment_error?.code ?? null,
    },
  })

  console.log(`[webhook] ✗ Payment failed — user: ${userId}, plan: ${planId}`)
}