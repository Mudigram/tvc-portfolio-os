// ─────────────────────────────────────────────────────────────
// Cap Table — Server service
// Called only from server components / server actions.
// No direct Supabase imports in pages or components.
// ─────────────────────────────────────────────────────────────
import { createServerClient } from '@/lib/supabase/server'
import { toCapTableViewModel } from '../utils/derive'
import type { CapTableOwnershipRow, CapTableOwnershipViewModel } from '../types'

// ── Fetch one company's cap table record ─────────────────────
// Returns null if no record exists yet (first-time entry).
export async function getCapTableByCompanyId(
  companyId: string,
): Promise<CapTableOwnershipViewModel | null> {
  const supabase = await createServerClient()

  const { data, error } = await supabase
    .from('cap_table_ownership')
    .select('*')
    .eq('company_id', companyId)
    .maybeSingle()

  if (error) {
    console.error('[cap-table] fetch error:', error.message)
    return null
  }

  if (!data) return null

  return toCapTableViewModel(data as CapTableOwnershipRow)
}

// ── Fetch all companies cap table data (dashboard widgets) ────
// Internal only — angel portal never calls this.
export async function getAllCapTableSummaries(): Promise<
  CapTableOwnershipViewModel[]
> {
  const supabase = await createServerClient()

  const { data, error } = await supabase
    .from('cap_table_ownership')
    .select('*')

  if (error) {
    console.error('[cap-table] fetch all error:', error.message)
    return []
  }

  return (data as CapTableOwnershipRow[]).map(toCapTableViewModel)
}