"use server"

import { createSupabaseAdminClient } from "@/lib/supabase/server"

export async function fetchIdentities(page: number = 1, limit: number = 20, search?: string) {
  const adminClient = createSupabaseAdminClient()
  const offset = (page - 1) * limit

  let query = adminClient
    .from("identities")
    .select(`
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
      users(email)
    `, { count: "exact" })

  if (search) {
    query = query.ilike("name", `%${search}%`)
  }

  const { data, error, count } = await query
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) {
    console.error("Error fetching identities:", error)
    throw new Error("Failed to fetch identities")
  }

  return {
    identities: (data || []).map((identity: any) => ({
      ...identity,
      user_email: identity.users?.email,
    })),
    total: count || 0,
    totalPages: Math.ceil((count || 0) / limit),
  }
}
