export interface Identity {
  id: string
  name: string
  type: "individual" | "entity" | "trust" | "partnership" | "corporation" | "llc"
  citizenship: string[]
  residency: string
  risk_profile: "low" | "medium" | "aggressive"
  goals: string[]
  additional_information?: string
  notes?: string
  created_at: string
  updated_at: string
}

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

export interface DashboardStats {
  totalIdentities: number
  totalAssets: number
  totalValue: number
  averageReturn: number
}

export interface ActivityItem {
  id: string
  type: "asset_added" | "identity_added" | "valuation_updated" | "optimization_generated"
  title: string
  description: string
  timestamp: string
}
