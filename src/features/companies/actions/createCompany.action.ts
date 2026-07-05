'use server'

import { revalidatePath } from 'next/cache'
import { createServerClient } from '@/lib/supabase/server'
import { getClaims } from '@/features/auth/services/auth.server'

export interface CreateCompanyInput {
  name: string
  sector: string
  stage: string
  country: string
  website: string
  founded_year: number | null
}

export async function createCompanyAction(
  input: CreateCompanyInput
): Promise<{ success: boolean; error?: string; id?: string }> {
  const claims = await getClaims()
  if (!claims) return { success: false, error: 'Not authenticated.' }
  if (claims.role !== 'internal') return { success: false, error: 'Not authorised.' }

  if (!input.name?.trim()) return { success: false, error: 'Company name is required.' }

  const supabase = await createServerClient()

  const { data, error } = await supabase
    .from('companies')
    .insert({
      name: input.name.trim(),
      sector: input.sector?.trim() || null,
      stage: input.stage?.trim() || null,
      country: input.country?.trim() || null,
      website: input.website?.trim() || null,
    })
    .select('id')
    .single()

  if (error) {
    console.error('[createCompany.action] error:', error.message)
    return { success: false, error: 'Failed to create company.' }
  }

  revalidatePath('/companies')
  revalidatePath('/dashboard')

  return { success: true, id: data.id }
}