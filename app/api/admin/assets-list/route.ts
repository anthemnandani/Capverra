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
        `id, name, type, location_country, location_state, purchase_value,
         purchase_date, latest_valuation, latest_valuation_date, currency,
         created_at, updated_at, user_id, owner_id`,
        { count: "exact" }
      )
      .eq("is_deleted", false)  // only non-deleted assets

    if (search) query = query.ilike("name", `%${search}%`)
    if (assetType && assetType !== "all") query = query.eq("type", assetType)

    const { data, count, error } = await query
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    // Batch-fetch identities (owner)
    const ownerIds = (data || []).map((a: any) => a.owner_id).filter(Boolean)
    const { data: identities } = await adminClient
      .from("identities")
      .select("id, name, type")
      .in("id", ownerIds)
    const identityMap = Object.fromEntries(identities?.map((i: any) => [i.id, i]) || [])

    // Enrich with user info
    const assets = []
    for (const asset of data || []) {
      const { data: user } = await adminClient.auth.admin.getUserById(asset.user_id)
      const identity = identityMap[asset.owner_id]

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
        currency: asset.currency,
        performance,
        created_at: asset.created_at,
        updated_at: asset.updated_at,
        user_id: asset.user_id,
        user_email: user?.email || "N/A",
        user_name: identity?.name || "—",
        owner: {
          id: identity?.id || null,
          name: identity?.name || "—",
          type: identity?.type || "—",
          email: user?.email || "N/A",
        },
      })
    }

    return NextResponse.json({ assets, total: count || 0, totalPages: Math.ceil((count || 0) / limit) })
  } catch (error) {
    console.error("Error fetching assets:", error)
    return NextResponse.json({ error: "Failed to fetch assets" }, { status: 500 })
  }
}

// ── DELETE — soft delete asset + all its optimization_reports ─────────────────
export async function DELETE(request: Request) {
  try {
    const { id } = await request.json()
    if (!id) return NextResponse.json({ error: "Asset ID required" }, { status: 400 })

    const adminClient = createSupabaseAdminClient()
    const now = new Date().toISOString()

    // 1. Soft-delete the asset
    const { error: assetError } = await adminClient
      .from("assets")
      .update({ is_deleted: true, updated_at: now })
      .eq("id", id)

    if (assetError) {
      console.error("[admin] Asset delete error:", assetError.message)
      return NextResponse.json({ error: assetError.message }, { status: 500 })
    }

    // 2. Soft-delete all optimization_reports linked to this asset
    const { error: reportsError } = await adminClient
      .from("optimization_reports")
      .update({ is_deleted: true })
      .eq("asset_id", id)

    if (reportsError) {
      // Non-fatal — asset is already deleted; log but don't fail
      console.error("[admin] Reports cascade-delete error:", reportsError.message)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting asset:", error)
    return NextResponse.json({ error: "Failed to delete asset" }, { status: 500 })
  }
}