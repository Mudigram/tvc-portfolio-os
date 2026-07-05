import { createServerClient } from '@/lib/supabase/server'
import type { CompanyCardData, CompanyProfile, HealthUpdatePayload } from '@/features/companies/types'

/**
 * Returns the data needed to render every company card on the internal dashboard.
 *
 * Stale verification: any critical field with last_verified_date older than 60 days.
 * POEM submission: any monthly_update submitted in the current calendar month.
 * Exit readiness signal: derived from the overall_readiness field on exit_readiness.
 * Funding: is_actively_raising from the most recent funding_status row per company.
 */
export async function getDashboardCompanies(): Promise<CompanyCardData[]> {
  const supabase = await createServerClient()

  const now = new Date()
  const cycleStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
  const staleThreshold = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString()

  const { data, error } = await supabase
    .from('companies')
    .select(`
      id,
      name,
      sector,
      stage,
      portfolio_health,
      health_reviewed_at,
      last_verified_date,
      monthly_updates (
        submitted_at
      ),
      funding_status (
        is_actively_raising,
        created_at
      ),
      exit_readiness (
        overall_readiness
      )
    `)
    .order('name')

  if (error) {
    console.error('[companies.service] getDashboardCompanies error:', error.message)
    return []
  }

  return (data ?? []).map((row) => {
    // POEM — did they submit anything this calendar month?
    const updates = (row.monthly_updates ?? []) as { submitted_at: string }[]
    const submittedThisCycle = updates.some(
      (u) => u.submitted_at >= cycleStart
    )
    const lastUpdate = updates
      .map((u) => u.submitted_at)
      .sort()
      .at(-1) ?? null

    // Funding — most recent row
    const fundingRows = (row.funding_status ?? []) as {
      is_actively_raising: boolean
      created_at: string
    }[]
    const latestFunding = fundingRows.sort((a, b) =>
      b.created_at.localeCompare(a.created_at)
    ).at(0)

    // Stale — company-level verified date older than 60 days
    const hasStale =
      !row.last_verified_date || row.last_verified_date < staleThreshold

    // Exit readiness — map overall_readiness to a directional signal
// Exit readiness — safely handle array, single object, or null responses
const exitRows = row.exit_readiness;
const rawReadiness = Array.isArray(exitRows) 
  ? exitRows[0]?.overall_readiness 
  : (exitRows as { overall_readiness: string | null } | null)?.overall_readiness;

const exitSignal = mapExitSignal(rawReadiness ?? null);
    return {
      id: row.id,
      name: row.name,
      sector: row.sector ?? null,
      stage: row.stage ?? null,
      portfolio_health: row.portfolio_health ?? null,
      health_reviewed_at: row.health_reviewed_at ?? null,
      update_submitted_this_cycle: submittedThisCycle,
      last_update_date: lastUpdate,
      is_actively_raising: latestFunding?.is_actively_raising ?? false,
      has_stale_verification: hasStale,
      exit_readiness_signal: exitSignal,
    }
  })
}

function mapExitSignal(
  raw: string | null
): 'Early' | 'Progressing' | 'Ready' | null {
  if (!raw) return null
  const val = raw.toLowerCase()
  if (val.includes('ready')) return 'Ready'
  if (val.includes('progress')) return 'Progressing'
  return 'Early'
}

export async function getCompanyProfile(id: string): Promise<CompanyProfile | null> {
    const supabase = await createServerClient()
  
    const { data, error } = await supabase
      .from('companies')
      .select(`
        id,
        name,
        sector,
        stage,
        country,
        website,
        legal_entity,
        last_verified_date,
        verified_by,
        portfolio_health,
        health_reviewed_at,
        health_reviewed_by,
        health_notes,
        founders (
          id,
          full_name,
          email
        )
      `)
      .eq('id', id)
      .single()
  
    if (error || !data) {
      console.error('[companies.service] getCompanyProfile error:', error?.message)
      return null
    }
  
    const founderRow = Array.isArray(data.founders)
      ? data.founders[0]
      : data.founders
  
    return {
      id: data.id,
      name: data.name,
      sector: data.sector ?? null,
      stage: data.stage ?? null,
      country: data.country ?? null,
      website: data.website ?? null,
      legal_entity: data.legal_entity ?? null,
      last_verified_date: data.last_verified_date ?? null,
      verified_by: data.verified_by ?? null,
      portfolio_health: data.portfolio_health ?? null,
      health_reviewed_at: data.health_reviewed_at ?? null,
      health_reviewed_by: data.health_reviewed_by ?? null,
      health_notes: data.health_notes ?? null,
      founder: founderRow
        ? { id: founderRow.id, full_name: founderRow.full_name, email: founderRow.email }
        : null,
    }
  }
  
  /**
   * Updates the portfolio health status for a company.
   * Writes portfolio_health, health_notes, health_reviewed_at, health_reviewed_by.
   * Called from a server action — never from the client directly.
   */
  export async function updateCompanyHealth(
    companyId: string,
    userId: string,
    payload: HealthUpdatePayload
  ): Promise<{ success: boolean; error?: string }> {
    const supabase = await createServerClient()
  
    const { error } = await supabase
      .from('companies')
      .update({
        portfolio_health: payload.portfolio_health,
        health_notes: payload.health_notes,
        health_reviewed_at: new Date().toISOString(),
        health_reviewed_by: userId,
      })
      .eq('id', companyId)
  
    if (error) {
      console.error('[companies.service] updateCompanyHealth error:', error.message)
      return { success: false, error: error.message }
    }
  
    return { success: true }
  }