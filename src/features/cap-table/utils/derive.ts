// ─────────────────────────────────────────────────────────────
// Cap Table — Derived field calculators
// Pure functions. No Supabase imports. Safe to use
// in both server components and client components.
// ─────────────────────────────────────────────────────────────

import type {
    CapTableOwnershipRow,
    CapTableOwnershipDerived,
    CapTableOwnershipViewModel,
    CapTableStatus,
    OwnershipStatus,
  } from '../types'
  
  // ── Cap table document status ─────────────────────────────────
  // Green  = current cap table exists, updated within 12 months
  // Amber  = current cap table exists, but older than 12 months
  // Red    = no current cap table URL at all
  export function deriveCapTableStatus(row: {
    current_cap_table_url: string | null
    cap_table_last_updated: string | null
  }): CapTableStatus {
    if (!row.current_cap_table_url) return 'Red'
  
    if (!row.cap_table_last_updated) return 'Amber'
  
    const lastUpdated = new Date(row.cap_table_last_updated)
    const twelveMonthsAgo = new Date()
    twelveMonthsAgo.setFullYear(twelveMonthsAgo.getFullYear() - 1)
  
    return lastUpdated >= twelveMonthsAgo ? 'Green' : 'Amber'
  }
  
  // ── TVC ownership movement direction ─────────────────────────
  export function deriveOwnershipStatus(
    atInvestment: number | null,
    current: number | null,
  ): OwnershipStatus | null {
    if (atInvestment == null || current == null) return null
    if (current < atInvestment) return 'Diluted'
    if (current > atInvestment) return 'Increased'
    return 'Maintained'
  }
  
  // ── Founder dilution ──────────────────────────────────────────
  export function deriveFounderDilution(
    atInvestment: number | null,
    current: number | null,
  ): number | null {
    if (atInvestment == null || current == null) return null
    return parseFloat((atInvestment - current).toFixed(3))
  }
  
  // ── TVC ownership change (positive = we diluted) ─────────────
  export function deriveTvcOwnershipChange(
    atInvestment: number | null,
    current: number | null,
  ): number | null {
    if (atInvestment == null || current == null) return null
    return parseFloat((atInvestment - current).toFixed(3))
  }
  
  // ── Compose all derived fields onto a DB row ─────────────────
  export function deriveCapTableFields(
    row: CapTableOwnershipRow,
  ): CapTableOwnershipDerived {
    const founderDilution = deriveFounderDilution(
      row.founder_ownership_at_investment,
      row.current_founder_ownership,
    )
    const tvcOwnershipChange = deriveTvcOwnershipChange(
      row.tvc_ownership_at_investment,
      row.current_tvc_ownership,
    )
    const ownershipStatus = deriveOwnershipStatus(
      row.tvc_ownership_at_investment,
      row.current_tvc_ownership,
    )
    const capTableStatus = deriveCapTableStatus(row)
  
    return { founderDilution, tvcOwnershipChange, ownershipStatus, capTableStatus }
  }
  
  // ── Build the full view model ─────────────────────────────────
  export function toCapTableViewModel(
    row: CapTableOwnershipRow,
  ): CapTableOwnershipViewModel {
    return { ...row, ...deriveCapTableFields(row) }
  }
  
  // ── Format helpers (UI only) ──────────────────────────────────
  export function formatPct(value: number | null): string {
    if (value == null) return '—'
    return `${value.toFixed(1)}%`
  }
  
  export function formatCurrency(
    value: number | null,
    currency: string = 'USD',
  ): string {
    if (value == null) return '—'
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(value)
  }
  
  // ── Alert flag helpers ────────────────────────────────────────
  // ── Alert flag helpers ────────────────────────────────────────
  const DEFAULT_FOUNDER_DILUTION_THRESHOLD = 25
  const DEFAULT_TVC_DILUTION_THRESHOLD = 20
  
  export function isFounderDilutionAlert(
    vm: CapTableOwnershipViewModel,
    defaultThreshold?: number | null,
  ): boolean {
    if (vm.founderDilution == null) return false
    const threshold =
      vm.founder_dilution_alert_threshold ?? defaultThreshold ?? DEFAULT_FOUNDER_DILUTION_THRESHOLD
    return vm.founderDilution > threshold
  }
  
  export function isTvcDilutionAlert(
    vm: CapTableOwnershipViewModel,
    defaultThreshold?: number | null,
  ): boolean {
    if (vm.tvcOwnershipChange == null) return false
    const threshold =
      vm.tvc_dilution_alert_threshold ?? defaultThreshold ?? DEFAULT_TVC_DILUTION_THRESHOLD
    return vm.tvcOwnershipChange > threshold
  }