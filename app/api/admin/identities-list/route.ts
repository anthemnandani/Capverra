import { createSupabaseAdminClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "20")
    const search = searchParams.get("search") || undefined

    const adminClient = createSupabaseAdminClient()
    const offset = (page - 1) * limit

    let query = adminClient
      .from("identities")
      .select(
        `
        id,
        user_id,
        name,
        type,
        citizenship,
        residency,
        risk_profile,
        goals,
        created_at,
        updated_at,
        users!identities_user_id_fkey(id, email, name)
      `,
        { count: "exact" }
      )

    if (search) {
      query = query.ilike("name", `%${search}%`)
    }

    const { data, count, error } = await query
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const identities = (data || []).map((identity: any) => ({
      id: identity.id,
      user_id: identity.user_id,
      name: identity.name,
      type: identity.type,
      citizenship: identity.citizenship,
      residency: identity.residency,
      risk_profile: identity.risk_profile,
      goals: identity.goals,
      created_at: identity.created_at,
      updated_at: identity.updated_at,
      user_email: identity.users?.email,
      user_name: identity.users?.name,
    }))

    return NextResponse.json({
      identities,
      total: count || 0,
      totalPages: Math.ceil((count || 0) / limit),
    })
  } catch (error) {
    console.error("Error fetching identities:", error)
    return NextResponse.json(
      { error: "Failed to fetch identities" },
      { status: 500 }
    )
  }
}
