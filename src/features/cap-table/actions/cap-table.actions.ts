'use server'
// ─────────────────────────────────────────────────────────────
// Cap Table — Server Action (save / upsert)
// ─────────────────────────────────────────────────────────────
// Pattern: FormData → validate → upsert → revalidate path
// Called from CapTableClientView via a <form> action.
// ─────────────────────────────────────────────────────────────

import { revalidatePath } from 'next/cache'
import { createServerClient } from '@/lib/supabase/server'
import { getClaims } from '@/features/auth/services/auth.server'
import type { CapTableCurrency, InvestmentRound } from '../types'

export interface SaveCapTableResult {
  success: boolean
  error?: string
}

function parseNullableFloat(value: string | null): number | null {
  if (!value || value.trim() === '') return null
  const n = parseFloat(value)
  return isNaN(n) ? null : n
}

function parseNullableString(value: string | null): string | null {
  if (!value || value.trim() === '') return null
  return value.trim()
}

export async function saveCapTable(
  companyId: string,
  formData: FormData,
): Promise<SaveCapTableResult> {
  // ── Auth guard — internal only ────────────────────────────
  const claims = await getClaims()
  if (!claims || (claims.role !== 'internal' && claims.role !== 'admin')) {
    return { success: false, error: 'Unauthorised' }
  }

  // ── Parse form values ─────────────────────────────────────
  const investment_date = parseNullableString(
    formData.get('investment_date') as string,
  )
  const investment_round = parseNullableString(
    formData.get('investment_round') as string,
  ) as InvestmentRound | null

  const currency = (formData.get('currency') as CapTableCurrency) || 'USD'
  const amount_invested = parseNullableFloat(
    formData.get('amount_invested') as string,
  )

  const cap_table_at_investment_url = parseNullableString(
    formData.get('cap_table_at_investment_url') as string,
  )
  const cap_table_at_investment_note = parseNullableString(
    formData.get('cap_table_at_investment_note') as string,
  )
  const current_cap_table_url = parseNullableString(
    formData.get('current_cap_table_url') as string,
  )
  const current_cap_table_note = parseNullableString(
    formData.get('current_cap_table_note') as string,
  )
  const cap_table_last_updated = parseNullableString(
    formData.get('cap_table_last_updated') as string,
  )

  const founder_ownership_at_investment = parseNullableFloat(
    formData.get('founder_ownership_at_investment') as string,
  )
  const current_founder_ownership = parseNullableFloat(
    formData.get('current_founder_ownership') as string,
  )
  const tvc_ownership_at_investment = parseNullableFloat(
    formData.get('tvc_ownership_at_investment') as string,
  )
  const current_tvc_ownership = parseNullableFloat(
    formData.get('current_tvc_ownership') as string,
  )

  const founder_dilution_alert_threshold = parseNullableFloat(
    formData.get('founder_dilution_alert_threshold') as string,
  )
  const tvc_dilution_alert_threshold = parseNullableFloat(
    formData.get('tvc_dilution_alert_threshold') as string,
  )

  const notes = parseNullableString(formData.get('notes') as string)

  // ── Basic validation ──────────────────────────────────────
  const pctFields = [
    founder_ownership_at_investment,
    current_founder_ownership,
    tvc_ownership_at_investment,
    current_tvc_ownership,
  ]
  for (const pct of pctFields) {
    if (pct !== null && (pct < 0 || pct > 100)) {
      return { success: false, error: 'Percentages must be between 0 and 100' }
    }
  }

  // ── Upsert ────────────────────────────────────────────────
  // Uses ON CONFLICT on company_id (unique constraint in DB).
  // First save creates the row; subsequent saves update it.
  const supabase = await createServerClient()

  const { error } = await supabase.from('cap_table_ownership').upsert(
    {
      company_id: companyId,
      investment_date,
      investment_round,
      amount_invested,
      currency,
      cap_table_at_investment_url,
      cap_table_at_investment_note,
      current_cap_table_url,
      current_cap_table_note,
      cap_table_last_updated,
      founder_ownership_at_investment,
      current_founder_ownership,
      tvc_ownership_at_investment,
      current_tvc_ownership,
      founder_dilution_alert_threshold,
      tvc_dilution_alert_threshold,
      notes,
    },
    { onConflict: 'company_id' },
  )

  if (error) {
    console.error('[cap-table] upsert error:', error.message)
    return { success: false, error: error.message }
  }

  // ── Revalidate the company detail page ───────────────────
  revalidatePath(`/companies/${companyId}`)

  return { success: true }
}