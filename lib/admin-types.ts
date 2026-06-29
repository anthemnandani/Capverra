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
  // Plan / subscription info (from public.users)
  plan_name: string | null
  subscription_status: string | null
  subscription_start_date: string | null
  subscription_end_date: string | null
  cancel_at_period_end: boolean | null
  stripe_customer_id?: string | null
  stripe_subscription_id?: string | null
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