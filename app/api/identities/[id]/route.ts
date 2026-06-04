import { type NextRequest, NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase/server"

// ── PATCH /api/identities/[id] ────────────────────────────────────────────────
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = params
    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 })
    }

    const body = await request.json()

    if (body.name !== undefined && !body.name?.trim()) {
      return NextResponse.json({ error: "name cannot be empty" }, { status: 400 })
    }

    const risk = body.risk_profile ?? "medium"

    const updatePayload: Record<string, unknown> = {
      name:                   body.name?.trim(),
      type:                   body.type,
      citizenship:            body.primary_citizenship ? [body.primary_citizenship] : (body.citizenship ?? []),
      residency:              body.current_residency ?? body.residency ?? null,
      risk_profile:           risk,
      goals:                  body.goals ?? [],
      additional_information: body.additional_information ?? null,
      notes:                  body.notes ?? null,
      updated_at:             new Date().toISOString(),
      primary_citizenship:    body.primary_citizenship ?? null,
      other_citizenships:     body.other_citizenships  ?? [],
      current_residency:      body.current_residency   ?? null,
      state_province:         body.state_province      ?? null,
      // new fields
      tax_rate:               body.tax_rate != null ? Number(body.tax_rate) : null,
      annual_income:          body.annual_income != null ? Number(body.annual_income) : null,
    }

    const { data: updated, error } = await supabase
      .from("identities")
      .update(updatePayload)
      .eq("id", id)
      .eq("user_id", user.id)
      .select("*")
      .single()

    if (error) throw error

    if (!updated) {
      return NextResponse.json(
        { error: "Identity not found or not owned by current user" },
        { status: 404 },
      )
    }

    return NextResponse.json(updated)
  } catch (error) {
    console.error("[PATCH /api/identities/:id]", error)
    return NextResponse.json(
      { error: "Failed to update identity", details: error instanceof Error ? error.message : "Unknown" },
      { status: 500 },
    )
  }
}

// ── DELETE /api/identities/[id] (Soft Delete) ───────────────────────────────
export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const supabase = await createSupabaseServerClient()

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = params

    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 })
    }

    const { data, error } = await supabase
      .from("identities")
      .update({
        is_deleted: true,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("user_id", user.id)
      .eq("is_deleted", false)
      .select("id")
      .single()

    if (error) throw error

    if (!data) {
      return NextResponse.json(
        { error: "Identity not found or already deleted" },
        { status: 404 },
      )
    }

    return NextResponse.json({
      success: true,
      message: "Identity deleted successfully",
    })
  } catch (error) {
    console.error("[DELETE /api/identities/:id]", error)

    return NextResponse.json(
      {
        error: "Failed to delete identity",
        details: error instanceof Error ? error.message : "Unknown",
      },
      { status: 500 },
    )
  }
}