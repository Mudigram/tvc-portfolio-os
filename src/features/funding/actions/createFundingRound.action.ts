'use server'

import { createServerClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { getClaims } from '@/features/auth/services/auth.server' // Import your working core helper
import type { FundingRoundInput } from '../types'

export async function createFundingRoundAction(input: FundingRoundInput) {
  try {
    // ── Step 1: Secure Claims Extraction ─────────────────────────────────────
    // Leverage getClaims to cleanly decode verified session tokens (checking app_metadata)
    const claims = await getClaims()
    
    if (!claims) {
      return { success: false, error: 'Authentication failed. Please log in again.' }
    }

    // ── Step 2: Clear Internal Authorization Check ───────────────────────────
    if (claims.role !== 'internal') {
      return { success: false, error: 'Unauthorized access. Internal clearance required.' }
    }

    // ── Step 3: Input Validation pre-check ──────────────────────────────────
    if (!input.company_id) return { success: false, error: 'Target company asset ID is required.' }
    if (!input.round_name) return { success: false, error: 'Funding round name class is required.' }

    const supabase = await createServerClient()

    // ── Step 4: Database Write ───────────────────────────────────────────────
    const { error } = await supabase
      .from('funding_rounds')
      .insert([
        {
          company_id: input.company_id,
          round_name: input.round_name,
          amount_raised: input.amount_raised ?? null,
          pre_money_valuation: input.pre_money_valuation ?? null,
          post_money_valuation: input.post_money_valuation ?? null,
          date_closed: input.date_closed ? new Date(input.date_closed).toISOString() : null,
          lead_investor: input.lead_investor ?? null,
          investors: input.investors ?? [],
          notes: input.notes ?? null
        }
      ])

    if (error) {
      // Catch Row-Level Security policy execution blocks cleanly
      if (error.code === '42501') {
        return { 
          success: false, 
          error: 'Transaction rejected by database. Verify testing role parameters inside RLS permissions.' 
        }
      }
      throw error
    }

    // ── Step 5: Clean Cache Invalidation ─────────────────────────────────────
    revalidatePath(`/companies/${input.company_id}`)
    revalidatePath('/dashboard')

    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to register corporate funding round.' }
  }
}