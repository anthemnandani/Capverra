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
        `id, user_id, name, type, citizenship, residency, risk_profile, goals,
         state_province, tax_rate, annual_income, created_at, updated_at`,
        { count: "exact" }
      )
      .eq("is_deleted", false) // soft delete filter

    if (search) query = query.ilike("name", `%${search}%`)

    const { data, count, error } = await query
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    const identities = []
    for (const identity of data || []) {
      const { data: user } = await adminClient.auth.admin.getUserById(identity.user_id)
      identities.push({
        id: identity.id,
        user_id: identity.user_id,
        name: identity.name,
        type: identity.type,
        citizenship: identity.citizenship,
        residency: identity.residency,
        risk_profile: identity.risk_profile,
        goals: identity.goals,
        state_province: identity.state_province,
        tax_rate: identity.tax_rate,
        annual_income: identity.annual_income,
        created_at: identity.created_at,
        updated_at: identity.updated_at,
        user_email: user?.email,
        user_name: user?.user_metadata?.name,
      })
    }

    return NextResponse.json({
      identities,
      total: count || 0,
      totalPages: Math.ceil((count || 0) / limit),
    })
  } catch (error) {
    console.error("Error fetching identities:", error)
    return NextResponse.json({ error: "Failed to fetch identities" }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const { id } = await request.json()
    if (!id) return NextResponse.json({ error: "Identity ID required" }, { status: 400 })

    const adminClient = createSupabaseAdminClient()
    const now = new Date().toISOString()

    // 1. Soft-delete the identity
    const { error } = await adminClient
      .from("identities")
      .update({ is_deleted: true, updated_at: now })
      .eq("id", id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    // 2. Find all assets owned by this identity
    const { data: assets } = await adminClient
      .from("assets")
      .select("id")
      .eq("owner_id", id)
      .eq("is_deleted", false)

    if (assets && assets.length > 0) {
      const assetIds = assets.map((a: any) => a.id)

      // 3. Soft-delete all those assets
      await adminClient
        .from("assets")
        .update({ is_deleted: true, updated_at: now })
        .in("id", assetIds)

      // 4. Soft-delete all optimization_reports linked to those assets
      await adminClient
        .from("optimization_reports")
        .update({ is_deleted: true })
        .in("asset_id", assetIds)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete identity" }, { status: 500 })
  }
}