import { createServerClient } from '@/lib/supabase/server'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { ExitReadinessData } from '../types/index'

export async function getCompanyExitReadiness(
  clientOrCompanyId: SupabaseClient | string,
  companyIdParam?: string
): Promise<ExitReadinessData | null> {
  const supabase = typeof clientOrCompanyId === 'string'
    ? await createServerClient()
    : clientOrCompanyId

  const companyId = typeof clientOrCompanyId === 'string'
    ? clientOrCompanyId
    : companyIdParam!
  const { data, error } = await supabase
    .from('exit_readiness')
    .select('*')
    .eq('company_id', companyId)
    .maybeSingle()

  if (error) {
    console.error('[exit-readiness.service] Error loading metrics:', error.message)
    return null
  }

  return data as ExitReadinessData | null
}