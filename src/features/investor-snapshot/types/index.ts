export type SnapshotMode = 'position_statement' | 'portfolio_showcase'

export interface MonthlyValuePoint {
  month_label: string      // e.g. "Aug 2026", "Jul 2026"
  cutoff_date: string      // "2026-08-31" or "2026-08-24"
  total_invested: number   // Deployed amount ($)
  active_companies: number // Count of active portfolio companies
  active_positions: number // Count of active positions
  net_change: number       // Growth ($) vs prior month point
}

export interface HolderPositionCard {
  position_id: string
  company_id: string
  company_name: string
  company_sector: string | null
  company_stage: string | null
  portfolio_health: 'Green' | 'Amber' | 'Red' | null
  logo_url: string | null
  exposure_type: string
  amount_invested: number
  ownership_pct: number | null
  status: string
}

export interface HolderSnapshotData {
  holder_name: string
  holder_email: string | null
  as_of_date: string
  positions: HolderPositionCard[]
  total_invested: number
  monthly_history: MonthlyValuePoint[]
}

export interface ShowcaseCompanyCard {
  company_id: string
  company_name: string
  sector: string | null
  stage: string | null
  portfolio_health: 'Green' | 'Amber' | 'Red' | null
  logo_url: string | null
  tvclabs_invested: number
  tvclabs_ownership_pct: number
  instrument_types: string[]
}

export interface PortfolioShowcaseData {
  as_of_date: string
  companies: ShowcaseCompanyCard[]
  total_deployed: number
  active_company_count: number
  sectors: string[]
  monthly_history: MonthlyValuePoint[]
}
