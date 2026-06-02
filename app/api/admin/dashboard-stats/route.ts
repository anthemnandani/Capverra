import { createSupabaseAdminClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const adminClient = createSupabaseAdminClient()

    // Get total users count
    const { count: totalUsers } = await adminClient
      .from("users")
      .select("*", { count: "exact", head: true })

    // Get active users (created in last 30 days)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const { count: activeUsers } = await adminClient
      .from("users")
      .select("*", { count: "exact", head: true })
      .gte("created_at", thirtyDaysAgo.toISOString())

    // Get total assets
    const { count: totalAssets } = await adminClient
      .from("assets")
      .select("*", { count: "exact", head: true })

    // Get total identities
    const { count: totalIdentities } = await adminClient
      .from("identities")
      .select("*", { count: "exact", head: true })

    // Calculate user growth (last 7 days vs previous 7 days)
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    const fourteenDaysAgo = new Date()
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14)

    const { count: recentUsers } = await adminClient
      .from("users")
      .select("*", { count: "exact", head: true })
      .gte("created_at", sevenDaysAgo.toISOString())

    const { count: previousUsers } = await adminClient
      .from("users")
      .select("*", { count: "exact", head: true })
      .gte("created_at", fourteenDaysAgo.toISOString())
      .lt("created_at", sevenDaysAgo.toISOString())

    const userGrowthPercent = previousUsers ? ((recentUsers || 0) - (previousUsers || 0)) / (previousUsers || 1) * 100 : 0

    // Calculate asset growth (last 7 days vs previous 7 days)
    const { count: recentAssets } = await adminClient
      .from("assets")
      .select("*", { count: "exact", head: true })
      .gte("created_at", sevenDaysAgo.toISOString())

    const { count: previousAssets } = await adminClient
      .from("assets")
      .select("*", { count: "exact", head: true })
      .gte("created_at", fourteenDaysAgo.toISOString())
      .lt("created_at", sevenDaysAgo.toISOString())

    const assetGrowthPercent = previousAssets ? ((recentAssets || 0) - (previousAssets || 0)) / (previousAssets || 1) * 100 : 0

    return NextResponse.json({
      totalUsers: totalUsers || 0,
      activeUsers: activeUsers || 0,
      totalAssets: totalAssets || 0,
      totalIdentities: totalIdentities || 0,
      userGrowthPercent: Math.round(userGrowthPercent * 10) / 10,
      assetGrowthPercent: Math.round(assetGrowthPercent * 10) / 10,
    })
  } catch (error) {
    console.error("Error fetching dashboard stats:", error)
    return NextResponse.json(
      { error: "Failed to fetch dashboard stats" },
      { status: 500 }
    )
  }
}
