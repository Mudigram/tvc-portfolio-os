import type { SupabaseClient } from '@supabase/supabase-js'
import type { DdrStatusData } from '../types'

export async function getCompanyDdrStatus(
  supabase: SupabaseClient,
  companyId: string
): Promise<DdrStatusData | null> {
  const { data, error } = await supabase
    .from('ddr_status')
    .select('*')
    .eq('company_id', companyId)
    .maybeSingle()

  if (error) {
    console.error('[ddr.service] Error pulling operational milestones:', error.message)
    return null
  }

  return data as DdrStatusData | null
}