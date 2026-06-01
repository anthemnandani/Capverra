import { createSupabaseAdminClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "20")
    const search = searchParams.get("search") || undefined
    const reportType = searchParams.get("type") || undefined

    const adminClient = createSupabaseAdminClient()
    const offset = (page - 1) * limit

    // First, fetch AI-generated reports from the database
    let query = adminClient
      .from("reports")
      .select(
        `
        id,
        title,
        description,
        report_type,
        status,
        estimated_savings,
        created_at,
        updated_at,
        assets(id, name),
        identities(id, name)
      `,
        { count: "exact" }
      )

    if (search) {
      query = query.ilike("title", `%${search}%`)
    }

    if (reportType && reportType !== "all") {
      query = query.eq("report_type", reportType)
    }

    const { data, count, error } = await query
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      console.log("[v0] Report fetch error:", error.message)
      // If reports table doesn't exist, return empty list with sample data for demo
      return NextResponse.json({
        reports: [],
        total: 0,
        totalPages: 0,
      })
    }

    const reports = (data || []).map((report: any) => ({
      id: report.id,
      title: report.title,
      description: report.description,
      report_type: report.report_type,
      status: report.status,
      estimated_savings: report.estimated_savings,
      asset_name: report.assets?.name,
      asset_count: Array.isArray(report.assets) ? report.assets.length : 0,
      identity_count: Array.isArray(report.identities) ? report.identities.length : 0,
      created_at: report.created_at,
      updated_at: report.updated_at,
    }))

    return NextResponse.json({
      reports,
      total: count || 0,
      totalPages: Math.ceil((count || 0) / limit),
    })
  } catch (error) {
    console.error("Error fetching reports:", error)
    return NextResponse.json(
      { error: "Failed to fetch reports" },
      { status: 500 }
    )
  }
}
