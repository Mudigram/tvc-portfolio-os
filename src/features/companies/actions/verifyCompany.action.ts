'use server'

import { revalidatePath } from 'next/cache'
import { createServerClient } from '@/lib/supabase/server'
import { getClaims } from '@/features/auth/services/auth.server'

export async function verifyCompanyAction(
  companyId: string
): Promise<{ success: boolean; error?: string }> {
  const claims = await getClaims()
  if (!claims || (claims.role !== 'internal' && claims.role !== 'admin')) {
    return { success: false, error: 'Not authorised.' }
  }

  const supabase = await createServerClient()
  const today = new Date().toISOString().split('T')[0]

  const { error } = await supabase
    .from('companies')
    .update({
      last_verified_date: today,
      verified_by: claims.email,
    })
    .eq('id', companyId)

  if (error) {
    console.error('[verifyCompany.action] error:', error.message)
    return { success: false, error: error.message }
  }

  revalidatePath(`/companies/${companyId}`)
  revalidatePath('/companies')
  revalidatePath('/dashboard')

  return { success: true }
}
