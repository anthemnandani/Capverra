"use server"

import { createSupabaseServerClient, createSupabaseAdminClient } from "@/lib/supabase/server"
import type { AdminUser, DashboardStats, UserWithAssets, AssetWithOwner, AdminActivityLog, AdminReport } from "@/lib/admin-types"

// Check if user is admin
export async function checkAdminStatus(): Promise<{ isAdmin: boolean; adminUser: AdminUser | null }> {
  const supabase = await createSupabaseServerClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return { isAdmin: false, adminUser: null }
  }

  const adminClient = createSupabaseAdminClient()

  const { data: adminUser } = await adminClient
    .from("admin_users")
    .select("*")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .single()

  // ✅ ADDED: users table se preferences fetch karo
  const { data: userPrefs } = await adminClient
    .from("users")
    .select("preferences")
    .eq("id", user.id)
    .single()

  return { 
    isAdmin: !!adminUser, 
    adminUser: adminUser ? {
      ...adminUser,
      // ✅ ADDED: preferences merge karo adminUser mein
      preferences: userPrefs?.preferences || { theme: "dark" }
    } as AdminUser : null
  }
}

// ✅ ADDED: Save theme preference to users table
export async function updateAdminPreferences(
  userId: string,
  preferences: { theme: "dark" | "light" }
): Promise<{ success: boolean; error?: string }> {
  const adminClient = createSupabaseAdminClient()

  const { error } = await adminClient
    .from("users")
    .update({ preferences })
    .eq("id", userId)

  if (error) return { success: false, error: error.message }
  return { success: true }
}

// Admin login - verifies admin credentials
export async function adminLogin(email: string, password: string): Promise<{ success: boolean; error?: string; adminUser?: AdminUser }> {
  const supabase = await createSupabaseServerClient()
  
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (authError) {
    return { success: false, error: authError.message }
  }

  if (!authData.user) {
    return { success: false, error: "Authentication failed" }
  }

  try {
    const adminClient = createSupabaseAdminClient()
    
    const { data: adminUser, error: adminError } = await adminClient
      .from("admin_users")
      .select("*")
      .eq("user_id", authData.user.id)
      .eq("is_active", true)
      .single()

    if (adminError || !adminUser) {
      await supabase.auth.signOut()
      return { success: false, error: "Access denied. You are not authorized as an admin." }
    }

    await adminClient
      .from("admin_users")
      .update({ last_login: new Date().toISOString() })
      .eq("id", adminUser.id)

    return { success: true, adminUser: adminUser as AdminUser }
  } catch {
    await supabase.auth.signOut()
    return { success: false, error: "Server configuration error. Please contact support." }
  }
}

// Admin logout
export async function adminLogout(): Promise<void> {
  const supabase = await createSupabaseServerClient()
  await supabase.auth.signOut()
}

// Get dashboard statistics
export async function getDashboardStats(): Promise<DashboardStats> {
  const adminClient = createSupabaseAdminClient()
  
  const { count: totalUsers } = await adminClient
    .from("users")
    .select("*", { count: "exact", head: true })

  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  
  const { count: activeUsers } = await adminClient
    .from("users")
    .select("*", { count: "exact", head: true })
    .gte("created_at", thirtyDaysAgo.toISOString())

  const { count: totalAssets } = await adminClient
    .from("assets")
    .select("*", { count: "exact", head: true })

  const { count: totalIdentities } = await adminClient
    .from("identities")
    .select("*", { count: "exact", head: true })

  const { count: reportsGenerated } = await adminClient
    .from("admin_reports")
    .select("*", { count: "exact", head: true })

  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
  const fourteenDaysAgo = new Date()
  fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14)

  const { count: recentUsers } = await adminClient
    .from("users")
    .select("*", { count: "exact", head: true })
    .gte("created_at", sevenDaysAgo.toISOString())

  const { count: previousUsers } = await adminClient
    .from("users")
    .select("*", { count: "exact", head: true })
    .gte("created_at", fourteenDaysAgo.toISOString())
    .lt("created_at", sevenDaysAgo.toISOString())

  const userGrowth = previousUsers ? ((recentUsers || 0) - previousUsers) / previousUsers * 100 : 0

  const { count: recentAssets } = await adminClient
    .from("assets")
    .select("*", { count: "exact", head: true })
    .gte("created_at", sevenDaysAgo.toISOString())

  const { count: previousAssets } = await adminClient
    .from("assets")
    .select("*", { count: "exact", head: true })
    .gte("created_at", fourteenDaysAgo.toISOString())
    .lt("created_at", sevenDaysAgo.toISOString())

  const assetGrowth = previousAssets ? ((recentAssets || 0) - previousAssets) / previousAssets * 100 : 0

  const { data: recentActivity } = await adminClient
    .from("admin_activity_logs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(10)

  return {
    totalUsers: totalUsers || 0,
    activeUsers: activeUsers || 0,
    totalAssets: totalAssets || 0,
    totalIdentities: totalIdentities || 0,
    reportsGenerated: reportsGenerated || 0,
    userGrowth: Math.round(userGrowth * 10) / 10,
    assetGrowth: Math.round(assetGrowth * 10) / 10,
    recentActivity: (recentActivity || []) as AdminActivityLog[],
  }
}

// Get all users with their asset counts
export async function getAllUsers(
  page: number = 1, 
  limit: number = 20, 
  search?: string
): Promise<{ users: UserWithAssets[]; total: number }> {
  const adminClient = createSupabaseAdminClient()
  const offset = (page - 1) * limit

  let query = adminClient
    .from("users")
    .select(`
      id,
      email,
      name,
      role,
      created_at,
      assets:assets(count),
      identities:identities(count)
    `, { count: "exact" })

  if (search) {
    query = query.or(`email.ilike.%${search}%,name.ilike.%${search}%`)
  }

  const { data, count } = await query
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1)

  const users: UserWithAssets[] = (data || []).map((user: Record<string, unknown>) => ({
    id: user.id as string,
    email: user.email as string,
    name: user.name as string | null,
    role: user.role as string,
    created_at: user.created_at as string,
    asset_count: Array.isArray(user.assets) ? (user.assets[0] as { count: number })?.count || 0 : 0,
    identity_count: Array.isArray(user.identities) ? (user.identities[0] as { count: number })?.count || 0 : 0,
    last_login: null,
  }))

  return { users, total: count || 0 }
}

// Get all assets with owner info
export async function getAllAssets(
  page: number = 1,
  limit: number = 20,
  search?: string,
  assetType?: string
): Promise<{ assets: AssetWithOwner[]; total: number }> {
  const adminClient = createSupabaseAdminClient()
  const offset = (page - 1) * limit

  let query = adminClient
    .from("assets")
    .select(`
      id,
      name,
      type,
      status,
      created_at,
      user_id,
      users:user_id(email, name)
    `, { count: "exact" })

  if (search) {
    query = query.or(`name.ilike.%${search}%,type.ilike.%${search}%`)
  }

  if (assetType && assetType !== "all") {
    query = query.eq("type", assetType)
  }

  const { data, count } = await query
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1)

  const assets: AssetWithOwner[] = (data || []).map((asset: Record<string, unknown>) => {
    const user = asset.users as { email: string; name: string | null } | null
    return {
      id: asset.id as string,
      name: asset.name as string,
      type: asset.type as string,
      status: asset.status as string,
      created_at: asset.created_at as string,
      user_id: asset.user_id as string,
      user_email: user?.email || "Unknown",
      user_name: user?.name || null,
    }
  })

  return { assets, total: count || 0 }
}

// Get all reports
export async function getAllReports(
  page: number = 1,
  limit: number = 20,
  reportType?: string
): Promise<{ reports: AdminReport[]; total: number }> {
  const adminClient = createSupabaseAdminClient()
  const offset = (page - 1) * limit

  let query = adminClient
    .from("admin_reports")
    .select("*", { count: "exact" })

  if (reportType && reportType !== "all") {
    query = query.eq("report_type", reportType)
  }

  const { data, count } = await query
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1)

  return { reports: (data || []) as AdminReport[], total: count || 0 }
}

// Create a new report
export async function createReport(
  adminId: string,
  reportType: AdminReport["report_type"],
  title: string,
  description?: string,
  filters?: Record<string, unknown>
): Promise<{ success: boolean; report?: AdminReport; error?: string }> {
  const supabase = await createSupabaseServerClient()

  const { data, error } = await supabase
    .from("admin_reports")
    .insert({
      admin_id: adminId,
      report_type: reportType,
      title,
      description,
      filters: filters || {},
      status: "completed",
    })
    .select()
    .single()

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true, report: data as AdminReport }
}

// Log admin activity
export async function logAdminActivity(
  adminId: string,
  action: string,
  resourceType: string,
  resourceId?: string,
  details?: Record<string, unknown>
): Promise<void> {
  const supabase = await createSupabaseServerClient()

  await supabase.from("admin_activity_logs").insert({
    admin_id: adminId,
    action,
    resource_type: resourceType,
    resource_id: resourceId,
    details: details || {},
  })
}

// Get asset types for filtering
export async function getAssetTypes(): Promise<string[]> {
  const adminClient = createSupabaseAdminClient()

  const { data } = await adminClient
    .from("assets")
    .select("type")
    .limit(100)

  const types = new Set<string>()
  ;(data || []).forEach((item: { type: string }) => {
    if (item.type) types.add(item.type)
  })

  return Array.from(types)
}

// Get user details by ID
export async function getUserDetails(userId: string): Promise<UserWithAssets | null> {
  const adminClient = createSupabaseAdminClient()

  const { data } = await adminClient
    .from("users")
    .select(`
      id,
      email,
      name,
      role,
      created_at,
      assets:assets(count),
      identities:identities(count)
    `)
    .eq("id", userId)
    .single()

  if (!data) return null

  return {
    id: data.id,
    email: data.email,
    name: data.name,
    role: data.role,
    created_at: data.created_at,
    asset_count: Array.isArray(data.assets) ? (data.assets[0] as { count: number })?.count || 0 : 0,
    identity_count: Array.isArray(data.identities) ? (data.identities[0] as { count: number })?.count || 0 : 0,
    last_login: null,
  }
}