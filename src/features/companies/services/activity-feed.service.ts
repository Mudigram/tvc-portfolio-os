// ─────────────────────────────────────────────────────────────
// Dashboard — Recent activity feed service
// Fetches the last N health review entries across all companies,
// joined with company name and reviewer email for display.
// Internal only — called from the dashboard server component.
// ─────────────────────────────────────────────────────────────

import { createServerClient } from '@/lib/supabase/server'

export interface ActivityFeedItem {
  id: string
  company_id: string
  company_name: string
  health_status: 'Green' | 'Amber' | 'Red'
  previous_status: 'Green' | 'Amber' | 'Red' | null
  notes: string | null
  reviewed_by_email: string | null
  reviewed_at: string
}

export async function getRecentHealthActivity(
  limit = 8,
): Promise<ActivityFeedItem[]> {
  const supabase = await createServerClient()

  const { data, error } = await supabase
  .from('company_health_history')
  .select(`
    id,
    company_id,
    health_status,
    previous_status,
    notes,
    reviewed_at,
    companies ( name ),
    reviewer:user_emails!company_health_history_reviewed_by_fkey ( email )
  `)
  .order('reviewed_at', { ascending: false })
  .limit(limit)

  if (error) {
    console.error('[activity-feed] fetch error:', error.message)
    return []
  }

  return (data ?? []).map((row) => {
    const co = Array.isArray(row.companies) ? row.companies[0] : row.companies
    const user = Array.isArray(row.reviewer) ? row.reviewer[0] : row.reviewer
    return {
      id: row.id,
      company_id: row.company_id,
      company_name: co?.name ?? 'Unknown',
      health_status: row.health_status as ActivityFeedItem['health_status'],
      previous_status: row.previous_status as ActivityFeedItem['previous_status'],
      notes: row.notes ?? null,
      reviewed_by_email: user?.email ?? null,
      reviewed_at: row.reviewed_at,
    }
  })
}