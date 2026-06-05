// app/api/admin/users-list/route.ts
import { createSupabaseAdminClient } from "@/lib/supabase/server"
import type { UserRole } from "@/lib/admin-types"
import { NextResponse } from "next/server"

// Shape of rows returned from your `users` table
type CustomUser = {
  id: string
  name: string | null
  role: UserRole | null
}

// Subset of Supabase's auth.User we actually use
type AuthUser = {
  id: string
  email?: string
  created_at: string
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)

    const page   = parseInt(searchParams.get("page")  || "1")
    const limit  = parseInt(searchParams.get("limit") || "20")
    const search = searchParams.get("search") || ""
    const role   = searchParams.get("role")   || ""

    const adminClient = createSupabaseAdminClient()

    // ── 1. DB-level role filter ─────────────────────────────────────────────
    let usersQuery = adminClient
      .from("users")
      .select("id, name, role")   // only fetch what we need

    if (role) {
      usersQuery = usersQuery.eq("role", role)
    }

    const { data, error: customUsersError } = await usersQuery

    if (customUsersError) {
      return NextResponse.json({ error: customUsersError.message }, { status: 500 })
    }

    const customUsers = (data ?? []) as CustomUser[]

    if (customUsers.length === 0) {
      return NextResponse.json({ users: [], total: 0, totalPages: 0 })
    }

    // ── 2. Auth users — build a typed map keyed by id ───────────────────────
    const userIds = customUsers.map((u) => u.id)

    const { data: authUsersResponse, error: authError } =
      await adminClient.auth.admin.listUsers({ page: 1, perPage: 1000 })

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 500 })
    }

    const authUsersMap = new Map<string, AuthUser>(
      (authUsersResponse.users as AuthUser[])
        .filter((u) => userIds.includes(u.id))
        .map((u) => [u.id, u])
    )

    // ── 3. JS-level search (name lives in custom table, email in auth) ──────
    const filteredUsers = customUsers.filter((customUser: CustomUser) => {
      const authUser = authUsersMap.get(customUser.id)
      if (!authUser) return false
      if (!search) return true
      const q = search.toLowerCase()
      return (
        customUser.name?.toLowerCase().includes(q) ||
        authUser.email?.toLowerCase().includes(q)
      )
    })

    // ── 4. Batch counts — 2 queries regardless of user count ────────────────
    const filteredIds = filteredUsers.map((u) => u.id)

    const [assetsResult, identitiesResult] = await Promise.all([
      adminClient.from("assets").select("user_id").in("user_id", filteredIds),
      adminClient.from("identities").select("user_id").in("user_id", filteredIds),
    ])

    const assetCountMap = new Map<string, number>()
    for (const row of (assetsResult.data ?? []) as { user_id: string }[]) {
      assetCountMap.set(row.user_id, (assetCountMap.get(row.user_id) ?? 0) + 1)
    }

    const identityCountMap = new Map<string, number>()
    for (const row of (identitiesResult.data ?? []) as { user_id: string }[]) {
      identityCountMap.set(row.user_id, (identityCountMap.get(row.user_id) ?? 0) + 1)
    }

    // ── 5. Assemble ─────────────────────────────────────────────────────────
    const userData = filteredUsers.map((customUser: CustomUser) => {
      const authUser = authUsersMap.get(customUser.id) as AuthUser
      return {
        id:             customUser.id,
        email:          authUser.email ?? "",
        name:           customUser.name ?? "—",
        role:           customUser.role ?? "client",
        created_at:     authUser.created_at,
        asset_count:    assetCountMap.get(customUser.id)    ?? 0,
        identity_count: identityCountMap.get(customUser.id) ?? 0,
        last_login:     null,
      }
    })

    // Sort newest first
    userData.sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )

    // ── 6. Paginate ─────────────────────────────────────────────────────────
    const total = userData.length
    const start = (page - 1) * limit

    return NextResponse.json({
      users:      userData.slice(start, start + limit),
      total,
      totalPages: Math.ceil(total / limit),
    })
  } catch (error) {
    console.error("Error fetching users:", error)
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 })
  }
}