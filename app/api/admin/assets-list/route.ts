import { createSupabaseAdminClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "20")
    const search = searchParams.get("search") || undefined
    const assetType = searchParams.get("type") || undefined

    const adminClient = createSupabaseAdminClient()
    const offset = (page - 1) * limit

    let query = adminClient
      .from("assets")
      .select(
        `
        id,
        name,
        type,
        location_country,
        location_state,
        purchase_value,
        purchase_date,
        latest_valuation,
        latest_valuation_date,
        created_at,
        updated_at,
        user_id
      `,
        { count: "exact" }
      )

    if (search) {
      query = query.ilike("name", `%${search}%`)
    }

    if (assetType && assetType !== "all") {
      query = query.eq("type", assetType)
    }

    const { data, count, error } = await query
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Get user information separately for each asset
    const assets = []
    for (const asset of data || []) {
      // Get user email from auth
      const { data: user } = await adminClient.auth.admin.getUserById(asset.user_id)

      let performance = null
      if (asset.latest_valuation && asset.purchase_value) {
        performance = ((asset.latest_valuation - asset.purchase_value) / asset.purchase_value) * 100
      }

      assets.push({
        id: asset.id,
        name: asset.name,
        type: asset.type,
        location_country: asset.location_country,
        location_state: asset.location_state,
        purchase_value: asset.purchase_value,
        purchase_date: asset.purchase_date,
        latest_valuation: asset.latest_valuation,
        latest_valuation_date: asset.latest_valuation_date,
        performance: performance,
        created_at: asset.created_at,
        updated_at: asset.updated_at,
        owner: user
          ? {
              id: user.id,
              name: user.user_metadata?.name || "—",
              email: user.email,
            }
          : null,
      })
    }

    return NextResponse.json({
      assets,
      total: count || 0,
      totalPages: Math.ceil((count || 0) / limit),
    })
  } catch (error) {
    console.error("Error fetching assets:", error)
    return NextResponse.json(
      { error: "Failed to fetch assets" },
      { status: 500 }
    )
  }
}
