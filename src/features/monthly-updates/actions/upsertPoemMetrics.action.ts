'use server'

import { revalidatePath } from 'next/cache'
import { createServerClient } from '@/lib/supabase/server'
import { createServiceRoleClient } from '@/lib/supabase/service'
import { getClaims } from '@/features/auth/services/auth.server'
import type { MonthlyUpdate, PoemMetrics, UpdateStatus } from '../types'

export interface UpsertPoemMetricsInput extends PoemMetrics {
  company_id: string
  month: number
  year: number
  status?: UpdateStatus
  achievements?: string
  challenges?: string
  targets?: string
  review_notes?: string
}

/**
 * Sanitizes numeric values to prevent Postgres NUMERIC precision/scale overflow (error 22003)
 */
function sanitizeNumeric(val: number | null | undefined, maxAbs: number): number | null {
  if (val === null || val === undefined || isNaN(val)) return null
  if (val > maxAbs) return maxAbs
  if (val < -maxAbs) return -maxAbs
  return Number(val.toFixed(2))
}

function sanitizeRunwayMonths(runway: number | null | undefined, burnRate: number | null | undefined): number | null {
  if (runway === null || runway === undefined || isNaN(runway)) return null

  // If user entered cash in bank (e.g. $15,000, $50,000) instead of runway months:
  // If valid burn rate is supplied, compute actual months = Cash / Burn Rate
  if (runway >= 1000 && burnRate && burnRate > 0) {
    const calculatedMonths = Number((runway / burnRate).toFixed(1))
    return Math.min(Math.max(calculatedMonths, 0), 9999.9)
  }

  // Cap at 9999.9 to guarantee safety under NUMERIC(5, 1) bounds (must round to < 10^4)
  if (runway > 9999.9) return 9999.9
  if (runway < -9999.9) return -9999.9
  return Number(runway.toFixed(1))
}

/**
 * Maps application UpdateStatus to valid Postgres update_status_enum ('Draft' | 'Submitted' | 'Reviewed')
 */
function toDbUpdateStatus(status?: string | null): 'Draft' | 'Submitted' | 'Reviewed' {
  if (status === 'Draft') return 'Draft'
  if (status === 'Submitted') return 'Submitted'
  return 'Reviewed'
}

export async function upsertPoemMetricsAction(
  input: UpsertPoemMetricsInput
): Promise<{ success: boolean; error?: string; migrationNeeded?: boolean }> {
  const claims = await getClaims()
  if (!claims) return { success: false, error: 'Not authenticated.' }

  if (!['internal', 'admin'].includes(claims.role)) {
    return { success: false, error: 'Not authorised. Internal PM or Admin access required.' }
  }

  if (!input.company_id) return { success: false, error: 'Company ID is required.' }
  if (!input.month || input.month < 1 || input.month > 12) {
    return { success: false, error: 'Valid month (1–12) is required.' }
  }
  if (!input.year || input.year < 2000) {
    return { success: false, error: 'Valid year is required.' }
  }

  // Use service role client if available, else server client
  let supabase
  try {
    supabase = createServiceRoleClient()
  } catch {
    supabase = await createServerClient()
  }

  // Check if an update row exists for this period
  const { data: existing, error: fetchErr } = await supabase
    .from('monthly_updates')
    .select('id, status')
    .eq('company_id', input.company_id)
    .eq('month', input.month)
    .eq('year', input.year)
    .maybeSingle()

  if (fetchErr) {
    console.error('[upsertPoemMetrics] fetch error:', fetchErr.message)
    return { success: false, error: fetchErr.message }
  }

  // Base payload always present
  const basePayload: Record<string, any> = {
    company_id: input.company_id,
    month: input.month,
    year: input.year,
    achievements: input.achievements?.trim() || 'POEM metrics recorded by Portfolio Manager.',
    challenges: input.challenges?.trim() || null,
    targets: input.targets?.trim() || null,
    submitted_by: claims.email,
    status: toDbUpdateStatus(input.status),
    submitted_at: new Date().toISOString(),
    reviewed_at: new Date().toISOString(),
    reviewed_by: claims.email,
    review_notes: input.review_notes?.trim() || null,
  }

  // Full POEM payload with strict numerical bounds protection against Postgres error 22003
  const fullPayload: Record<string, any> = {
    ...basePayload,
    active_customers: input.active_customers ? Math.round(input.active_customers) : null,
    monthly_user_growth_pct: sanitizeNumeric(input.monthly_user_growth_pct, 9999.99),
    paying_customers: input.paying_customers ? Math.round(input.paying_customers) : null,
    churn_rate_pct: sanitizeNumeric(input.churn_rate_pct, 9999.99),
    retention_rate_pct: sanitizeNumeric(input.retention_rate_pct, 9999.99),
    revenue_growth_pct: sanitizeNumeric(input.revenue_growth_pct, 9999.99),
    team_size: input.team_size ? Math.round(input.team_size) : null,
    founder_commitment: input.founder_commitment ?? null,
    reporting_consistency: input.reporting_consistency ?? null,
    reporting_compliance: input.reporting_compliance ?? null,
    monthly_revenue: input.monthly_revenue ?? null,
    burn_rate: input.burn_rate ?? null,
    runway_months: sanitizeRunwayMonths(input.runway_months, input.burn_rate),
    ltv_cac_ratio: sanitizeNumeric(input.ltv_cac_ratio, 9999.99),
    operating_margin_pct: sanitizeNumeric(input.operating_margin_pct, 9999.99),
    arr: input.arr ?? null,
    gross_margin_pct: sanitizeNumeric(input.gross_margin_pct, 9999.99),
    targets_completion_rate_pct: sanitizeNumeric(input.targets_completion_rate_pct, 9999.99),
  }

  let saveErr: any = null

  if (existing?.id) {
    const { error } = await supabase
      .from('monthly_updates')
      .update(fullPayload)
      .eq('id', existing.id)
    saveErr = error
  } else {
    const { error } = await supabase
      .from('monthly_updates')
      .insert(fullPayload)
    saveErr = error
  }

  // If column doesn't exist in Supabase yet (PGRST204), fallback to base update with notification
  if (saveErr) {
    if (saveErr.code === 'PGRST204' || saveErr.message?.includes('column')) {
      console.warn('[upsertPoemMetrics] Schema cache missing POEM columns, writing base update:', saveErr.message)
      
      const fallbackPayload = {
        ...basePayload,
        // Embed serialized POEM json in review_notes as resilience fallback
        review_notes: JSON.stringify({
          _poem_fallback: true,
          active_customers: fullPayload.active_customers,
          monthly_user_growth_pct: fullPayload.monthly_user_growth_pct,
          paying_customers: fullPayload.paying_customers,
          churn_rate_pct: fullPayload.churn_rate_pct,
          retention_rate_pct: fullPayload.retention_rate_pct,
          revenue_growth_pct: fullPayload.revenue_growth_pct,
          team_size: fullPayload.team_size,
          founder_commitment: fullPayload.founder_commitment,
          reporting_consistency: fullPayload.reporting_consistency,
          reporting_compliance: fullPayload.reporting_compliance,
          monthly_revenue: fullPayload.monthly_revenue,
          burn_rate: fullPayload.burn_rate,
          runway_months: fullPayload.runway_months,
          ltv_cac_ratio: fullPayload.ltv_cac_ratio,
          operating_margin_pct: fullPayload.operating_margin_pct,
          arr: fullPayload.arr,
          gross_margin_pct: fullPayload.gross_margin_pct,
          targets_completion_rate_pct: fullPayload.targets_completion_rate_pct,
          original_notes: input.review_notes || null,
        }),
      }

      if (existing?.id) {
        await supabase.from('monthly_updates').update(fallbackPayload).eq('id', existing.id)
      } else {
        await supabase.from('monthly_updates').insert(fallbackPayload)
      }

      revalidatePath(`/companies/${input.company_id}`)
      revalidatePath(`/portfolio/${input.company_id}`)
      revalidatePath('/updates')

      return {
        success: true,
        migrationNeeded: true,
      }
    }

    if (saveErr.code === '22003') {
      console.error('[upsertPoemMetrics] numeric field overflow:', saveErr)
      return {
        success: false,
        error: 'Numerical limit exceeded. Please ensure Runway is in months (e.g. 18, not cash in bank) and percentages are within range.'
      }
    }

    console.error('[upsertPoemMetrics] save error:', saveErr)
    return { success: false, error: saveErr.message }
  }

  revalidatePath(`/companies/${input.company_id}`)
  revalidatePath(`/portfolio/${input.company_id}`)
  revalidatePath('/updates')

  return { success: true }
}

/**
 * Fetches the most recent recorded monthly update for a company,
 * allowing UI pre-filling of prior KPIs.
 */
export async function getLatestCompanyUpdateAction(
  companyId: string
): Promise<{ success: boolean; update?: MonthlyUpdate | null; error?: string }> {
  try {
    const claims = await getClaims()
    if (!claims) return { success: false, error: 'Not authenticated.' }

    let supabase
    try {
      supabase = createServiceRoleClient()
    } catch {
      supabase = await createServerClient()
    }

    const { data, error } = await supabase
      .from('monthly_updates')
      .select('*')
      .eq('company_id', companyId)
      .order('year', { ascending: false })
      .order('month', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (error) {
      console.error('[getLatestCompanyUpdateAction] error:', error.message)
      return { success: false, error: error.message }
    }

    return { success: true, update: (data as MonthlyUpdate) || null }
  } catch (err: any) {
    console.error('[getLatestCompanyUpdateAction] unexpected error:', err)
    return { success: false, error: err.message || 'Failed to fetch latest update' }
  }
}
