export interface CompanyCardData {
    id: string
    name: string
    sector: string | null
    stage: string | null
    logo_url: string | null
    logo_path: string | null
  
    portfolio_health: 'Green' | 'Amber' | 'Red' | null
    health_reviewed_at: string | null
  
    update_submitted_this_cycle: boolean
    last_update_date: string | null
  
    is_actively_raising: boolean
    has_stale_verification: boolean
  
    exit_readiness_signal: 'Early' | 'Progressing' | 'Ready' | null
  }

  // Full company profile
export interface CompanyProfile {
    id: string
    name: string
    sector: string | null
    stage: string | null
    country: string | null
    website: string | null
    legal_entity: string | null
    last_verified_date: string | null
    verified_by: string | null
  
    // Identity extension fields
    logo_url: string | null
    logo_path?: string | null
    bio: string | null
    investment_date: string | null
    instrument_type: string | null
    amount_invested: number | null
    currency: string | null
    syndicate_holdings: string | null

    // Health
    portfolio_health: 'Green' | 'Amber' | 'Red' | null
    health_reviewed_at: string | null
    health_reviewed_by: string | null
    health_notes: string | null
  
    // Linked founder from CRM
    founder: {
      id: string
      full_name: string
      email: string
    } | null

    // Linked figure source documents
    figure_documents: FigureDocument[]
  }

  export type ReconciliationStatus = 'Unverified' | 'Pending' | 'Reconciled' | 'Discrepancy'

  export interface FigureDocument {
    id: string
    company_id: string
    figure_key: string
    document_name: string
    file_path: string | null
    file_url: string
    file_size: number | null
    mime_type: string | null
    uploaded_at: string
    uploaded_by: string | null
    reconciliation_status: ReconciliationStatus
    reconciliation_notes: string | null
  }

  
  // Health update payload
  export interface HealthUpdatePayload {
    portfolio_health: 'Green' | 'Amber' | 'Red'
    health_notes: string
  }

  // Holder type
  export type HolderType = 'Founder' | 'Investor' | 'Advisor' | 'Employee'

  // Exposure type
export type ExposureType =
  | 'Equity'
  | 'SAFE'
  | 'Convertible Note'
  | 'Option'
  | 'Warrant'
  | 'Advisory Equity'

export type ExposureStatus = 'Active' | 'Converted' | 'Exited' | 'Cancelled'


// Exposure row
export interface ExposureRow {
  id: string
  holder_id: string
  holder_name: string
  holder_type: HolderType
  exposure_type: ExposureType
  instrument_name: string | null
  issue_date: string | null
  amount_invested: number | null
  ownership_pct: number | null
  share_class: string | null
  status: ExposureStatus
  last_verified_date: string | null
  verified_by: string | null
}

// Cap table view
export type CapTableView =
  | 'full-equity'
  | 'founder'
  | 'safe-convertible'
  | 'esop-incentive'