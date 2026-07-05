'use server'

import { createServerClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { CreateAdvisoryActivityInput } from '../types'

export async function logAdvisoryActivityAction(input: CreateAdvisoryActivityInput) {
  try {
    const supabase = await createServerClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      console.error('[Advisory Action Error]: No valid authenticated user found.')
      return { success: false, error: 'Unauthorized credentials.' }
    }

    // Comprehensive fallback for role mapping validation
    const role = user.user_metadata?.role || user.app_metadata?.role
    
    if (role !== 'internal') {
      console.error(`[Advisory Action Error]: User ${user.email} with role "${role}" is not authorized as "internal".`)
      return { success: false, error: 'Access restricted to internal operations managers.' }
    }

    const { error } = await supabase
      .from('advisory_activity')
      .insert([
        {
          company_id: input.company_id,
          advisor_name: input.advisor_name,
          advisor_type: input.advisor_type,
          topic: input.topic,
          session_date: input.session_date,
          next_action: input.next_action || null,
          next_action_date: input.next_action_date || null,
          verified_by: user.email,
          last_verified_date: new Date().toISOString().split('T')[0]
        }
      ])

    if (error) {
      console.error('[Advisory Action Database Error]:', error.message)
      throw error
    }

    revalidatePath('/companies/[id]', 'page')
    return { success: true }

  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to submit log item.' }
  }
}