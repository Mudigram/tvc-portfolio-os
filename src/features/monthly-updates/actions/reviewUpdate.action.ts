'use server'

import { revalidatePath } from 'next/cache'
import { createServerClient } from '@/lib/supabase/server'
import { getClaims } from '@/features/auth/services/auth.server'
import type { UpdateStatus } from '@/features/monthly-updates/types'

export interface ReviewUpdateInput {
  updateId: string
  companyId: string
  status: 'Verified' | 'Needs Correction'
  reviewNotes?: string
}

export async function reviewUpdateAction(
  input: ReviewUpdateInput
): Promise<{ success: boolean; error?: string }> {
  const claims = await getClaims()
  if (!claims || (claims.role !== 'internal' && claims.role !== 'admin')) {
    return { success: false, error: 'Not authorised.' }
  }

  if (!input.updateId || !input.companyId) {
    return { success: false, error: 'Update ID and Company ID are required.' }
  }

  if (input.status === 'Needs Correction' && !input.reviewNotes?.trim()) {
    return { success: false, error: 'Review notes are required when requesting corrections.' }
  }

  const supabase = await createServerClient()

  const { error } = await supabase
    .from('monthly_updates')
    .update({
      status: input.status,
      review_notes: input.reviewNotes?.trim() || null,
      reviewed_at: new Date().toISOString(),
      reviewed_by: claims.email,
    })
    .eq('id', input.updateId)
    .eq('company_id', input.companyId)

  if (error) {
    console.error('[reviewUpdate.action] error:', error.message)
    return { success: false, error: 'Failed to update review status.' }
  }

  revalidatePath(`/companies/${input.companyId}`)
  revalidatePath('/updates')
  revalidatePath('/dashboard')
  revalidatePath('/reconciliation')

  return { success: true }
}
