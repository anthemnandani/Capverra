import { createSupabaseAdminClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "20")
    const search = searchParams.get("search") || undefined
    const userId = searchParams.get("userId") || undefined
    const assetId = searchParams.get("assetId") || undefined
    const identityId = searchParams.get("identityId") || undefined
    const sortBy = searchParams.get("sortBy") || "generated_at"
    const sortOrder = searchParams.get("sortOrder") || "desc"

    const adminClient = createSupabaseAdminClient()
    const offset = (page - 1) * limit

    // Fetch optimization reports from the optimization_reports table
    let query = adminClient
      .from("optimization_reports")
      .select(
        `
        id,
        user_id,
        asset_id,
        asset_name,
        generated_at,
        estimated_savings,
        currency,
        summary,
        identities,
        jurisdictions,
        report_data,
        created_at
      `,
        { count: "exact" }
      )

    // Apply filters
    if (search) {
      query = query.or(`asset_name.ilike.%${search}%,summary.ilike.%${search}%`)
    }

    if (userId) {
      query = query.eq("user_id", userId)
    }

    if (assetId) {
      query = query.eq("asset_id", assetId)
    }

    // Sort
    const ascending = sortOrder === "asc"
    query = query.order(sortBy as any, { ascending })

    // Pagination
    const { data: reports, count, error } = await query.range(offset, offset + limit - 1)

    if (error) {
      console.error("[Admin Reports] Fetch error:", error.message)
      return NextResponse.json({
        reports: [],
        total: 0,
        totalPages: 0,
      })
    }

    // Fetch user details for all unique user_ids
    const userIds = [...new Set((reports || []).map((r: any) => r.user_id).filter(Boolean))]
    let usersMap: Record<string, any> = {}

    if (userIds.length > 0) {
      const { data: usersData } = await adminClient.auth.admin.listUsers({ perPage: 1000 })
      if (usersData?.users) {
        usersData.users.forEach((user) => {
          usersMap[user.id] = {
            id: user.id,
            email: user.email,
            name: user.user_metadata?.name || user.email?.split("@")[0] || "Unknown",
          }
        })
      }
    }

    // Fetch asset details for all unique asset_ids
    const assetIds = [...new Set((reports || []).map((r: any) => r.asset_id).filter(Boolean))]
    let assetsMap: Record<string, any> = {}

    if (assetIds.length > 0) {
      const { data: assetsData } = await adminClient
        .from("assets")
        .select("id, name, type, location_country, purchase_value, latest_valuation")
        .in("id", assetIds)

      if (assetsData) {
        assetsData.forEach((asset: any) => {
          assetsMap[asset.id] = asset
        })
      }
    }

    // Fetch all identities for filter dropdown
    const { data: allIdentities } = await adminClient
      .from("identities")
      .select("id, name, type, user_id")
      .order("name")

    // Fetch all assets for filter dropdown
    const { data: allAssets } = await adminClient
      .from("assets")
      .select("id, name, type")
      .order("name")

    // Fetch all users for filter dropdown
    const { data: allUsersData } = await adminClient.auth.admin.listUsers({ perPage: 1000 })
    const allUsers = (allUsersData?.users || []).map((user) => ({
      id: user.id,
      email: user.email,
      name: user.user_metadata?.name || user.email?.split("@")[0] || "Unknown",
    }))

    // Enrich reports with user and asset details
    const enrichedReports = (reports || []).map((report: any) => {
      const user = usersMap[report.user_id]
      const asset = assetsMap[report.asset_id]
      const identitiesData = report.identities || []

      return {
        id: report.id,
        user_id: report.user_id,
        user_email: user?.email || "N/A",
        user_name: user?.name || "Unknown",
        asset_id: report.asset_id,
        asset_name: report.asset_name || asset?.name || "Unknown Asset",
        asset_type: asset?.type || "N/A",
        asset_location: asset?.location_country || "N/A",
        asset_value: asset?.latest_valuation || asset?.purchase_value || 0,
        generated_at: report.generated_at || report.created_at,
        estimated_savings: report.estimated_savings || 0,
        currency: report.currency || "USD",
        summary: report.summary || "",
        identities: identitiesData,
        identity_count: identitiesData.length,
        jurisdictions: report.jurisdictions || [],
        jurisdiction_count: (report.jurisdictions || []).length,
        report_data: report.report_data,
      }
    })

    return NextResponse.json({
      reports: enrichedReports,
      total: count || 0,
      totalPages: Math.ceil((count || 0) / limit),
      filters: {
        users: allUsers,
        assets: allAssets || [],
        identities: allIdentities || [],
      },
    })
  } catch (error) {
    console.error("Error fetching admin reports:", error)
    return NextResponse.json(
      { error: "Failed to fetch reports" },
      { status: 500 }
    )
  }
}
