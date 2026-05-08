import { type NextRequest, NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

// ── Demo data (unauthenticated) ───────────────────────────────────────────────
const DEMO_IDENTITIES = [
  {
    id: "demo_1", user_id: null,
    name: "James van der Berg", type: "individual",
    // legacy columns
    citizenship: ["ZA"], residency: "ZA",
    // new columns
    primary_citizenship: "ZA", other_citizenships: [] as string[], current_residency: "ZA",
    state_province: "Western Cape",
    risk_profile: "medium",
    goals: ["reduce-taxes-now", "asset-protection", "retirement-planning"],
    additional_information: "Primary residence in South Africa, secondary in UK.",
    notes: "",
    created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
  },
  {
    id: "demo_2", user_id: null,
    name: "Offshore Holdings Ltd", type: "llc",
    citizenship: ["IM"], residency: "IM",
    primary_citizenship: "IM", other_citizenships: [] as string[], current_residency: "IM",
    state_province: "Douglas",
    risk_profile: "aggressive",
    goals: ["reduce-taxes-now", "asset-protection", "increase-cashflow"],
    additional_information: "Offshore holding company.",
    notes: "",
    created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
  },
  {
    id: "demo_3", user_id: null,
    name: "Van der Berg Family Trust", type: "trust",
    citizenship: ["VG"], residency: "VG",
    primary_citizenship: "VG", other_citizenships: [] as string[], current_residency: "VG",
    state_province: "Road Town",
    risk_profile: "low",
    goals: ["inheritance-tax", "estate-planning", "asset-protection"],
    additional_information: "Multi-generational family trust.",
    notes: "",
    created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
  },
]

// ── GET /api/identities ───────────────────────────────────────────────────────
export async function GET() {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json(DEMO_IDENTITIES)
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

    // Map "high" → "aggressive" for DB constraint compatibility
   const risk = body.risk_profile ?? "medium"

    const insertPayload: Record<string, unknown> = {
      user_id:                user.id,
      name:                   body.name.trim(),
      type:                   body.type,
      // legacy columns (always kept in sync)
      citizenship:            body.primary_citizenship ? [body.primary_citizenship] : (body.citizenship ?? []),
      residency:              body.current_residency ?? body.residency ?? null,
      risk_profile:           risk,
      goals:                  body.goals ?? [],
      additional_information: body.additional_information ?? null,
      notes:                  body.notes ?? null,
    }

    // New columns — only insert if they exist in DB (after migration)
    // We always send them; if the column doesn't exist yet Supabase will error
    // → run migration.sql first, then these will work fine
    insertPayload.primary_citizenship = body.primary_citizenship ?? null
    insertPayload.other_citizenships  = body.other_citizenships  ?? []
    insertPayload.current_residency   = body.current_residency   ?? null
    insertPayload.state_province      = body.state_province      ?? null

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