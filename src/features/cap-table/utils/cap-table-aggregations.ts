// ─────────────────────────────────────────────────────────────
// Cap Table Dashboard — aggregation utilities
// Pure functions. Used by:
//   1. The service (initial server-side aggregation)
//   2. The client component (re-aggregation on filter change)
// ─────────────────────────────────────────────────────────────

import { deriveCapTableStatus } from './derive'
import type { CapTableDashboardData } from '../services/cap-table-dashboard.service'

// ── Raw row shape returned from Supabase ─────────────────────
export interface CapTableRawRow {
  id: string
  company_id: string
  company_name: string
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
}

// ── Filter state ─────────────────────────────────────────────
export interface CapTableFilters {
  year: string           // '' = all, '2023' etc
  round: string          // '' = all, 'Seed' etc
  capTableStatus: string // '' = all, 'Green' | 'Amber' | 'Red'
  ownershipStatus: string // '' = all, 'Diluted' | 'Maintained' | 'Increased'
  dilutionRange: string  // '' = all, '0-10' | '11-25' | '26-50' | 'gt50'
}

export const DEFAULT_FILTERS: CapTableFilters = {
  year: '',
  round: '',
  capTableStatus: '',
  ownershipStatus: '',
  dilutionRange: '',
}

// ── Filter a set of raw rows ──────────────────────────────────
export function applyFilters(
  rows: CapTableRawRow[],
  filters: CapTableFilters,
): CapTableRawRow[] {
  return rows.filter((row) => {
    // Year filter
    if (filters.year) {
      const year = row.investment_date
        ? new Date(row.investment_date).getFullYear().toString()
        : null
      if (year !== filters.year) return false
    }

    // Round filter
    if (filters.round && row.investment_round !== filters.round) return false

    // Cap table status filter
    if (filters.capTableStatus) {
      const status = deriveCapTableStatus(row)
      if (status !== filters.capTableStatus) return false
    }

    // Ownership status filter
    if (filters.ownershipStatus) {
      const { tvc_ownership_at_investment: ti, current_tvc_ownership: tc } = row
      if (ti == null || tc == null) return false
      const status =
        tc > ti ? 'Increased' : tc < ti ? 'Diluted' : 'Maintained'
      if (status !== filters.ownershipStatus) return false
    }

    // Dilution range filter
    if (filters.dilutionRange) {
      const { founder_ownership_at_investment: fi, current_founder_ownership: fc } = row
      if (fi == null || fc == null) return false
      const dilution = fi - fc
      switch (filters.dilutionRange) {
        case '0-10':   if (dilution > 10) return false; break
        case '11-25':  if (dilution <= 10 || dilution > 25) return false; break
        case '26-50':  if (dilution <= 25 || dilution > 50) return false; break
        case 'gt50':   if (dilution <= 50) return false; break
      }
    }

    return true
  })
}

// ── Aggregate filtered rows into dashboard data ───────────────
export function aggregateRows(
  filteredRows: CapTableRawRow[],
  totalCompanies: number,
): Omit<CapTableDashboardData, 'alerts'> & { alerts: CapTableDashboardData['alerts'] } {
  let statusGreen = 0
  let statusAmber = 0
  let statusRed = 0

  let ownershipIncreased = 0
  let ownershipMaintained = 0
  let ownershipDilutedLt5 = 0
  let ownershipDiluted5_10 = 0
  let ownershipDilutedGt10 = 0

  let dilution0_10 = 0
  let dilution11_25 = 0
  let dilution26_50 = 0
  let dilutionGt50 = 0

  let founderDilutionSum = 0
  let founderDilutionCount = 0
  let tvcChangeSum = 0
  let tvcChangeCount = 0

  const alerts: CapTableDashboardData['alerts'] = []

  for (const row of filteredRows) {
    const status = deriveCapTableStatus(row)
    if (status === 'Green') statusGreen++
    else if (status === 'Amber') statusAmber++
    else statusRed++

    if (status === 'Red') {
      alerts.push({ company_id: row.company_id, company_name: row.company_name, alert_type: 'missing_cap_table' })
    } else if (status === 'Amber') {
      alerts.push({ company_id: row.company_id, company_name: row.company_name, alert_type: 'outdated_cap_table' })
    }

    const fi = row.founder_ownership_at_investment
    const fc = row.current_founder_ownership
    if (fi != null && fc != null) {
      const dilution = fi - fc
      founderDilutionSum += dilution
      founderDilutionCount++

      if (dilution <= 10) dilution0_10++
      else if (dilution <= 25) dilution11_25++
      else if (dilution <= 50) dilution26_50++
      else dilutionGt50++

      const founderThreshold = row.founder_dilution_alert_threshold ?? 25
      if (dilution > founderThreshold) {
        alerts.push({ company_id: row.company_id, company_name: row.company_name, alert_type: 'founder_dilution' })
      }
    }

    const ti = row.tvc_ownership_at_investment
    const tc = row.current_tvc_ownership
    if (ti != null && tc != null) {
      const change = ti - tc
      tvcChangeSum += change
      tvcChangeCount++

      if (tc > ti) ownershipIncreased++
      else if (tc === ti) ownershipMaintained++
      else if (change < 5) ownershipDilutedLt5++
      else if (change <= 10) ownershipDiluted5_10++
      else ownershipDilutedGt10++

      const tvcThreshold = row.tvc_dilution_alert_threshold ?? 20
      if (change > tvcThreshold) {
        alerts.push({ company_id: row.company_id, company_name: row.company_name, alert_type: 'tvc_dilution' })
      }
    }
  }

  const hasCurrentCapTable = filteredRows.filter((r) => r.current_cap_table_url).length
  const missingCapTable = filteredRows.length - hasCurrentCapTable
  const compliancePct = filteredRows.length > 0
    ? Math.round((hasCurrentCapTable / filteredRows.length) * 100)
    : 0

  return {
    total_companies: totalCompanies,
    has_current_cap_table: hasCurrentCapTable,
    missing_cap_table: missingCapTable,
    outdated_cap_table: statusAmber,
    compliance_pct: compliancePct,
    status_green: statusGreen,
    status_amber: statusAmber,
    status_red: statusRed,
    ownership_increased: ownershipIncreased,
    ownership_maintained: ownershipMaintained,
    ownership_diluted_lt5: ownershipDilutedLt5,
    ownership_diluted_5_10: ownershipDiluted5_10,
    ownership_diluted_gt10: ownershipDilutedGt10,
    dilution_0_10: dilution0_10,
    dilution_11_25: dilution11_25,
    dilution_26_50: dilution26_50,
    dilution_gt50: dilutionGt50,
    avg_founder_dilution: founderDilutionCount > 0
      ? Math.round((founderDilutionSum / founderDilutionCount) * 10) / 10
      : null,
    avg_tvc_ownership_change: tvcChangeCount > 0
      ? Math.round((tvcChangeSum / tvcChangeCount) * 10) / 10
      : null,
    alerts,
  }
}

// ── Derive available filter options from raw rows ─────────────
export function deriveFilterOptions(rows: CapTableRawRow[]) {
  const years = [...new Set(
    rows
      .map((r) => r.investment_date
        ? new Date(r.investment_date).getFullYear().toString()
        : null)
      .filter(Boolean) as string[]
  )].sort((a, b) => b.localeCompare(a))  // newest first

  const rounds = [...new Set(
    rows.map((r) => r.investment_round).filter(Boolean) as string[]
  )].sort()

  return { years, rounds }
}