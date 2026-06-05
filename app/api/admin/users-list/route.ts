import { createSupabaseAdminClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)

    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "20")
    const search = searchParams.get("search") || ""

    const adminClient = createSupabaseAdminClient()

    // Get users from custom users table
    const { data: customUsers, error: customUsersError } = await adminClient
      .from("users")
      .select("*")

    if (customUsersError) {
      return NextResponse.json(
        { error: customUsersError.message },
        { status: 500 }
      )
    }

    // Get auth users
    const { data: authUsersResponse, error: authError } =
      await adminClient.auth.admin.listUsers({
        page: 1,
        perPage: 1000,
      })

    if (authError) {
      return NextResponse.json(
        { error: authError.message },
        { status: 500 }
      )
    }

    const authUsers = authUsersResponse.users || []

    const userData = []

    for (const customUser of customUsers || []) {

      const authUser = authUsers.find(
        (user: { id: string }) => user.id === customUser.id
      )

      // Skip if auth user not found
      if (!authUser) continue

      // Search filter
      if (
        search &&
        !(
          customUser.name?.toLowerCase().includes(search.toLowerCase()) ||
          authUser.email?.toLowerCase().includes(search.toLowerCase())
        )
      ) {
        continue
      }

      const [{ count: assetCount }, { count: identityCount }] =
        await Promise.all([
          adminClient
            .from("assets")
            .select("*", { count: "exact", head: true })
            .eq("user_id", customUser.id),

          adminClient
            .from("identities")
            .select("*", { count: "exact", head: true })
            .eq("user_id", customUser.id),
        ])

      userData.push({
        id: customUser.id,
        email: authUser.email,
        name: customUser.name || "—",
        role: customUser.role || "client",
        created_at: authUser.created_at,
        asset_count: assetCount || 0,
        identity_count: identityCount || 0,
      })
    }

    // Sort newest first
    userData.sort(
      (a, b) =>
        new Date(b.created_at).getTime() -
        new Date(a.created_at).getTime()
    )

    const total = userData.length
    const start = (page - 1) * limit
    const end = start + limit

    return NextResponse.json({
      users: userData.slice(start, end),
      total,
      totalPages: Math.ceil(total / limit),
    })
  } catch (error) {
    console.error("Error fetching users:", error)

    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    )
  }
}