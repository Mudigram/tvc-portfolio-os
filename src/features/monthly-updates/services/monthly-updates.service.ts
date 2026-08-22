// src/features/monthly-updates/services/monthly-updates.service.ts
import { createServerClient } from '@/lib/supabase/server'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { MonthlyUpdate, ReportingTarget, UpdateStatusInfo } from '@/features/monthly-updates/types'

// ─── Get all updates for a company ──────────────────────────────────────────
export async function getCompanyUpdates(
  clientOrCompanyId: SupabaseClient | string,
  companyIdParam?: string
): Promise<MonthlyUpdate[]> {
  const supabase = typeof clientOrCompanyId === 'string'
    ? await createServerClient()
    : clientOrCompanyId

  const companyId = typeof clientOrCompanyId === 'string'
    ? clientOrCompanyId
    : companyIdParam!
  const { data, error } = await supabase
    .from('monthly_updates')
    .select('*')
    .eq('company_id', companyId)
    .order('year', { ascending: false })
    .order('month', { ascending: false })

  if (error) {
    console.error('[monthly-updates.service] getCompanyUpdates error:', error.message)
    return []
  }

  return data ?? []
}

// ─── Get reporting targets for a company ────────────────────────────────────
export async function getCompanyReportingTargets(
  companyId: string,
  month?: number,
  year?: number
): Promise<ReportingTarget[]> {
  const supabase = await createServerClient()
  let query = supabase
    .from('reporting_targets')
    .select('*')
    .eq('company_id', companyId)

  if (month != null) query = query.eq('month', month)
  if (year != null) query = query.eq('year', year)

  const { data, error } = await query.order('year', { ascending: false }).order('month', { ascending: false })

  if (error) {
    console.error('[monthly-updates.service] getCompanyReportingTargets error:', error.message)
    return []
  }

  return data ?? []
}

// ─── Compute the status summary ──────────────────────────────────────────────
export function computeUpdateStatus(updates: MonthlyUpdate[]): UpdateStatusInfo {
  const now = new Date()
  const currentMonth = now.getMonth() + 1
  const currentYear = now.getFullYear()

  const activeSubmissions = updates.filter((u) => u.status === 'Submitted' || u.status === 'Verified')

  const hasCurrentPeriodUpdate = activeSubmissions.some(
    (u) => u.month === currentMonth && u.year === currentYear
  )

  if (activeSubmissions.length === 0) {
    return {
      hasCurrentPeriodUpdate: false,
      hasRecentUpdate: false,
      daysSinceLastUpdate: null,
      lastUpdateDate: null,
      currentPeriod: { month: currentMonth, year: currentYear },
    }
  }

  const latest = activeSubmissions[0]
  const lastDate = latest.submitted_at ? new Date(latest.submitted_at) : new Date()
  const diffDays = Math.ceil(
    Math.abs(now.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24)
  )

  return {
    hasCurrentPeriodUpdate,
    hasRecentUpdate: diffDays <= 30,
    daysSinceLastUpdate: diffDays,
    lastUpdateDate: latest.submitted_at,
    currentPeriod: { month: currentMonth, year: currentYear },
  }
}