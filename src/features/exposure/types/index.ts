// TVCLabs entity holder IDs — used to filter "our" position vs other investors
// These match the holders seeded earlier
export const TVCLABS_HOLDER_IDS = [
    '10000000-0000-0000-0000-000000000001', // TVCLabs
    '10000000-0000-0000-0000-000000000002', // TD (Principal)
    '10000000-0000-0000-0000-000000000003', // Angels@TVCLabs SPV
  ]
  
  export type ExposureType =
    | 'Equity'
    | 'SAFE'
    | 'Convertible Note'
    | 'Option'
    | 'Warrant'
    | 'Advisory Equity'
  
  export type HolderType = 'Founder' | 'Investor' | 'Advisor' | 'Employee'
  export type ExposureStatus = 'Active' | 'Converted' | 'Exited' | 'Cancelled'
  
  // Shape of one exposure row with holder and company joined
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
  
  // One row in the by-company summary table
  export interface CompanyExposureSummary {
    company_id: string
    company_name: string
    portfolio_health: 'Green' | 'Amber' | 'Red' | null
    stage: string | null
    sector: string | null
    is_actively_raising: boolean
    tvclabs_invested: number        // sum of amount_invested for TVCLabs entities
    tvclabs_ownership_pct: number   // sum of ownership_pct for TVCLabs entities
    instrument_types: ExposureType[] // distinct types held by TVCLabs entities
    total_rows: number              // all active exposure rows for context
  }
  
  // Aggregate by instrument type across the whole portfolio
  export interface InstrumentTypeSummary {
    exposure_type: ExposureType
    total_invested: number
    company_count: number
    row_count: number
  }
  
  // The full portfolio summary bar
  export interface PortfolioSummary {
    total_deployed: number
    active_instruments: number
    companies_tracked: number
    holders_on_record: number
  }
  
  // Everything the page needs — returned from one service call
  export interface PortfolioExposureData {
    summary: PortfolioSummary
    byCompany: CompanyExposureSummary[]
    byInstrument: InstrumentTypeSummary[]
    // Raw rows for the stacked bar chart — per company per instrument type
    chartData: {
      company_name: string
      Equity: number
      SAFE: number
      'Convertible Note': number
      Option: number
      Warrant: number
      'Advisory Equity': number
    }[]
  }