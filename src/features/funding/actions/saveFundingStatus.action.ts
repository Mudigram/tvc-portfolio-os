'use server'

import { createServerClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

interface SaveFundingStatusInput {
  companyId: string
  isActivelyRaising: boolean
  runwayMonths: number | null
  currentRaiseTarget: number | null
  instrument: string | null
  leadInvestorStatus: string | null
  existingCommitments: number | null
  followonOpportunity: boolean
}

export async function saveFundingStatusAction(input: SaveFundingStatusInput) {
  try {
    const supabase = await createServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return { success: false, error: 'Unauthorized: Invalid session.' }
    }

    const role = user.app_metadata?.role || user.user_metadata?.role
    if (role !== 'internal' && role !== 'admin') {
      return { success: false, error: 'Unauthorized: Access restricted.' }
    }

    const { data: existing } = await supabase
      .from('funding_status')
      .select('id')
      .eq('company_id', input.companyId)
      .maybeSingle()

    const payload = {
      company_id: input.companyId,
      is_actively_raising: input.isActivelyRaising,
      runway_months: input.runwayMonths,
      current_raise_target: input.currentRaiseTarget,
      instrument: input.instrument,
      lead_investor_status: input.leadInvestorStatus,
      existing_commitments: input.existingCommitments,
      followon_opportunity: input.followonOpportunity,
      verified_by: user.email,
      last_verified_date: new Date().toISOString().split('T')[0],
      updated_at: new Date().toISOString(),
    }

    const query = existing?.id 
      ? supabase.from('funding_status').update(payload).eq('id', existing.id)
      : supabase.from('funding_status').insert(payload)

    const { error } = await query
    if (error) throw error

    revalidatePath('/companies/[id]', 'page')
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to update records.' }
  }
}