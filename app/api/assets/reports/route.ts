// POST /api/assets/reports
// Saves optimization report + consumes one report credit from active purchase

import { type NextRequest, NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase/server"

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
  let body: {
    asset_id: string
    asset_name: string
    estimated_savings: number
    currency: string
    summary: string
    identities: Array<{ name: string; type: string }>
    jurisdictions: Array<{ name: string; code: string }>
    report_data: Record<string, unknown>
  }

  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  // ── Get user's active purchase ────────────────────────────────────────────
  const { data: userData, error: userError } = await supabase
    .from("users")
    .select("plan_name, subscription_status, active_purchase_id")
    .eq("id", user.id)
    .single()

  if (userError || !userData) {
    return NextResponse.json({ error: "User not found" }, { status: 404 })
  }

  // ── Check report limit (double-check server side) ─────────────────────────
  if (userData.active_purchase_id) {
    const { data: purchase } = await supabase
      .from("user_plan_purchases")
      .select("reports_used, reports_total, status")
      .eq("id", userData.active_purchase_id)
      .single()

    if (purchase && purchase.status !== "active") {
      return NextResponse.json(
        { error: "Your current plan is exhausted. Please upgrade to continue." },
        { status: 403 }
      )
    }

    if (purchase && purchase.reports_used >= purchase.reports_total) {
      return NextResponse.json(
        { error: "Report limit reached. Please upgrade your plan." },
        { status: 403 }
      )
    }
  } else if (userData.plan_name === "free" || !userData.plan_name) {
    // Free plan — check if already used the 1 free report
    const { count } = await supabase
      .from("optimization_reports")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("is_deleted", false)

    if ((count ?? 0) >= 1) {
      return NextResponse.json(
        { error: "Free plan limit reached. Please upgrade to generate more reports." },
        { status: 403 }
      )
    }
  }

  // ── Save the report ───────────────────────────────────────────────────────
  const { data: report, error: reportError } = await supabase
    .from("optimization_reports")
    .insert({
      user_id: user.id,
      asset_id: body.asset_id,
      asset_name: body.asset_name,
      estimated_savings: body.estimated_savings,
      currency: body.currency,
      summary: body.summary,
      identities: body.identities,
      jurisdictions: body.jurisdictions,
      report_data: body.report_data,
      generated_at: new Date().toISOString(),
      is_deleted: false,
    })
    .select("id")
    .single()

  if (reportError || !report) {
    console.error("[reports] Insert failed:", reportError)
    return NextResponse.json(
      { error: "Failed to save report" },
      { status: 500 }
    )
  }

  // ── Consume one report credit (non-free plans) ────────────────────────────
  if (userData.active_purchase_id) {
    const { error: consumeError } = await supabase.rpc("consume_report", {
      p_purchase_id: userData.active_purchase_id,
    })

    if (consumeError) {
      // Report is saved — don't fail the request, just log
      console.error("[reports] consume_report RPC failed:", consumeError)
    }
  }

  return NextResponse.json({ id: report.id }, { status: 201 })
}

// ── GET — fetch reports for an asset ─────────────────────────────────────────
export async function GET(request: NextRequest) {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const assetId = searchParams.get("asset_id")

  if (!assetId) {
    return NextResponse.json({ error: "asset_id is required" }, { status: 400 })
  }

  const { data: reports, error } = await supabase
    .from("optimization_reports")
    .select(
      "id, asset_name, estimated_savings, currency, summary, identities, jurisdictions, report_data, generated_at, created_at"
    )
    .eq("user_id", user.id)
    .eq("asset_id", assetId)
    .eq("is_deleted", false)
    .order("generated_at", { ascending: false })

  if (error) {
    return NextResponse.json({ error: "Failed to fetch reports" }, { status: 500 })
  }

  return NextResponse.json(reports)
}