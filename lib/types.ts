// ── Identity ──────────────────────────────────────────────────────────────────
export interface Identity {
  id: string
  user_id: string | null
  name: string
  /** All valid entity types across the codebase */
  type: "individual" | "trust" | "llc" | "corporation" | "partnership" | "other"
  state_province: string | null
  /** ISO-3166-1 alpha-2 country code, e.g. "ZA" */
  primary_citizenship: string | null
  /** Additional ISO codes */
  other_citizenships: string[]
  /** ISO-3166-1 alpha-2 country code */
  current_residency: string | null
  /** Legacy field — kept for backward compatibility */
  citizenship: string[]
  /** Legacy field — kept for backward compatibility */
  residency: string | null
  risk_profile: "low" | "medium" | "high"
  /** Stable goal IDs, e.g. "reduce-taxes-now" */
  goals: string[]
  additional_information: string | null
  notes: string | null
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
  /** ISO-3166-1 alpha-2 country code */
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