// ─────────────────────────────────────────────────────────────
// Governance Gap Visibility — Admin-Only Service
//
// Strictly restricted to users with `admin` role.
// Non-admin users (including `internal`) receive an empty array [].
// ─────────────────────────────────────────────────────────────

import { createServerClient } from '@/lib/supabase/server'
import { getClaims } from '@/features/auth/services/auth.server'

export type GovernanceGapType = 'unverified_position' | 'missing_evidence'

export interface GovernanceGap {
  gap_type: GovernanceGapType
  record_id: string
  company_id: string
  holder_id: string
  detail_date: string | null
  detail_text: string | null
}

export async function getGovernanceGaps(
  companyId?: string
): Promise<GovernanceGap[]> {
  const claims = await getClaims()
  if (!claims) {
    console.error('[governance-gaps] Not authenticated.')
    return []
  }

  // Strict Auth Check: Admin only (NOT internal, angel, or founder)
  if (claims.role !== 'admin') {
    console.warn(
      `[governance-gaps] Access restricted to admin tier. Current role '${claims.role}' rejected.`
    )
    return []
  }

  const supabase = await createServerClient()

  let query = supabase.from('governance_gaps').select('*')

  if (companyId) {
    query = query.eq('company_id', companyId)
  }

  const { data, error } = await query

  if (error) {
    console.error('[governance-gaps] Error fetching governance gaps:', error.message)
    return []
  }

  return (data ?? []) as GovernanceGap[]
}
