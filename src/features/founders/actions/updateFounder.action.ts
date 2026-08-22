'use server'

import { revalidatePath } from 'next/cache'
import { createServerClient } from '@/lib/supabase/server'
import { getClaims } from '@/features/auth/services/auth.server'
import type { UpdateFounderInput } from '@/features/founders/types'

export async function updateFounderAction(
  founderId: string,
  input: UpdateFounderInput
): Promise<{ success: boolean; error?: string }> {
  const claims = await getClaims()
  if (!claims) return { success: false, error: 'Not authenticated.' }
  if (claims.role !== 'internal' && claims.role !== 'admin') return { success: false, error: 'Not authorised.' }

  if (!input.full_name?.trim()) return { success: false, error: 'Name is required.' }
  if (!input.email?.trim()) return { success: false, error: 'Email is required.' }

  const supabase = await createServerClient()

  const { error } = await supabase
    .from('founders')
    .update({
      full_name: input.full_name.trim(),
      email: input.email.trim().toLowerCase(),
      startup_name: input.startup_name?.trim() || null,
      phone: input.phone?.trim() || null,
      industry: input.industry?.trim() || null,
      stage: input.stage?.trim() || null,
      city: input.city?.trim() || null,
      country: input.country?.trim() || null,
      ddr_status: input.ddr_status?.trim() || null,
      notes: input.notes?.trim() || null,
      linkedin_url: input.linkedin_url?.trim() || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', founderId)

  if (error) {
    console.error('[updateFounder.action] error:', error.message)
    return { success: false, error: 'Failed to update founder.' }
  }

  revalidatePath(`/founders/${founderId}`)
  revalidatePath('/founders')

  return { success: true }
}