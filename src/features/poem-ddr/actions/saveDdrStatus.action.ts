'use server'

import { createServerClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { SaveDdrStatusInput } from '../types'

export async function saveDdrStatusAction(input: SaveDdrStatusInput) {
  try {
    const supabase = await createServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) return { success: false, error: 'Unauthorized user session.' }

    // SECURITY: app_metadata ONLY — user_metadata is user-writable via
    // supabase.auth.updateUser({ data }) and must never be trusted for roles.
    const role = user.app_metadata?.role
    if (role !== 'internal' && role !== 'admin') return { success: false, error: 'Access Denied: Institutional records restricted to internal analysts or admins.' }

    const { error } = await supabase
      .from('ddr_status')
      .upsert({
        company_id: input.companyId,
        current_status: input.currentStatus,
        dgc_contact_name: input.dgcContactName?.trim() || null,
        notes: input.notes?.trim() || null,
        updated_by: user.email,
        last_updated_at: new Date().toISOString()
      }, { onConflict: 'company_id' })

    if (error) throw error

    revalidatePath('/companies/[id]', 'page')
    return { success: true }

  } catch (err: any) {
    console.error('[saveDdrStatusAction Error]:', err.message)
    return { success: false, error: err.message || 'Failed to update ledger records.' }
  }
}