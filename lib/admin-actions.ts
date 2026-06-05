"use server"

import { createSupabaseServerClient, createSupabaseAdminClient } from "@/lib/supabase/server"
import type {
  AdminUser,
  DashboardStats,
  UserWithAssets,
  AssetWithOwner,
  AdminActivityLog,
  AdminReport,
} from "@/lib/admin-types"

export async function checkAdminStatus(): Promise<{
  isAdmin: boolean
  adminUser: AdminUser | null
}> {
  const supabase = await createSupabaseServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { isAdmin: false, adminUser: null }
  }

  const adminClient = createSupabaseAdminClient()

  const { data: userData } = await adminClient
    .from("users")
    .select("*")
    .eq("id", user.id)
    .in("role", ["admin", "super_admin"])
    .single()

  if (!userData) {
    return { isAdmin: false, adminUser: null }
  }

  const adminUser: AdminUser = {
    id: userData.id,
    user_id: userData.id,
    email: userData.email,
    name: userData.name ?? null,
    role: userData.role,
    is_active: true,
    permissions: userData.permissions ?? [],
    last_login: userData.last_login ?? null,
    created_at: userData.created_at,
    updated_at: userData.updated_at ?? userData.created_at,
    avatar_url: userData.avatar_url ?? null,
    preferences: userData.preferences ?? { theme: "dark" },
  }

  return { isAdmin: true, adminUser }
}

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

// lib/admin-actions.ts  — updated adminLogin + new updateUserRole
// Only the changed/added functions shown below. Keep the rest of the file as-is.

// ── adminLogin (updated) ──────────────────────────────────────────────────────
// Now allows both 'admin' AND 'super_admin' roles.
// Returns error code "ACCESS_DENIED_CLIENT" when a client tries to use admin portal.
export async function adminLogin(
  email: string,
  password: string
): Promise<{ success: boolean; error?: string; adminUser?: AdminUser }> {
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

    const { data: userData, error: userError } = await adminClient
      .from("users")
      .select("*")
      .eq("id", authData.user.id)
      .single()

    if (userError || !userData) {
      await supabase.auth.signOut()
      return { success: false, error: "User not found." }
    }

    // Block client role from using admin portal
    if (userData.role === "client") {
      await supabase.auth.signOut()
      return {
        success: false,
        error: "ACCESS_DENIED_CLIENT",
      }
    }

    // Allow only admin and super_admin
    if (userData.role !== "admin" && userData.role !== "super_admin") {
      await supabase.auth.signOut()
      return {
        success: false,
        error: "Access denied. You are not authorized as an admin.",
      }
    }

    await adminClient
      .from("users")
      .update({ last_login: new Date().toISOString() })
      .eq("id", userData.id)

    const adminUser: AdminUser = {
      id: userData.id,
      user_id: userData.id,
      email: userData.email,
      name: userData.name ?? null,
      role: userData.role,
      is_active: true,
      permissions: userData.permissions ?? [],
      last_login: userData.last_login ?? null,
      created_at: userData.created_at,
      updated_at: userData.updated_at ?? userData.created_at,
      avatar_url: userData.avatar_url ?? null,
      preferences: userData.preferences ?? { theme: "dark" },
    }

    return { success: true, adminUser }
  } catch {
    await supabase.auth.signOut()
    return {
      success: false,
      error: "Server configuration error. Please contact support.",
    }
  }
}

export async function updateUserRole(
  targetUserId: string,
  newRole: "client" | "admin" | "super_admin"
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createSupabaseServerClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: "Unauthorized" }

  const adminClient = createSupabaseAdminClient()

  // Verify caller is super_admin
  const { data: callerData } = await adminClient
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single()

  if (!callerData || callerData.role !== "super_admin") {
    return { success: false, error: "Only super admins can change user roles" }
  }

  if (targetUserId === user.id) {
    return { success: false, error: "You cannot change your own role" }
  }

  const { error } = await adminClient
    .from("users")
    .update({ role: newRole, updated_at: new Date().toISOString() })
    .eq("id", targetUserId)

  if (error) return { success: false, error: error.message }

  // Sync auth metadata
  await adminClient.auth.admin.updateUserById(targetUserId, {
    user_metadata: { role: newRole },
  })

  return { success: true }
}

export async function adminLogout(): Promise<void> {
  const supabase = await createSupabaseServerClient()
  await supabase.auth.signOut()
}

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

  const userGrowth = previousUsers
    ? (((recentUsers || 0) - previousUsers) / previousUsers) * 100
    : 0

  const { count: recentAssets } = await adminClient
    .from("assets")
    .select("*", { count: "exact", head: true })
    .gte("created_at", sevenDaysAgo.toISOString())

  const { count: previousAssets } = await adminClient
    .from("assets")
    .select("*", { count: "exact", head: true })
    .gte("created_at", fourteenDaysAgo.toISOString())
    .lt("created_at", sevenDaysAgo.toISOString())

  const assetGrowth = previousAssets
    ? (((recentAssets || 0) - previousAssets) / previousAssets) * 100
    : 0

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

export async function getAllUsers(
  page: number = 1,
  limit: number = 20,
  search?: string
): Promise<{ users: UserWithAssets[]; total: number }> {
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
      assets:assets(count),
      identities:identities(count)
    `,
      { count: "exact" }
    )

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
    asset_count: Array.isArray(user.assets)
      ? ((user.assets[0] as { count: number })?.count ?? 0)
      : 0,
    identity_count: Array.isArray(user.identities)
      ? ((user.identities[0] as { count: number })?.count ?? 0)
      : 0,
    last_login: null,
  }))

  return { users, total: count || 0 }
}

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
    .select(
      `
      id,
      name,
      type,
      status,
      created_at,
      user_id,
      users:user_id(email, name)
    `,
      { count: "exact" }
    )

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

export async function getAssetTypes(): Promise<string[]> {
  const adminClient = createSupabaseAdminClient()

  const { data } = await adminClient.from("assets").select("type").limit(100)

  const types = new Set<string>()
  ;(data || []).forEach((item: { type: string }) => {
    if (item.type) types.add(item.type)
  })

  return Array.from(types)
}

export async function getUserDetails(userId: string): Promise<UserWithAssets | null> {
  const adminClient = createSupabaseAdminClient()

  const { data } = await adminClient
    .from("users")
    .select(
      `
      id,
      email,
      name,
      role,
      created_at,
      assets:assets(count),
      identities:identities(count)
    `
    )
    .eq("id", userId)
    .single()

  if (!data) return null

  return {
    id: data.id,
    email: data.email,
    name: data.name,
    role: data.role,
    created_at: data.created_at,
    asset_count: Array.isArray(data.assets)
      ? ((data.assets[0] as { count: number })?.count ?? 0)
      : 0,
    identity_count: Array.isArray(data.identities)
      ? ((data.identities[0] as { count: number })?.count ?? 0)
      : 0,
    last_login: null,
  }
}




// Admin-specific TypeScript types

export type UserRole = "client" | "admin" | "super_admin"

export interface AdminUser {
  id: string
  user_id: string
  email: string
  name: string | null
  role: UserRole
  permissions: string[]
  is_active: boolean
  last_login: string | null
  created_at: string
  updated_at: string
  avatar_url: string | null
  preferences?: {
    theme: "dark" | "light"
    emailNotifications?: boolean
    pushNotifications?: boolean
    activityLogs?: boolean
  }
}

export interface AdminActivityLog {
  id: string
  admin_id: string
  action: string
  resource_type: string
  resource_id: string | null
  details: Record<string, unknown>
  ip_address: string | null
  user_agent: string | null
  created_at: string
}

export interface AdminReport {
  id: string
  title: string
  description: string | null
  report_type: 'users' | 'assets' | 'identities' | 'optimization' | 'analytics'
  status: 'pending' | 'processing' | 'completed' | 'failed'
  estimated_savings: number | null
  asset_name: string | null
  asset_count: number
  identity_count: number
  created_at: string
  updated_at: string
}

export interface AdminDashboardMetrics {
  id: string
  metric_name: string
  metric_value: number
  metric_data: Record<string, unknown>
  updated_at: string
}

export interface DashboardStats {
  totalUsers: number
  activeUsers: number
  totalAssets: number
  totalIdentities: number
  reportsGenerated: number
  userGrowth: number
  assetGrowth: number
  recentActivity: AdminActivityLog[]
}

export interface UserWithAssets {
  id: string
  email: string
  name: string | null
  role: UserRole
  created_at: string
  asset_count: number
  identity_count: number
  last_login: string | null
}

export interface AssetWithOwner {
  id: string
  name: string
  type: string
  currency: string
  location_country: string | null
  location_state: string | null
  purchase_value: number | null
  purchase_date: string | null
  latest_valuation: number | null
  latest_valuation_date: string | null
  performance: number | null
  created_at: string
  updated_at: string
  user_id: string
  owner?: {
    id: string
    name: string | null
    email: string
    type: string | null
  }
  user_email?: string
  user_name?: string | null
}




// ── Identity ──────────────────────────────────────────────────────────────────
export interface Identity {
  id: string
  user_id: string | null
  name: string
  type: "individual" | "trust" | "llc" | "corporation" | "partnership" | "other"
  state_province: string | null
  primary_citizenship: string | null
  other_citizenships: string[]
  current_residency: string | null
  citizenship: string[]
  residency: string | null
  risk_profile: "low" | "medium" | "high"
  goals: string[]
  additional_information: string | null
  notes: string | null
  tax_rate?:           number | null        // ← NEW (from IdentityModal update)
  annual_income?:      number | null        // ← NEW (from IdentityModal update)
  created_at: string
  updated_at: string
}

// ── Asset ─────────────────────────────────────────────────────────────────────
export interface Asset {
  id: string
  name: string
  type: string
  owner_id: string
  owner?: Pick<Identity, "id" | "name" | "type">
  location_state?: string
  location_country: string
  purchase_value?: number
  purchase_date?: string
  latest_valuation?: number
  latest_valuation_date?: string
  created_at: string
  updated_at: string
}

export interface AssetWithCalculations extends Asset {
  value_change_percentage?: number
  value_change_amount?: number
}

// ── Dashboard ─────────────────────────────────────────────────────────────────
export interface DashboardStats {
  totalIdentities: number
  totalAssets: number
  totalValue: number
  averageReturn: number
}

export interface ActivityItem {
  id: string
  type:
    | "asset_added"
    | "identity_added"
    | "valuation_updated"
    | "optimization_generated"
  title: string
  description: string
  timestamp: string
}