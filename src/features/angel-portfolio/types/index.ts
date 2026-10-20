export type HealthStatus = 'Green' | 'Amber' | 'Red'
export type ExitSignal = 'Early' | 'Progressing' | 'Ready'

// One exposure row — what the angel personally holds in one company
export interface AngelPosition {
  exposure_id: string
  exposure_type: string
  instrument_name: string | null
  amount_invested: number | null
  current_value: number | null
  unrealized_gain: number | null
  moic: number | null
  ownership_pct: number | null
  issue_date: string | null
  status: string
}

// One company summary — company info + angel's position in it
export interface AngelCompanySummary {
  company_id: string
  company_name: string
  sector: string | null
  stage: string | null
  logo_path: string | null
  portfolio_health: HealthStatus | null
  health_reviewed_at: string | null
  is_actively_raising: boolean
  update_submitted_this_cycle: boolean
  exit_readiness_signal: ExitSignal | null
  position: AngelPosition  // their specific holding
}

// Personal portfolio stats shown in the summary bar
export interface AngelPortfolioSummary {
  total_invested: number
  total_current_value: number
  total_unrealized_gain: number
  overall_moic: number | null
  companies_count: number
  sectors_count: number
  instruments_count: number
  green_count: number
  amber_count: number
  red_count: number
}

// One event in the activity feed
export type ActivityEventType =
  | 'health_changed'
  | 'health_reviewed'
  | 'update_submitted'
  | 'raise_started'
  | 'raise_ended'

export interface AngelActivityEvent {
  id: string
  company_id: string
  company_name: string
  event_type: ActivityEventType
  label: string           // human-readable description
  detail: string | null   // supporting detail e.g. "Green → Amber"
  occurred_at: string
}

// Full company detail for /portfolio/[companyId]
export interface AngelCompanyDetail {
    company_id: string
    company_name: string
    sector: string | null
    stage: string | null
    country: string | null
    logo_path: string | null
    portfolio_health: HealthStatus | null
    health_reviewed_at: string | null
    is_actively_raising: boolean
    update_submitted_this_cycle: boolean
    exit_readiness_signal: ExitSignal | null
    positions: AngelPosition[]          // changed from singular `position`
    blended: {
      total_invested: number
      total_ownership_pct: number
      total_current_value: number
      total_unrealized_gain: number
      overall_moic: number | null
    }
    health_history: {
      health_status: HealthStatus
      previous_status: HealthStatus | null
      reviewed_at: string
    }[]
    monthly_update_items?: {
      id: string
      month: number | null
      year: number | null
      status: string
      submitted_at: string | null
      achievements: string | null
      challenges: string | null
      targets: string | null
    }[]
  }

// Angel user profile and holder account overview
export interface AngelProfileData {
  user: {
    id: string
    email: string
    role: string
    created_at: string
    last_sign_in_at: string | null
  }
  holder: {
    id: string
    name: string
    holder_type: string
    email: string | null
    is_tvclabs_entity: boolean
  } | null
  portfolio_overview: {
    total_invested: number
    companies_count: number
    instruments_count: number
    sectors: string[]
    instruments: string[]
  }
}