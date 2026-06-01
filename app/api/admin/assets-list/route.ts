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
        status,
        created_at,
        location_country,
        latest_valuation,
        users!assets_user_id_fkey(id, email, name)
      `,
        { count: "exact" }
      )

    if (search) {
      query = query.ilike("name", `%${search}%`)
    }

    if (assetType) {
      query = query.eq("type", assetType)
    }

    const { data, count, error } = await query
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const assets = (data || []).map((asset: any) => ({
      id: asset.id,
      name: asset.name,
      type: asset.type,
      status: asset.status,
      created_at: asset.created_at,
      location_country: asset.location_country,
      latest_valuation: asset.latest_valuation,
      owner: asset.users
        ? {
            id: asset.users.id,
            name: asset.users.name,
            email: asset.users.email,
          }
        : null,
    }))

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
