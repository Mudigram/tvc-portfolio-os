import { createServerClient } from '@/lib/supabase/server'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { DdrStatusData } from '../types'

export async function getCompanyDdrStatus(
  clientOrCompanyId: SupabaseClient | string,
  companyIdParam?: string
): Promise<DdrStatusData | null> {
  const supabase = typeof clientOrCompanyId === 'string'
    ? await createServerClient()
    : clientOrCompanyId

  const companyId = typeof clientOrCompanyId === 'string'
    ? clientOrCompanyId
    : companyIdParam!
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