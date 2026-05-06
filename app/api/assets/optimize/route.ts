import { type NextRequest, NextResponse } from "next/server"
import { generateAssetOptimization } from "@/lib/openai"
import { createSupabaseServerClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient()
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { asset } = await request.json()

    let enrichedAsset = asset
    if (asset.owner_id) {
      try {
        const { data: owner } = await supabase
          .from("identities")
          .select("name, type, risk_profile, goals")
          .eq("id", asset.owner_id)
          .single()

        if (owner) {
          enrichedAsset = { ...asset, owner }
        }
      } catch (error) {
        console.error("Error fetching owner details:", error)
      }
    }

    const optimization = await generateAssetOptimization({ asset: enrichedAsset })

    return NextResponse.json({
      optimization,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Error generating optimization:", error)
    return NextResponse.json({ error: "Failed to generate optimization recommendations" }, { status: 500 })
  }
}
