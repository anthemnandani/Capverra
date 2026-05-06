import { type NextRequest, NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

function withCalculations(asset: any) {
  const purchaseValue = Number(asset.purchase_value ?? 0)
  const latestValuation = Number(asset.latest_valuation ?? 0)
  const hasValues = purchaseValue > 0 && latestValuation > 0
  const valueChangeAmount = hasValues ? latestValuation - purchaseValue : null
  const valueChangePercentage = hasValues ? ((latestValuation - purchaseValue) / purchaseValue) * 100 : null

  return {
    ...asset,
    value_change_amount: valueChangeAmount,
    value_change_percentage: valueChangePercentage,
  }
}

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient()
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    // Unauthenticated → return demo assets so the table has data in live demo mode
    if (userError || !user) {
      const demoAssets = [
        withCalculations({
          id: "demo_asset_1",
          user_id: null,
          name: "San Francisco Office Tower",
          type: "Real Estate",
          owner_id: "demo_identity_2",
          owner: {
            id: "demo_identity_2",
            name: "Cascadia Holdings LP",
            type: "entity",
          },
          location_state: "California",
          location_country: "United States",
          purchase_value: 45_000_000,
          purchase_date: "2018-05-15",
          latest_valuation: 58_000_000,
          latest_valuation_date: "2025-12-31",
          created_at: "2018-05-15T00:00:00.000Z",
          updated_at: "2025-12-31T00:00:00.000Z",
        }),
        withCalculations({
          id: "demo_asset_2",
          user_id: null,
          name: "Global Equity Allocation",
          type: "Stocks",
          owner_id: "demo_identity_1",
          owner: {
            id: "demo_identity_1",
            name: "Alex Rivera",
            type: "individual",
          },
          location_state: "",
          location_country: "Global",
          purchase_value: 3_500_000,
          purchase_date: "2021-01-01",
          latest_valuation: 4_200_000,
          latest_valuation_date: "2025-12-31",
          created_at: "2021-01-01T00:00:00.000Z",
          updated_at: "2025-12-31T00:00:00.000Z",
        }),
        withCalculations({
          id: "demo_asset_3",
          user_id: null,
          name: "Emerging Markets Infrastructure Bonds",
          type: "Bonds",
          owner_id: "demo_identity_3",
          owner: {
            id: "demo_identity_3",
            name: "The Horizon Trust",
            type: "trust",
          },
          location_state: "",
          location_country: "Multi-region",
          purchase_value: 12_000_000,
          purchase_date: "2020-09-30",
          latest_valuation: 11_400_000,
          latest_valuation_date: "2025-12-31",
          created_at: "2020-09-30T00:00:00.000Z",
          updated_at: "2025-12-31T00:00:00.000Z",
        }),
      ]

      return NextResponse.json(demoAssets)
    }

    // Authenticated → use real Supabase-backed assets
    const { data: assets, error } = await supabase
      .from("assets")
      .select("*, owner:identities(id,name,type)")
      .order("created_at", { ascending: false })

    if (error) {
      throw error
    }

    const formattedAssets = (assets ?? []).map(withCalculations)

    return NextResponse.json(formattedAssets)
  } catch (error) {
    console.error("Error fetching assets:", error)
    return NextResponse.json({ error: "Failed to fetch assets" }, { status: 500 })
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

    const { data: newAsset, error } = await supabase
      .from("assets")
      .insert({
        user_id: user.id,
        name: body.name,
        type: body.type,
        owner_id: body.owner_id,
        location_state: body.location_state,
        location_country: body.location_country,
        purchase_value: body.purchase_value,
        purchase_date: body.purchase_date,
        latest_valuation: body.latest_valuation,
        latest_valuation_date: body.latest_valuation_date,
      })
      .select("*, owner:identities(id,name,type)")
      .single()

    if (error) {
      throw error
    }

    return NextResponse.json(withCalculations(newAsset), { status: 201 })
  } catch (error) {
    console.error("Error creating asset:", error)
    return NextResponse.json({ error: "Failed to create asset" }, { status: 500 })
  }
}
