export type HealthStatus = 'Green' | 'Amber' | 'Red'

// ─── Company identity — read-only for founders ──────────────────────────────
export interface FounderCompanyIdentity {
  id: string
  name: string
  sector: string | null
  stage: string | null
  country: string | null
  website: string | null
  founded_year: number | null
  portfolio_health: HealthStatus | null
  health_reviewed_at: string | null
}

// ─── Cap table position — founder's own equity rows only ────────────────────
export interface FounderPosition {
  exposure_id: string
  exposure_type: string
  instrument_name: string | null
  issue_date: string | null
  ownership_pct: number | null
  status: string
}

// ─── Funding status — founder-writable ──────────────────────────────────────
export interface FundingStatus {
  id: string | null
  company_id: string
  runway_months: number | null
  current_raise_target: number | null
  instrument: string | null
  valuation_cap: number | null
  lead_investor_status: string | null
  existing_commitments: number | null
  followon_opportunity: boolean
  investor_materials_status: string | null
  is_actively_raising: boolean
  last_verified_date: string | null
  verified_by: string | null
  updated_at: string | null
}

export interface UpdateFundingInput {
  company_id: string
  runway_months: number | null
  current_raise_target: number | null
  instrument: string | null
  valuation_cap: number | null
  lead_investor_status: string | null
  existing_commitments: number | null
  followon_opportunity: boolean
  investor_materials_status: string | null
  is_actively_raising: boolean
}

// ─── DDR — thin status read, future seam for external DDR platform ──────────
export interface DDRStatusSummary {
  status: string | null
  updated_at: string | null
}

// ─── Everything the /my-company page needs ──────────────────────────────────
export interface FounderCompanyData {
  identity: FounderCompanyIdentity
  positions: FounderPosition[]
  funding: FundingStatus | null
  ddr: DDRStatusSummary | null
}