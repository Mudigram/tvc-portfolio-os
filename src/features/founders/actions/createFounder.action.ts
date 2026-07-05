'use server'

import { revalidatePath } from 'next/cache'
import { createServerClient } from '@/lib/supabase/server'
import { getClaims } from '@/features/auth/services/auth.server'

export interface CreateFounderInput {
  full_name: string
  email: string
  startup_name: string | null
  phone: string | null
  industry: string | null
  stage: string | null
  city: string | null
  country: string | null
  linkedin_url: string | null
}

export async function createFounderAction(
  input: CreateFounderInput
): Promise<{ success: boolean; error?: string; id?: string }> {
  const claims = await getClaims()
  if (!claims) return { success: false, error: 'Not authenticated.' }
  if (claims.role !== 'internal') return { success: false, error: 'Not authorised.' }

  if (!input.full_name?.trim()) return { success: false, error: 'Full name is required.' }
  if (!input.email?.trim()) return { success: false, error: 'Email is required.' }

  const supabase = await createServerClient()

  // Check for duplicate email
  const { data: existing } = await supabase
    .from('founders')
    .select('id')
    .eq('email', input.email.trim().toLowerCase())
    .maybeSingle()

  if (existing) {
    return { success: false, error: 'A founder with this email already exists.' }
  }

  const { data, error } = await supabase
    .from('founders')
    .insert({
      full_name: input.full_name.trim(),
      email: input.email.trim().toLowerCase(),
      startup_name: input.startup_name?.trim() || null,
      phone: input.phone?.trim() || null,
      industry: input.industry?.trim() || null,
      stage: input.stage?.trim() || null,
      city: input.city?.trim() || null,
      country: input.country?.trim() || null,
      linkedin_url: input.linkedin_url?.trim() || null,
    })
    .select('id')
    .single()

  if (error) {
    console.error('[createFounder.action] error:', error.message)
    return { success: false, error: 'Failed to create founder.' }
  }

  revalidatePath('/founders')
  return { success: true, id: data.id }
}