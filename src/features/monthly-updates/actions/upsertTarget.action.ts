'use server'

import { revalidatePath } from 'next/cache'
import { createServerClient } from '@/lib/supabase/server'
import { getClaims } from '@/features/auth/services/auth.server'

export interface UpsertTargetInput {
  companyId: string
  month: number
  year: number
  targetRevenue?: number | null
  targetMrr?: number | null
  keyMilestones?: string | null
}

export async function upsertTargetAction(
  input: UpsertTargetInput
): Promise<{ success: boolean; error?: string }> {
  const claims = await getClaims()
  if (!claims || (claims.role !== 'internal' && claims.role !== 'admin')) {
    return { success: false, error: 'Not authorised.' }
  }

  if (!input.companyId || !input.month || !input.year) {
    return { success: false, error: 'Company ID, month, and year are required.' }
  }

  const supabase = await createServerClient()

  const { error } = await supabase
    .from('reporting_targets')
    .upsert(
      {
        company_id: input.companyId,
        month: input.month,
        year: input.year,
        target_revenue: input.targetRevenue != null ? Number(input.targetRevenue) : null,
        target_mrr: input.targetMrr != null ? Number(input.targetMrr) : null,
        key_milestones: input.keyMilestones?.trim() || null,
        created_by: claims.email,
      },
      { onConflict: 'company_id,month,year' }
    )

  if (error) {
    console.error('[upsertTarget.action] error:', error.message)
    return { success: false, error: 'Failed to save reporting target.' }
  }

  revalidatePath(`/companies/${input.companyId}`)
  revalidatePath('/updates')
  revalidatePath('/my-company')

  return { success: true }
}
