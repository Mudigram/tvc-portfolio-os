'use server'

import { createServerClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { SaveExitReadinessInput } from '../types'

export async function saveExitReadinessAction(input: SaveExitReadinessInput) {
  try {
    const supabase = await createServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) return { success: false, error: 'Unauthorized session.' }
    
    const role = user.user_metadata?.role || user.app_metadata?.role
    if (role !== 'internal') return { success: false, error: 'Access restricted to internal managers.' }

    const todayDate = new Date().toISOString().split('T')[0]

    // Using clean native upsert relying on the company_id unique constraint field
    const { error } = await supabase
      .from('exit_readiness')
      .upsert({
        company_id: input.companyId,
        overall_readiness: input.overallReadiness,
        revenue_growth: input.revenueGrowth,
        governance: input.governance,
        cap_table_quality: input.capTableQuality,
        financial_reporting: input.financialReporting,
        product_maturity: input.productMaturity,
        team_depth: input.teamDepth,
        customer_concentration: input.customerConcentration,
        fundraising_history: input.fundraisingHistory,
        poemddr_completeness: input.poemddrCompleteness,
        acquirer_attractiveness: input.acquirerAttractiveness,
        scored_at: todayDate,
        scored_by: user.email,
        verified_by: user.email,
        last_verified_date: todayDate,
      }, { onConflict: 'company_id' })

    if (error) {
      console.error('[saveExitReadinessAction Error]:', error.message)
      throw error
    }

    revalidatePath('/companies/[id]', 'page')
    return { success: true }

  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to update compliance matrix.' }
  }
}