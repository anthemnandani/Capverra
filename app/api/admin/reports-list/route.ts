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
    const sortBy = searchParams.get("sortBy") || "generated_at"
    const sortOrder = searchParams.get("sortOrder") || "desc"

    const adminClient = createSupabaseAdminClient()
    const offset = (page - 1) * limit

    let query = adminClient
      .from("optimization_reports")
      .select(
        `id, user_id, asset_id, asset_name, generated_at, estimated_savings,
         currency, summary, identities, jurisdictions, report_data, created_at`,
        { count: "exact" }
      )
      .eq("is_deleted", false)  // only non-deleted reports

    if (search) query = query.or(`asset_name.ilike.%${search}%,summary.ilike.%${search}%`)
    if (userId) query = query.eq("user_id", userId)
    if (assetId) query = query.eq("asset_id", assetId)

    const ascending = sortOrder === "asc"
    query = query.order(sortBy as any, { ascending })

    const { data: reports, count, error } = await query.range(offset, offset + limit - 1)

    if (error) {
      console.error("[Admin Reports] Fetch error:", error.message)
      return NextResponse.json({ reports: [], total: 0, totalPages: 0 })
    }

    // ── Fetch user details from public.users ──────────────────────────────────
    const userIds = [...new Set((reports || []).map((r: any) => r.user_id).filter(Boolean))]
    let usersMap: Record<string, any> = {}
    if (userIds.length > 0) {
      const { data: usersData } = await adminClient
        .from("users")
        .select("id, email, name")
        .in("id", userIds)
      if (usersData) {
        usersData.forEach((user: any) => {
          usersMap[user.id] = {
            id: user.id,
            email: user.email,
            name: user.name || user.email?.split("@")[0] || "Unknown",
          }
        })
      }
    }

    // ── Fetch asset details ───────────────────────────────────────────────────
    const assetIds = [...new Set((reports || []).map((r: any) => r.asset_id).filter(Boolean))]
    let assetsMap: Record<string, any> = {}
    if (assetIds.length > 0) {
      const { data: assetsData } = await adminClient
        .from("assets")
        .select("id, name, type, location_country, purchase_value, latest_valuation")
        .in("id", assetIds)
      if (assetsData) assetsData.forEach((asset: any) => { assetsMap[asset.id] = asset })
    }

    // ── Filter dropdowns ──────────────────────────────────────────────────────
    const { data: allIdentities } = await adminClient
      .from("identities")
      .select("id, name, type, user_id")
      .order("name")

    const { data: allAssets } = await adminClient
      .from("assets")
      .select("id, name, type")
      .eq("is_deleted", false)
      .order("name")

    // public.users instead of auth.admin.listUsers
    const { data: allUsersData } = await adminClient
      .from("users")
      .select("id, email, name")
      .order("name")
    const allUsers = (allUsersData || []).map((user: any) => ({
      id: user.id,
      email: user.email,
      name: user.name || user.email?.split("@")[0] || "Unknown",
    }))

    // ── Enrich reports ────────────────────────────────────────────────────────
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
      filters: { users: allUsers, assets: allAssets || [], identities: allIdentities || [] },
    })
  } catch (error) {
    console.error("Error fetching admin reports:", error)
    return NextResponse.json({ error: "Failed to fetch reports" }, { status: 500 })
  }
}

// ── DELETE — soft delete a single optimization report ────────────────────────
export async function DELETE(request: Request) {
  try {
    const { id } = await request.json()
    if (!id) return NextResponse.json({ error: "Report ID required" }, { status: 400 })

    const adminClient = createSupabaseAdminClient()

    const { error } = await adminClient
      .from("optimization_reports")
      .update({ is_deleted: true })
      .eq("id", id)

    if (error) {
      console.error("[admin] Report delete error:", error.message)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting report:", error)
    return NextResponse.json({ error: "Failed to delete report" }, { status: 500 })
  }
}