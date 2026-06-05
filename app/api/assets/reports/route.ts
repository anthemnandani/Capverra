// app/api/assets/reports/route.ts
import { type NextRequest, NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

// ── GET /api/assets/reports?assetId=xxx ─────────────────────────────────────────────
export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const assetId = request.nextUrl.searchParams.get("assetId")
    if (!assetId) {
      return NextResponse.json({ error: "assetId is required" }, { status: 400 })
    }

    const { data, error } = await supabase
      .from("optimization_reports")
      .select("*")
      .eq("user_id", user.id)
      .eq("asset_id", assetId)
      .eq("is_deleted", false)
      .order("generated_at", { ascending: false })

    if (error) throw error
    return NextResponse.json(data ?? [])
  } catch (err) {
    console.error("[GET /api/assets/reports]", err)
    return NextResponse.json({ error: "Failed to fetch reports" }, { status: 500 })
  }
}

// ── POST /api/assets/reports ─────────────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const {
      asset_id,
      asset_name,
      estimated_savings,
      currency,
      summary,
      identities,
      jurisdictions,
      report_data,
    } = body

    if (!asset_id || !asset_name || !report_data) {
      return NextResponse.json(
        { error: "asset_id, asset_name, and report_data are required" },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from("optimization_reports")
      .insert({
        user_id: user.id,
        asset_id,
        asset_name,
        estimated_savings: Math.round(estimated_savings ?? 0),
        currency: currency ?? "USD",
        summary: summary ?? "",
        identities: identities ?? [],
        jurisdictions: jurisdictions ?? [],
        report_data,
      })
      .select()
      .single()

    if (error) throw error
    return NextResponse.json(data, { status: 201 })
  } catch (err) {
    console.error("[POST /api/assets/reports]", err)
    return NextResponse.json({ error: "Failed to save report" }, { status: 500 })
  }
}

// ── DELETE /api/assets/reports?id=xxx ────────────────────────────────────────────────
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const id = request.nextUrl.searchParams.get("id")
    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 })
    }

    const { error } = await supabase
      .from("optimization_reports")
      .update({ is_deleted: true })
      .eq("id", id)
      .eq("user_id", user.id)

    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("[DELETE /api/assets/reports]", err)
    return NextResponse.json({ error: "Failed to delete report" }, { status: 500 })
  }
}