import { NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient()
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    // Unauthenticated → return demo recent activity for the live demo experience
    if (userError || !user) {
      const now = new Date()
      const toIsoHoursAgo = (hours: number) =>
        new Date(now.getTime() - hours * 60 * 60 * 1000).toISOString()

      const demoActivities = [
        {
          id: "demo_identity_1",
          type: "identity_added",
          title: "New executive profile created",
          description: "Added identity for Alex Rivera (CFO)",
          timestamp: toIsoHoursAgo(2),
        },
        {
          id: "demo_asset_1",
          type: "asset_added",
          title: "New strategic asset onboarded",
          description: "Customer data platform added to Growth portfolio",
          timestamp: toIsoHoursAgo(5),
        },
        {
          id: "demo_valuation_1",
          type: "valuation_updated",
          title: "Quarterly valuation updated",
          description: "Updated valuation for North America real estate fund",
          timestamp: toIsoHoursAgo(12),
        },
        {
          id: "demo_optimization_1",
          type: "optimization_generated",
          title: "Optimization opportunity detected",
          description: "Identified underutilized licenses across three SaaS vendors",
          timestamp: toIsoHoursAgo(20),
        },
      ]

      return NextResponse.json(demoActivities)
    }

    // Authenticated → use real Supabase-backed activity
    const [{ data: recentIdentities, error: identitiesError }, { data: recentAssets, error: assetsError }] =
      await Promise.all([
        supabase.from("identities").select("id, name, type, created_at").order("created_at", { ascending: false }).limit(3),
        supabase
          .from("assets")
          .select("id, name, type, latest_valuation, created_at, owner:identities(name)")
          .order("created_at", { ascending: false })
          .limit(3),
      ])

    if (identitiesError) throw identitiesError
    if (assetsError) throw assetsError

    const activities: any[] = []

    ;(recentIdentities ?? []).forEach((identity) => {
      activities.push({
        id: `identity_${identity.id}`,
        type: "identity_added",
        title: "New identity created",
        description: `${identity.name} profile created`,
        timestamp: identity.created_at,
        metadata: {
          identityType: identity.type,
        },
      })
    })

    ;(recentAssets ?? []).forEach((asset: any) => {
      activities.push({
        id: `asset_${asset.id}`,
        type: "asset_added",
        title: "New asset added",
        description: `${asset.name} added to ${asset.owner?.name || "portfolio"}`,
        timestamp: asset.created_at,
        metadata: {
          value: Number(asset.latest_valuation) || 0,
          assetType: asset.type,
        },
      })
    })

    // Sort by timestamp and limit to 5 most recent
    const sortedActivities = activities
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 5)

    return NextResponse.json(sortedActivities)
  } catch (error) {
    console.error("Error fetching recent activity:", error)
    return NextResponse.json({ error: "Failed to fetch recent activity" }, { status: 500 })
  }
}
