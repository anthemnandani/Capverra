import { createSupabaseAdminClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const userId = params.userId

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      )
    }

    const adminClient = createSupabaseAdminClient()

    const [assetsResult, identitiesResult] = await Promise.all([
      adminClient
        .from("assets")
        .select("*")
        .eq("user_id", userId),
      adminClient
        .from("identities")
        .select("*")
        .eq("user_id", userId),
    ])

    return NextResponse.json({
      assets: assetsResult.data || [],
      identities: identitiesResult.data || [],
    })
  } catch (error) {
    console.error("Error fetching user details:", error)
    return NextResponse.json(
      { error: "Failed to fetch user details" },
      { status: 500 }
    )
  }
}
