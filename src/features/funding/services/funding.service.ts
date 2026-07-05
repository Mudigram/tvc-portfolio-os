import type { SupabaseClient } from '@supabase/supabase-js'
import type { FundingRound, FundingStatus, CompanyFundingSummary } from '../types/index'

/**
 * Single data query fetching both history logs and current state arrays concurrently
 */
export async function getCompanyFundingData(
  supabase: SupabaseClient, 
  companyId: string
): Promise<{ rounds: FundingRound[]; status: FundingStatus | null }> {
  
  // Parallel fetch optimizes performance pipeline speeds
  const [roundsResult, statusResult] = await Promise.all([
    supabase
      .from('funding_rounds')
      .select('*')
      .eq('company_id', companyId)
      .order('date_closed', { ascending: false }),
    supabase
      .from('funding_status')
      .select('*')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false })
      .limit(1)
  ])

  if (roundsResult.error) {
    console.error('[funding.service] getCompanyFundingData (rounds) error:', roundsResult.error.message)
  }
  if (statusResult.error) {
    console.error('[funding.service] getCompanyFundingData (status) error:', statusResult.error.message)
  }

  const rounds = (roundsResult.data ?? []) as FundingRound[]
  
  // Grab the latest active snapshot row if it exists
  const statusRows = statusResult.data as FundingStatus[] | null
  const status = statusRows && statusRows.length > 0 ? statusRows[0] : null

  return { rounds, status }
}

/**
 * Pure data transformation: computes totals, valuations, and checks for dashboard metrics
 */
export function computeFundingSummary(
  rounds: FundingRound[], 
  status: FundingStatus | null
): CompanyFundingSummary {
  // Sum only valid numeric value fields
  const total_raised = rounds.reduce((sum, current) => sum + Number(current.amount_raised ?? 0), 0)
  
  const latest_round = rounds.at(0) ?? null
  
  // Post-money is the baseline for current valuation, fallback to pre-money
  const latest_valuation = latest_round 
    ? (latest_round.post_money_valuation ?? latest_round.pre_money_valuation) 
    : null

  return {
    total_raised,
    total_rounds: rounds.length,
    latest_round,
    latest_valuation,
    actively_raising: status?.is_actively_raising ?? false,
    runway_months: status?.runway_months ?? null
  }
}