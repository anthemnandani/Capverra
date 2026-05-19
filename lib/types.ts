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