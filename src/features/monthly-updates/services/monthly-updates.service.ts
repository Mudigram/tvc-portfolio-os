// src/features/monthly-updates/services/monthly-updates.service.ts
import type { SupabaseClient } from '@supabase/supabase-js' // Import the client type
import type { MonthlyUpdate, UpdateStatusInfo } from '@/features/monthly-updates/types'

// ─── Get all updates for a company ──────────────────────────────────────────
// Pass the initialized supabase client instance directly into the function
export async function getCompanyUpdates(supabase: SupabaseClient, companyId: string): Promise<MonthlyUpdate[]> {
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

// ─── Compute the status summary ──────────────────────────────────────────────
export function computeUpdateStatus(updates: MonthlyUpdate[]): UpdateStatusInfo {
  const now = new Date()
  const currentMonth = now.getMonth() + 1
  const currentYear = now.getFullYear()

  const submitted = updates.filter((u) => u.status === 'Submitted')

  const hasCurrentPeriodUpdate = submitted.some(
    (u) => u.month === currentMonth && u.year === currentYear
  )

  if (submitted.length === 0) {
    return {
      hasCurrentPeriodUpdate: false,
      hasRecentUpdate: false,
      daysSinceLastUpdate: null,
      lastUpdateDate: null,
      currentPeriod: { month: currentMonth, year: currentYear },
    }
  }

  const latest = submitted[0]
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