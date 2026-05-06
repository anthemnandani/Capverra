import { type NextRequest, NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient()
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    // Unauthenticated → return demo identities so the table has data in live demo mode
    if (userError || !user) {
      const demoIdentities = [
        {
          id: "demo_identity_1",
          user_id: null,
          name: "Alex Rivera",
          type: "individual",
          citizenship: ["United States"],
          residency: "California, USA",
          risk_profile: "medium",
          goals: ["Wealth preservation", "Tax efficiency", "Succession planning"],
          additional_information:
            "CFO at growth-stage tech company with significant equity exposure across multiple jurisdictions.",
          notes: "Prefers concise quarterly updates and scenario-based planning.",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: "demo_identity_2",
          user_id: null,
          name: "Cascadia Holdings LP",
          type: "entity",
          citizenship: ["Canada"],
          residency: "Vancouver, Canada",
          risk_profile: "low",
          goals: ["Capital preservation", "Steady income"],
          additional_information:
            "Family investment partnership with a focus on income-producing real estate and infrastructure.",
          notes: "Highly sensitive to drawdowns; mandate favors stable cash flows over aggressive growth.",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: "demo_identity_3",
          user_id: null,
          name: "The Horizon Trust",
          type: "trust",
          citizenship: ["United Kingdom"],
          residency: "London, UK",
          risk_profile: "aggressive",
          goals: ["Long-term growth", "Next-generation wealth transfer"],
          additional_information:
            "Multi-generational discretionary trust with a mandate to allocate to higher-growth alternative assets.",
          notes: "Trustees require detailed reporting and narrative around risk and liquidity.",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ]

      return NextResponse.json(demoIdentities)
    }

    // Authenticated → use real Supabase-backed identities
    const { data: identities, error } = await supabase
      .from("identities")
      .select("*")
      .order("created_at", { ascending: false })

    if (error) {
      throw error
    }

    return NextResponse.json(identities)
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json(
      {
        error: "Failed to fetch identities",
        details: errorMessage,
        timestamp: new Date().toISOString(),
      },
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient()
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()

    const { data: newIdentity, error } = await supabase
      .from("identities")
      .insert({
        user_id: user.id,
        name: body.name,
        type: body.type,
        citizenship: body.citizenship,
        residency: body.residency,
        risk_profile: body.risk_profile,
        goals: body.goals,
        additional_information: body.additional_information,
        notes: body.notes,
      })
      .select("*")
      .single()

    if (error) {
      throw error
    }

    return NextResponse.json(newIdentity, { status: 201 })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json(
      {
        error: "Failed to create identity",
        details: errorMessage,
        timestamp: new Date().toISOString(),
      },
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      },
    )
  }
}
