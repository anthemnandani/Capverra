// Admin-specific TypeScript types

export interface AdminUser {
  id: string
  user_id: string
  email: string
  name: string | null
  role: 'admin' | 'super_admin'
  permissions: string[]
  is_active: boolean
  last_login: string | null
  created_at: string
  updated_at: string
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
  admin_id: string
  report_type: 'users' | 'assets' | 'identities' | 'optimization' | 'analytics'
  title: string
  description: string | null
  filters: Record<string, unknown>
  report_data: Record<string, unknown>
  status: 'pending' | 'processing' | 'completed' | 'failed'
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
  role: string
  created_at: string
  asset_count: number
  identity_count: number
  last_login: string | null
}

export interface AssetWithOwner {
  id: string
  name: string
  type: string
  status: string
  created_at: string
  user_id: string
  user_email: string
  user_name: string | null
}
