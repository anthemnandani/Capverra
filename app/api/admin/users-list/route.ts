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

    // Get users from auth.users table
    const { data: users, count, error } = await adminClient.auth.admin.listUsers({
      perPage: limit,
      page: page,
    })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Get asset and identity counts separately for each user
    const userData = []
    for (const user of users.users || []) {
      // Check if user matches search filter
      if (search && !user.email?.toLowerCase().includes(search.toLowerCase())) {
        continue
      }

      const { count: assetCount } = await adminClient
        .from("assets")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)

      const { count: identityCount } = await adminClient
        .from("identities")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)

      userData.push({
        id: user.id,
        email: user.email,
        name: user.user_metadata?.name || "—",
        role: user.user_metadata?.role || "user",
        created_at: user.created_at,
        asset_count: assetCount || 0,
        identity_count: identityCount || 0,
      })
    }

    return NextResponse.json({
      users: userData.slice(offset, offset + limit),
      total: users.users?.length || 0,
      totalPages: Math.ceil((users.users?.length || 0) / limit),
    })
  } catch (error) {
    console.error("Error fetching users:", error)
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    )
  }
}
