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

  const payload = {
    company_id: input.companyId,
    month: Number(input.month),
    year: Number(input.year),
    target_revenue:
      input.targetRevenue != null && !isNaN(Number(input.targetRevenue))
        ? Number(input.targetRevenue)
        : null,
    target_mrr:
      input.targetMrr != null && !isNaN(Number(input.targetMrr))
        ? Number(input.targetMrr)
        : null,
    key_milestones: input.keyMilestones?.trim() || null,
    created_by: claims.email,
  }

  // 1. Try standard upsert first
  const { error: upsertErr } = await supabase
    .from('reporting_targets')
    .upsert(payload, { onConflict: 'company_id,month,year' })

  if (!upsertErr) {
    revalidatePath(`/companies/${input.companyId}`)
    revalidatePath('/updates')
    revalidatePath('/my-company')
    return { success: true }
  }

  console.warn('[upsertTarget.action] upsert failed, trying fallback check:', upsertErr.message)

  // 2. Fallback: explicit check for existing target row
  const { data: existing } = await supabase
    .from('reporting_targets')
    .select('id')
    .eq('company_id', input.companyId)
    .eq('month', Number(input.month))
    .eq('year', Number(input.year))
    .maybeSingle()

  let finalError: string | null = null

  if (existing) {
    const { error: updateErr } = await supabase
      .from('reporting_targets')
      .update({
        target_revenue: payload.target_revenue,
        target_mrr: payload.target_mrr,
        key_milestones: payload.key_milestones,
        created_by: claims.email,
      })
      .eq('id', existing.id)

    if (updateErr) finalError = updateErr.message
  } else {
    const { error: insertErr } = await supabase
      .from('reporting_targets')
      .insert(payload)

    if (insertErr) finalError = insertErr.message
  }

  if (finalError) {
    console.error('[upsertTarget.action] fallback error:', finalError)
    return { success: false, error: finalError }
  }

  revalidatePath(`/companies/${input.companyId}`)
  revalidatePath('/updates')
  revalidatePath('/my-company')

  return { success: true }
}
