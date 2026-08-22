'use server'

import { revalidatePath } from 'next/cache'
import { getClaims } from '@/features/auth/services/auth.server'
import { updateCompanyHealth } from '@/features/companies/services/companies.services'
import type { HealthUpdatePayload } from '@/features/companies/types'

export async function updateHealthAction(
  companyId: string,
  payload: HealthUpdatePayload
): Promise<{ success: boolean; error?: string }> {
  const claims = await getClaims()

  if (!claims) {
    return { success: false, error: 'Not authenticated.' }
  }

  if (claims.role !== 'internal' && claims.role !== 'admin') {
    return { success: false, error: 'Not authorised.' }
  }

  const result = await updateCompanyHealth(companyId, claims.email, payload)

  if (result.success) {
    revalidatePath(`/companies/${companyId}`)
    revalidatePath('/dashboard')
  }

  return result
}