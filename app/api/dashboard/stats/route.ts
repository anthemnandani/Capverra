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

    // Unauthenticated → return demo stats for the live demo experience
    if (userError || !user) {
      const demoStats = {
        totalIdentities: 2845,
        totalAssets: 412,
        totalValue: 128_000_000,
        averageReturn: 7.8,
      }

      return NextResponse.json(demoStats)
    }

    // Authenticated → use real Supabase-backed data
    const [{ count: identitiesCount, error: identitiesError }, { count: assetsCount, error: assetsCountError }] =
      await Promise.all([
        supabase.from("identities").select("*", { count: "exact", head: true }),
        supabase.from("assets").select("*", { count: "exact", head: true }),
      ])

    if (identitiesError) throw identitiesError
    if (assetsCountError) throw assetsCountError

    const { data: assets, error: assetsError } = await supabase
      .from("assets")
      .select("purchase_value, latest_valuation")
      .not("purchase_value", "is", null)
      .not("latest_valuation", "is", null)

    if (assetsError) throw assetsError

    const totalValue = (assets ?? []).reduce((sum, asset) => sum + Number(asset.latest_valuation ?? 0), 0)
    const totalPurchaseValue = (assets ?? []).reduce((sum, asset) => sum + Number(asset.purchase_value ?? 0), 0)
    const averageReturn = totalPurchaseValue > 0 ? ((totalValue - totalPurchaseValue) / totalPurchaseValue) * 100 : 0

    const stats = {
      totalIdentities: identitiesCount ?? 0,
      totalAssets: assetsCount ?? 0,
      totalValue,
      averageReturn,
    }

    return NextResponse.json(stats)
  } catch (error) {
    console.error("Error fetching dashboard stats:", error)
    return NextResponse.json(
      {
        error: "Failed to fetch dashboard stats",
        totalIdentities: 0,
        totalAssets: 0,
        totalValue: 0,
        averageReturn: 0,
      },
      { status: 500 },
    )
  }
}
