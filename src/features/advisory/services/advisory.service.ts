import { createServerClient } from '@/lib/supabase/server'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { AdvisoryActivity, AdvisorRosterItem } from '../types'

/**
 * Concurrently loads historical advisory events and official cap-table advisor rosters
 */
export async function getCompanyAdvisoryData(
  clientOrCompanyId: SupabaseClient | string,
  companyIdParam?: string
): Promise<{ activities: AdvisoryActivity[]; roster: AdvisorRosterItem[] }> {
  const supabase = typeof clientOrCompanyId === 'string'
    ? await createServerClient()
    : clientOrCompanyId

  const companyId = typeof clientOrCompanyId === 'string'
    ? clientOrCompanyId
    : companyIdParam!

  const [activitiesResult, rosterResult] = await Promise.all([
    // Fetch logs ordered newest first
    supabase
      .from('advisory_activity')
      .select('*')
      .eq('company_id', companyId)
      .order('session_date', { ascending: false }),
      
    // Fetch active advisors from Cap Table (exposure_positions)
    supabase
      .from('exposure_positions')
      .select(`
        id,
        instrument_name,
        ownership_pct,
        holders ( name )
      `)
      .eq('company_id', companyId)
      .eq('holder_type', 'Advisor')
  ])

  if (activitiesResult.error) console.error('[advisory.service] logs error:', activitiesResult.error.message)
  if (rosterResult.error) console.error('[advisory.service] roster error:', rosterResult.error.message)

  // Map cap table joins securely
  const roster = (rosterResult.data ?? []).map((row: any) => {
    const holderRow = Array.isArray(row.holders) ? row.holders[0] : row.holders;
    return {
      id: row.id,
      advisor_name: holderRow?.name ?? 'Unknown Advisor',
      instrument_name: row.instrument_name,
      ownership_pct: row.ownership_pct
    }
  })

  return {
    activities: (activitiesResult.data ?? []) as AdvisoryActivity[],
    roster
  }
}