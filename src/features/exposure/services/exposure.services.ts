
import { createServerClient } from '@/lib/supabase/server'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { ExposureRow } from '@/features/companies/types'

export async function getCompanyExposure(
  clientOrCompanyId: SupabaseClient | string,
  companyIdParam?: string
): Promise<ExposureRow[]> {
  const supabase = typeof clientOrCompanyId === 'string'
    ? await createServerClient()
    : clientOrCompanyId

  const companyId = typeof clientOrCompanyId === 'string'
    ? clientOrCompanyId
    : companyIdParam!
  const { data, error } = await supabase
    .from('exposure_positions')
    .select(`
      id,
      holder_id,
      holder_type,
      exposure_type,
      instrument_name,
      issue_date,
      ownership_pct,
      share_class,
      status,
      last_verified_date,
      verified_by,
      holders (
        name
      ),
      exposure_events (
        amount
      )
    `)
    .eq('company_id', companyId)
    .order('issue_date', { ascending: true })

  if (error) {
    console.error('[exposure.service] getCompanyExposure error:', error.message)
    return []
  }

  return (data ?? []).map((row) => {
    const holderRow = Array.isArray(row.holders) ? row.holders[0] : row.holders
    const events = (row.exposure_events ?? []) as { amount: number }[]
    const amountInvested = events.reduce((sum, e) => sum + (Number(e.amount) || 0), 0)

    return {
      id: row.id,
      holder_id: row.holder_id,
      holder_name: holderRow?.name ?? '—',
      holder_type: row.holder_type,
      exposure_type: row.exposure_type,
      instrument_name: row.instrument_name ?? null,
      issue_date: row.issue_date ?? null,
      amount_invested: amountInvested,
      ownership_pct: row.ownership_pct ?? null,
      share_class: row.share_class ?? null,
      status: row.status,
      last_verified_date: row.last_verified_date ?? null,
      verified_by: row.verified_by ?? null,
    }
  })
}