// ─────────────────────────────────────────────────────────────
// Cap Table & Ownership — Types
// ─────────────────────────────────────────────────────────────

export type InvestmentRound =
  | 'Pre-Seed'
  | 'Seed'
  | 'Series A'
  | 'Series B'
  | 'Series C'
  | 'Series D+'
  | 'Bridge'
  | 'Convertible Note'
  | 'SAFE'
  | 'Grant'
  | 'Other'

export type CapTableCurrency = 'USD' | 'GBP' | 'EUR' | 'NGN'

// ── Raw DB row (what comes back from Supabase) ────────────────
export interface CapTableOwnershipRow {
  id: string
  company_id: string

  investment_date: string | null
  investment_round: InvestmentRound | null
  amount_invested: number | null
  currency: CapTableCurrency

  cap_table_at_investment_url: string | null
  cap_table_at_investment_note: string | null
  current_cap_table_url: string | null
  current_cap_table_note: string | null
  cap_table_last_updated: string | null

  founder_ownership_at_investment: number | null
  current_founder_ownership: number | null

  tvc_ownership_at_investment: number | null
  current_tvc_ownership: number | null

  founder_dilution_alert_threshold: number | null
  tvc_dilution_alert_threshold: number | null

  notes: string | null
  created_at: string
  updated_at: string
}

// ── Derived / calculated fields ───────────────────────────────
export type CapTableStatus = 'Green' | 'Amber' | 'Red'
export type OwnershipStatus = 'Diluted' | 'Maintained' | 'Increased'

export interface CapTableOwnershipDerived {
  founderDilution: number | null           // at_investment - current
  tvcOwnershipChange: number | null        // at_investment - current (positive = diluted)
  ownershipStatus: OwnershipStatus | null
  capTableStatus: CapTableStatus
}

// ── Combined view model used in the UI ───────────────────────
export interface CapTableOwnershipViewModel
  extends CapTableOwnershipRow,
    CapTableOwnershipDerived {}

// ── Form values (what the save action receives) ───────────────
export interface CapTableOwnershipFormValues {
  investment_date: string
  investment_round: InvestmentRound | ''
  amount_invested: string        // string from input, parsed before save
  currency: CapTableCurrency

  cap_table_at_investment_url: string
  cap_table_at_investment_note: string
  current_cap_table_url: string
  current_cap_table_note: string
  cap_table_last_updated: string

  founder_ownership_at_investment: string
  current_founder_ownership: string

  tvc_ownership_at_investment: string
  current_tvc_ownership: string

  founder_dilution_alert_threshold: string
  tvc_dilution_alert_threshold: string

  notes: string
}

export const INVESTMENT_ROUNDS: InvestmentRound[] = [
  'Pre-Seed',
  'Seed',
  'Series A',
  'Series B',
  'Series C',
  'Series D+',
  'Bridge',
  'Convertible Note',
  'SAFE',
  'Grant',
  'Other',
]

export const CURRENCIES: CapTableCurrency[] = ['USD', 'GBP', 'EUR', 'NGN']