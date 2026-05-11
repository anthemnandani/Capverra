import { type NextRequest, NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

// ── GET /api/identities ───────────────────────────────────────────────────────
export async function GET() {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json([])
    }

    const { data: identities, error } = await supabase
      .from("identities")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })

    if (error) throw error
    return NextResponse.json(identities ?? [])
  } catch (error) {
    console.error("[GET /api/identities]", error)
    return NextResponse.json(
      { error: "Failed to fetch identities", details: error instanceof Error ? error.message : "Unknown" },
      { status: 500 },
    )
  }
}

// ── POST /api/identities ──────────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()

    if (!body.name?.trim()) {
      return NextResponse.json({ error: "name is required" }, { status: 400 })
    }
    if (!body.type) {
      return NextResponse.json({ error: "type is required" }, { status: 400 })
    }

    const risk = body.risk_profile ?? "medium"

    const insertPayload: Record<string, unknown> = {
      user_id:                user.id,
      name:                   body.name.trim(),
      type:                   body.type,
      citizenship:            body.primary_citizenship ? [body.primary_citizenship] : (body.citizenship ?? []),
      residency:              body.current_residency ?? body.residency ?? null,
      risk_profile:           risk,
      goals:                  body.goals ?? [],
      additional_information: body.additional_information ?? null,
      notes:                  body.notes ?? null,
      primary_citizenship:    body.primary_citizenship ?? null,
      other_citizenships:     body.other_citizenships  ?? [],
      current_residency:      body.current_residency   ?? null,
      state_province:         body.state_province      ?? null,
      tax_rate:               body.tax_rate != null ? Number(body.tax_rate) : null,
      annual_income:          body.annual_income != null ? Number(body.annual_income) : null,
    }

    const { data: newIdentity, error } = await supabase
      .from("identities")
      .insert(insertPayload)
      .select("*")
      .single()

    if (error) throw error
    return NextResponse.json(newIdentity, { status: 201 })
  } catch (error) {
    console.error("[POST /api/identities]", error)
    return NextResponse.json(
      { error: "Failed to create identity", details: error instanceof Error ? error.message : "Unknown" },
      { status: 500 },
    )
  }
}