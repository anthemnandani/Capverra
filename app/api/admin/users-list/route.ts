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
      .from("users")
      .select(
        `
        id,
        email,
        name,
        role,
        created_at,
        assets(count),
        identities(count)
      `,
        { count: "exact" }
      )

    if (search) {
      query = query.or(`email.ilike.%${search}%,name.ilike.%${search}%`)
    }

    const { data, count, error } = await query
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const users = (data || []).map((user: any) => ({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      created_at: user.created_at,
      asset_count: Array.isArray(user.assets) ? (user.assets[0] as any)?.count || 0 : 0,
      identity_count: Array.isArray(user.identities) ? (user.identities[0] as any)?.count || 0 : 0,
    }))

    return NextResponse.json({
      users,
      total: count || 0,
      totalPages: Math.ceil((count || 0) / limit),
    })
  } catch (error) {
    console.error("Error fetching users:", error)
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    )
  }
}
