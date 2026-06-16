import { type NextRequest, NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase/server"

// GET /api/identities/[id]/linked-assets
// Returns list of assets that have owner_id = this identity id
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const supabase = await createSupabaseServerClient()

    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = params
    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 })
    }

    // Identity user ki hai check karo
    const { data: identity, error: identityError } = await supabase
      .from("identities")
      .select("id")
      .eq("id", id)
      .eq("user_id", user.id)
      .eq("is_deleted", false)
      .maybeSingle()

    if (identityError) throw identityError
    if (!identity) {
      return NextResponse.json({ error: "Identity not found" }, { status: 404 })
    }

    // Is identity ke saath linked assets dhundo
    const { data: assets, error: assetsError } = await supabase
      .from("assets")
      .select("id, name, type")
      .eq("owner_id", id)
      .eq("is_deleted", false)

    if (assetsError) throw assetsError

    return NextResponse.json({ assets: assets ?? [] })
  } catch (error) {
    console.error("[GET /api/identities/:id/linked-assets]", error)
    return NextResponse.json(
      { error: "Failed to check linked assets" },
      { status: 500 },
    )
  }
}