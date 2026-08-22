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
  try {
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
        logo_url,
        logo_path,
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
      logo_url: (row as any).logo_url ?? null,
      logo_path: (row as any).logo_path ?? null,
      portfolio_health: row.portfolio_health ?? null,
      health_reviewed_at: row.health_reviewed_at ?? null,
      update_submitted_this_cycle: submittedThisCycle,
      last_update_date: lastUpdate,
      is_actively_raising: latestFunding?.is_actively_raising ?? false,
      has_stale_verification: hasStale,
      exit_readiness_signal: exitSignal,
    }
  })
  } catch (err: any) {
    if (err?.digest === 'DYNAMIC_SERVER_USAGE' || err?.message?.includes('Dynamic server usage')) {
      throw err
    }
    console.error('[companies.service] getDashboardCompanies network error:', err?.message || err)
    return []
  }
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
  try {
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
        logo_url,
        logo_path,
        bio,
        investment_date,
        instrument_type,
        amount_invested,
        currency,
        syndicate_holdings,
        last_verified_date,
        verified_by,
        portfolio_health,
        health_reviewed_at,
        health_reviewed_by,
        health_notes,
        crm_founder_id,
        founders:crm_founder_id (
          id,
          full_name,
          email
        )
      `)
      .eq('id', id)
      .maybeSingle()

    if (error) {
      console.error('[companies.service] getCompanyProfile error:', error.message)
    }

    let finalData = data
    let founderObj: { id: string; full_name: string; email: string } | null = null

    if (!finalData) {
      // Fallback simple query without relation embedding
      const { data: simpleData, error: simpleError } = await supabase
        .from('companies')
        .select('*')
        .eq('id', id)
        .maybeSingle()

      if (simpleError || !simpleData) {
        console.error('[companies.service] getCompanyProfile fallback error:', simpleError?.message)
        return null
      }
      finalData = simpleData as any
    }

    if (!finalData) return null

    // Parse founder info
    if (finalData.founders) {
      const f = Array.isArray(finalData.founders) ? finalData.founders[0] : finalData.founders
      if (f) founderObj = { id: f.id, full_name: f.full_name ?? '', email: f.email ?? '' }
    } else if (finalData.crm_founder_id) {
      const { data: fData } = await supabase
        .from('founders')
        .select('id, full_name, email')
        .eq('id', finalData.crm_founder_id)
        .maybeSingle()
      if (fData) {
        founderObj = { id: fData.id, full_name: fData.full_name ?? '', email: fData.email ?? '' }
      }
    }

    let figureDocuments: any[] = []
    const [docsData, summaryData] = await Promise.all([
      supabase
        .from('company_figure_documents')
        .select('*')
        .eq('company_id', id)
        .order('created_at', { ascending: false }),
      supabase
        .from('company_investment_summary')
        .select('amount_invested, currency, instrument_type, investment_date')
        .eq('company_id', id)
        .maybeSingle(),
    ])

    if (docsData.data) {
      figureDocuments = docsData.data
    }

    const summary = summaryData.data

    return {
      id: finalData.id,
      name: finalData.name,
      sector: finalData.sector ?? null,
      stage: finalData.stage ?? null,
      country: finalData.country ?? null,
      website: finalData.website ?? null,
      legal_entity: finalData.legal_entity ?? null,
      logo_url: finalData.logo_url ?? null,
      logo_path: finalData.logo_path ?? null,
      bio: finalData.bio ?? null,
      investment_date: summary?.investment_date ?? finalData.investment_date ?? null,
      instrument_type: summary?.instrument_type ?? finalData.instrument_type ?? null,
      amount_invested: summary?.amount_invested != null ? Number(summary.amount_invested) : (finalData.amount_invested != null ? Number(finalData.amount_invested) : null),
      currency: summary?.currency ?? finalData.currency ?? 'USD',
      syndicate_holdings: finalData.syndicate_holdings ?? null,
      last_verified_date: finalData.last_verified_date ?? null,
      verified_by: finalData.verified_by ?? null,
      portfolio_health: finalData.portfolio_health ?? null,
      health_reviewed_at: finalData.health_reviewed_at ?? null,
      health_reviewed_by: finalData.health_reviewed_by ?? null,
      health_notes: finalData.health_notes ?? null,
      founder: founderObj,
      figure_documents: figureDocuments,
    }
  } catch (err: any) {
    if (err?.digest === 'DYNAMIC_SERVER_USAGE' || err?.message?.includes('Dynamic server usage')) {
      throw err
    }
    console.error('[companies.service] getCompanyProfile network error:', err?.message || err)
    return null
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