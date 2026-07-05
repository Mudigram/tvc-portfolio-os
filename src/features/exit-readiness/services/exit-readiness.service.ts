import type { SupabaseClient } from '@supabase/supabase-js'
import type { ExitReadinessData } from '../types/index'

export async function getCompanyExitReadiness(
  supabase: SupabaseClient,
  companyId: string
): Promise<ExitReadinessData | null> {
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