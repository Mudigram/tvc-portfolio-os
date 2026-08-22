'use server'

import { revalidatePath } from 'next/cache'
import { createServerClient } from '@/lib/supabase/server'
import { getClaims } from '@/features/auth/services/auth.server'

export interface UpdateCompanyInput {
  name: string
  sector: string | null
  stage: string | null
  country: string | null
  website: string | null
  legal_entity: string | null
  logo_url?: string | null
  bio?: string | null
  investment_date?: string | null
  instrument_type?: string | null
  amount_invested?: number | null
  currency?: string | null
  syndicate_holdings?: string | null
}

export async function updateCompanyAction(
  companyId: string,
  input: UpdateCompanyInput
): Promise<{ success: boolean; error?: string }> {
  const claims = await getClaims()
  if (!claims) return { success: false, error: 'Not authenticated.' }
  if (claims.role !== 'internal' && claims.role !== 'admin') return { success: false, error: 'Not authorised.' }
  if (!input.name?.trim()) return { success: false, error: 'Company name is required.' }

  const supabase = await createServerClient()

  const { error } = await supabase
    .from('companies')
    .update({
      name: input.name.trim(),
      sector: input.sector?.trim() || null,
      stage: input.stage?.trim() || null,
      country: input.country?.trim() || null,
      website: input.website?.trim() || null,
      legal_entity: input.legal_entity || null,
      logo_url: input.logo_url?.trim() || null,
      bio: input.bio?.trim() || null,
      syndicate_holdings: input.syndicate_holdings?.trim() || null,
    })
    .eq('id', companyId)

  if (error) {
    console.error('[updateCompany.action] error:', error.message)
    return { success: false, error: 'Failed to update company.' }
  }

  revalidatePath(`/companies/${companyId}`)
  revalidatePath('/companies')
  revalidatePath('/dashboard')

  return { success: true }
}