
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
        currency,
        created_at,
        updated_at,
        user_id,
        owner_id
      `,
        //  ADDED: owner_id in select query
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

    //  ADDED: Fetch all identities in ONE query (avoids N+1 problem)
    const ownerIds = (data || []).map((a: any) => a.owner_id).filter(Boolean)

    const { data: identities } = await adminClient
      .from("identities")
      .select("id, name, type")
      .in("id", ownerIds)

    //  ADDED: Map for quick lookup — { identity_id: identity }
    const identityMap = Object.fromEntries(
      identities?.map((i: any) => [i.id, i]) || []
    )

    // Get user information separately for each asset
    const assets = []
    for (const asset of data || []) {
      // Get user email from auth
      const { data: user } = await adminClient.auth.admin.getUserById(asset.user_id)

      //  ADDED: Get identity (owner) from map
      const identity = identityMap[asset.owner_id]

      let performance = null
      if (asset.latest_valuation && asset.purchase_value) {
        performance = ((asset.latest_valuation - asset.purchase_value) / asset.purchase_value) * 100
      }

      //  REMOVED: ownerName from user_metadata (was wrong source)
      const ownerEmail = user?.email || "N/A"

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
        currency: asset.currency,
        performance: performance,
        created_at: asset.created_at,
        updated_at: asset.updated_at,
        user_id: asset.user_id,
        user_email: ownerEmail,
        user_name: identity?.name || "—", //  CHANGED: now from identities table
        owner: {
          id: identity?.id || null,
          name: identity?.name || "—",   //  CHANGED: identities.name (e.g. "Tom Jones")
          type: identity?.type || "—",   //  ADDED: identity type (individual/trust/llc)
          email: ownerEmail,             // user ka email
        },
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