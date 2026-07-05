
import type { SupabaseClient } from '@supabase/supabase-js'
import type { ExposureRow } from '@/features/companies/types'

export async function getCompanyExposure(supabase: SupabaseClient, companyId: string): Promise<ExposureRow[]> {
  const { data, error } = await supabase
    .from('economic_exposure')
    .select(`
      id,
      holder_id,
      holder_type,
      exposure_type,
      instrument_name,
      issue_date,
      amount_invested,
      ownership_pct,
      share_class,
      status,
      last_verified_date,
      verified_by,
      holders (
        name
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
    return {
      id: row.id,
      holder_id: row.holder_id,
      holder_name: holderRow?.name ?? '—',
      holder_type: row.holder_type,
      exposure_type: row.exposure_type,
      instrument_name: row.instrument_name ?? null,
      issue_date: row.issue_date ?? null,
      amount_invested: row.amount_invested ?? null,
      ownership_pct: row.ownership_pct ?? null,
      share_class: row.share_class ?? null,
      status: row.status,
      last_verified_date: row.last_verified_date ?? null,
      verified_by: row.verified_by ?? null,
    }
  })
}