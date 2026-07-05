'use server'

import { revalidatePath } from 'next/cache'
import { createServerClient } from '@/lib/supabase/server'
import { getClaims } from '@/features/auth/services/auth.server'
import { getFounderCompanyId } from '@/features/founder-portal/services/founder-portal.service'
import type { UpdateFundingInput } from '@/features/founder-portal/types'

export async function updateFundingAction(
  input: UpdateFundingInput
): Promise<{ success: boolean; error?: string }> {
  const claims = await getClaims()
  if (!claims) return { success: false, error: 'Not authenticated.' }
  if (!['internal', 'founder'].includes(claims.role)) {
    return { success: false, error: 'Not authorised.' }
  }

  // Founders can only write to their own company — verify the scope
  if (claims.role === 'founder') {
    const ownCompanyId = await getFounderCompanyId(claims.userId)
    if (!ownCompanyId || ownCompanyId !== input.company_id) {
      return { success: false, error: 'You can only update your own company.' }
    }
  }

  const supabase = await createServerClient()

  // Check for an existing row — update if present, insert if not
  const { data: existing } = await supabase
    .from('funding_status')
    .select('id')
    .eq('company_id', input.company_id)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  const payload = {
    company_id: input.company_id,
    runway_months: input.runway_months,
    current_raise_target: input.current_raise_target,
    instrument: input.instrument,
    valuation_cap: input.valuation_cap,
    lead_investor_status: input.lead_investor_status,
    existing_commitments: input.existing_commitments,
    followon_opportunity: input.followon_opportunity,
    investor_materials_status: input.investor_materials_status,
    is_actively_raising: input.is_actively_raising,
    last_verified_date: new Date().toISOString().split('T')[0],
    verified_by: claims.email,
  }

  const { error } = existing
    ? await supabase.from('funding_status').update(payload).eq('id', existing.id)
    : await supabase.from('funding_status').insert(payload)

  if (error) {
    console.error('[updateFunding.action] error:', error.message)
    return { success: false, error: 'Failed to update funding status.' }
  }

  revalidatePath('/my-company')
  revalidatePath(`/companies/${input.company_id}`)

  return { success: true }
}