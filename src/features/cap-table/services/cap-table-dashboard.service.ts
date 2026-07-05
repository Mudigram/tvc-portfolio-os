// ─────────────────────────────────────────────────────────────
// Cap Table — Dashboard summary service
// Now returns rawRows alongside aggregated data so the client
// component can re-aggregate when filters change.
// ─────────────────────────────────────────────────────────────

import { createServerClient } from '@/lib/supabase/server'
import { aggregateRows } from '../utils/cap-table-aggregations'
import type { CapTableRawRow } from '../utils/cap-table-aggregations'

export interface CapTableDashboardData {
  total_companies: number
  has_current_cap_table: number
  missing_cap_table: number
  outdated_cap_table: number
  compliance_pct: number
  status_green: number
  status_amber: number
  status_red: number
  ownership_increased: number
  ownership_maintained: number
  ownership_diluted_lt5: number
  ownership_diluted_5_10: number
  ownership_diluted_gt10: number
  dilution_0_10: number
  dilution_11_25: number
  dilution_26_50: number
  dilution_gt50: number
  avg_founder_dilution: number | null
  avg_tvc_ownership_change: number | null
  alerts: {
    company_id: string
    company_name: string
    alert_type: 'missing_cap_table' | 'outdated_cap_table' | 'founder_dilution' | 'tvc_dilution'
  }[]
}

// ── What the dashboard page receives ─────────────────────────
export interface CapTableDashboardPayload {
  data: CapTableDashboardData    // pre-aggregated for initial render
  rawRows: CapTableRawRow[]      // for client-side filter re-aggregation
  totalCompanies: number         // denominator stays fixed regardless of filters
}

export async function getCapTableDashboardData(): Promise<CapTableDashboardPayload> {
  const supabase = await createServerClient()

  const { data, error } = await supabase
    .from('cap_table_ownership')
    .select(`
      id,
      company_id,
      investment_date,
      investment_round,
      current_cap_table_url,
      cap_table_last_updated,
      founder_ownership_at_investment,
      current_founder_ownership,
      tvc_ownership_at_investment,
      current_tvc_ownership,
      founder_dilution_alert_threshold,
      tvc_dilution_alert_threshold,
      companies ( id, name )
    `)

  const { count: totalCompanies } = await supabase
    .from('companies')
    .select('*', { count: 'exact', head: true })

  const total = totalCompanies ?? 0

  if (error) {
    console.error('[cap-table-dashboard] fetch error:', error.message)
    return { data: emptyData(total), rawRows: [], totalCompanies: total }
  }

  // ── Normalise raw rows ────────────────────────────────────
  type CapTableDashboardRow = {
    id: string
    company_id: string
    investment_date: string | null
    investment_round: string | null
    current_cap_table_url: string | null
    cap_table_last_updated: string | null
    founder_ownership_at_investment: number | null
    current_founder_ownership: number | null
    tvc_ownership_at_investment: number | null
    current_tvc_ownership: number | null
    founder_dilution_alert_threshold: number | null
    tvc_dilution_alert_threshold: number | null
    companies: { id: string; name: string }[] | { id: string; name: string } | null
  }

  const rawRows: CapTableRawRow[] = ((data ?? []) as unknown as CapTableDashboardRow[]).map((row) => {
    const co = Array.isArray(row.companies) ? row.companies[0] : row.companies
    return {
      id: row.id,
      company_id: row.company_id,
      company_name: co?.name ?? 'Unknown',
      investment_date: row.investment_date,
      investment_round: row.investment_round,
      current_cap_table_url: row.current_cap_table_url,
      cap_table_last_updated: row.cap_table_last_updated,
      founder_ownership_at_investment: row.founder_ownership_at_investment,
      current_founder_ownership: row.current_founder_ownership,
      tvc_ownership_at_investment: row.tvc_ownership_at_investment,
      current_tvc_ownership: row.current_tvc_ownership,
      founder_dilution_alert_threshold: row.founder_dilution_alert_threshold,
      tvc_dilution_alert_threshold: row.tvc_dilution_alert_threshold,
    }
  })

  // Companies with no cap table row yet count as Red in the full view
  const missingRowCount = total - rawRows.length
  const aggregated = aggregateRows(rawRows, total)
  aggregated.status_red += missingRowCount
  aggregated.missing_cap_table = total - aggregated.has_current_cap_table
  aggregated.total_companies = total

  return { data: aggregated, rawRows, totalCompanies: total }
}

function emptyData(total: number): CapTableDashboardData {
  return {
    total_companies: total,
    has_current_cap_table: 0,
    missing_cap_table: total,
    outdated_cap_table: 0,
    compliance_pct: 0,
    status_green: 0,
    status_amber: 0,
    status_red: total,
    ownership_increased: 0,
    ownership_maintained: 0,
    ownership_diluted_lt5: 0,
    ownership_diluted_5_10: 0,
    ownership_diluted_gt10: 0,
    dilution_0_10: 0,
    dilution_11_25: 0,
    dilution_26_50: 0,
    dilution_gt50: 0,
    avg_founder_dilution: null,
    avg_tvc_ownership_change: null,
    alerts: [],
  }
}