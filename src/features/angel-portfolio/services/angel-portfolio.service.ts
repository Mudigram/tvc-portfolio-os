import { createServerClient } from '@/lib/supabase/server'
import type {
  AngelCompanySummary,
  AngelPortfolioSummary,
  AngelActivityEvent,
  AngelCompanyDetail,
  AngelPosition,
  HealthStatus,
  ExitSignal,
} from '@/features/angel-portfolio/types'

// ─── Helpers ────────────────────────────────────────────────────────────────

function mapExitSignal(raw: string | null): ExitSignal | null {
  if (!raw) return null
  const val = raw.toLowerCase()
  if (val.includes('ready')) return 'Ready'
  if (val.includes('progress')) return 'Progressing'
  return 'Early'
}

function isCurrentCycle(submittedAt: string | null): boolean {
  if (!submittedAt) return false
  const now = new Date()
  const cycleStart = new Date(now.getFullYear(), now.getMonth(), 1)
  return new Date(submittedAt) >= cycleStart
}

// ─── Portfolio list ──────────────────────────────────────────────────────────

/**
 * Returns all companies in the angel's portfolio with their personal position.
 * RLS on angel_exposures automatically scopes this to auth.uid().
 */
export async function getAngelPortfolio(userId: string): Promise<{
  companies: AngelCompanySummary[]
  summary: AngelPortfolioSummary
}> {
  const supabase = await createServerClient()

  const { data, error } = await supabase
    .from('angel_exposures')
    .select(`
      id,
      exposure_id,
      economic_exposure (
        id,
        exposure_type,
        instrument_name,
        amount_invested,
        ownership_pct,
        issue_date,
        status,
        companies (
          id,
          name,
          sector,
          stage,
          portfolio_health,
          health_reviewed_at,
          funding_status (
            is_actively_raising,
            created_at
          ),
          monthly_updates (
            submitted_at,
            status
          ),
          exit_readiness (
            overall_readiness
          )
        )
      )
    `)
    .eq('user_id', userId)

  if (error) {
    console.error('[angel-portfolio.service] getAngelPortfolio error:', error.message)
    return {
      companies: [],
      summary: {
        total_invested: 0,
        companies_count: 0,
        instruments_count: 0,
        green_count: 0,
        amber_count: 0,
        red_count: 0,
      },
    }
  }

  const rows = data ?? []

  // Build company summaries — one per unique company
  // An angel could have multiple instruments in the same company
  const companyMap = new Map<string, AngelCompanySummary>()

  for (const row of rows) {
    const exposure = Array.isArray(row.economic_exposure)
      ? row.economic_exposure[0]
      : row.economic_exposure

    if (!exposure) continue

    const company = Array.isArray(exposure.companies)
      ? exposure.companies[0]
      : exposure.companies

    if (!company) continue

    // Latest funding status
    const fundingRows = (company.funding_status ?? []) as {
      is_actively_raising: boolean
      created_at: string
    }[]
    const latestFunding = fundingRows
      .sort((a, b) => b.created_at.localeCompare(a.created_at))
      .at(0)

    // Current cycle submission
    const updates = (company.monthly_updates ?? []) as {
      submitted_at: string
      status: string
    }[]
    const submittedThisCycle = updates.some(
      (u) => u.status === 'Submitted' && isCurrentCycle(u.submitted_at)
    )

    // ─── Exit readiness signal ───────────────────────────────────────────────
    // 🟢 Fix: Cast directly as an object or null since Supabase returns it as an object
    const exitData = company.exit_readiness as {
        overall_readiness: string | null
      } | null
  
      // Read the parameter directly off the object using safe optional chaining
      const exitSignal = mapExitSignal(exitData?.overall_readiness ?? null)

    const position: AngelPosition = {
      exposure_id: exposure.id,
      exposure_type: exposure.exposure_type,
      instrument_name: exposure.instrument_name ?? null,
      amount_invested: exposure.amount_invested ?? null,
      ownership_pct: exposure.ownership_pct ?? null,
      issue_date: exposure.issue_date ?? null,
      status: exposure.status,
    }

    // If angel has multiple instruments in same company, use first one
    // and aggregate amounts
    if (companyMap.has(company.id)) {
      const existing = companyMap.get(company.id)!
      existing.position.amount_invested =
        (existing.position.amount_invested ?? 0) +
        (position.amount_invested ?? 0)
      existing.position.ownership_pct =
        (existing.position.ownership_pct ?? 0) +
        (position.ownership_pct ?? 0)
    } else {
      companyMap.set(company.id, {
        company_id: company.id,
        company_name: company.name,
        sector: company.sector ?? null,
        stage: company.stage ?? null,
        portfolio_health: (company.portfolio_health as HealthStatus) ?? null,
        health_reviewed_at: company.health_reviewed_at ?? null,
        is_actively_raising: latestFunding?.is_actively_raising ?? false,
        update_submitted_this_cycle: submittedThisCycle,
        exit_readiness_signal: exitSignal,
        position,
      })
    }
  }

  const companies = Array.from(companyMap.values())

  // Summary stats
  const summary: AngelPortfolioSummary = {
    total_invested: companies.reduce(
      (sum, c) => sum + (c.position.amount_invested ?? 0), 0
    ),
    companies_count: companies.length,
    instruments_count: rows.length,
    green_count: companies.filter((c) => c.portfolio_health === 'Green').length,
    amber_count: companies.filter((c) => c.portfolio_health === 'Amber').length,
    red_count: companies.filter((c) => c.portfolio_health === 'Red').length,
  }

  // Sort: Red → Amber → Green → unset
  const healthOrder = { Red: 0, Amber: 1, Green: 2 }
  companies.sort((a, b) => {
    const aOrder = a.portfolio_health ? (healthOrder[a.portfolio_health] ?? 3) : 3
    const bOrder = b.portfolio_health ? (healthOrder[b.portfolio_health] ?? 3) : 3
    return aOrder - bOrder
  })

  return { companies, summary }
}

// ─── Activity feed ───────────────────────────────────────────────────────────

/**
 * Returns recent events across all companies in the angel's portfolio.
 * Pulls from health history, monthly updates, and funding status.
 * Limited to last 90 days, max 20 events.
 */
export async function getAngelActivityFeed(
  userId: string
): Promise<AngelActivityEvent[]> {
  const supabase = await createServerClient()

  const ninetyDaysAgo = new Date(
    Date.now() - 90 * 24 * 60 * 60 * 1000
  ).toISOString()

  // First get the company IDs this angel has exposure to
  const { data: exposureData } = await supabase
    .from('angel_exposures')
    .select(`
      economic_exposure (
        companies ( id, name )
      )
    `)
    .eq('user_id', userId)

  const companyIds = new Map<string, string>() // id → name

  for (const row of exposureData ?? []) {
    const exposure = Array.isArray(row.economic_exposure)
      ? row.economic_exposure[0]
      : row.economic_exposure
    const company = Array.isArray(exposure?.companies)
      ? exposure.companies[0]
      : exposure?.companies
    if (company?.id) companyIds.set(company.id, company.name)
  }

  if (companyIds.size === 0) return []

  const ids = Array.from(companyIds.keys())

  // Fetch health history events
  const { data: healthData } = await supabase
    .from('company_health_history')
    .select('id, company_id, health_status, previous_status, reviewed_at')
    .in('company_id', ids)
    .gte('reviewed_at', ninetyDaysAgo)
    .order('reviewed_at', { ascending: false })
    .limit(20)

  // Fetch recent update submissions
  const { data: updateData } = await supabase
    .from('monthly_updates')
    .select('id, company_id, submitted_at, month, year, status')
    .in('company_id', ids)
    .eq('status', 'Submitted')
    .gte('submitted_at', ninetyDaysAgo)
    .order('submitted_at', { ascending: false })
    .limit(20)

  // Fetch funding status changes
  const { data: fundingData } = await supabase
    .from('funding_status')
    .select('id, company_id, is_actively_raising, created_at')
    .in('company_id', ids)
    .gte('created_at', ninetyDaysAgo)
    .order('created_at', { ascending: false })
    .limit(10)

  const events: AngelActivityEvent[] = []

  // Health events
  for (const h of healthData ?? []) {
    const companyName = companyIds.get(h.company_id) ?? '—'
    const changed = h.previous_status && h.previous_status !== h.health_status

    events.push({
      id: h.id,
      company_id: h.company_id,
      company_name: companyName,
      event_type: changed ? 'health_changed' : 'health_reviewed',
      label: changed
        ? `${companyName} health status changed`
        : `${companyName} portfolio review completed`,
      detail: changed
        ? `${h.previous_status} → ${h.health_status}`
        : h.health_status,
      occurred_at: h.reviewed_at,
    })
  }

  // Update submission events
  const MONTHS = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
  ]

  for (const u of updateData ?? []) {
    const companyName = companyIds.get(u.company_id) ?? '—'
    events.push({
      id: u.id,
      company_id: u.company_id,
      company_name: companyName,
      event_type: 'update_submitted',
      label: `${companyName} submitted their update`,
      detail: `${MONTHS[(u.month as number) - 1]} ${u.year}`,
      occurred_at: u.submitted_at,
    })
  }

  // Funding events
  for (const f of fundingData ?? []) {
    const companyName = companyIds.get(f.company_id) ?? '—'
    events.push({
      id: f.id,
      company_id: f.company_id,
      company_name: companyName,
      event_type: f.is_actively_raising ? 'raise_started' : 'raise_ended',
      label: f.is_actively_raising
        ? `${companyName} is actively raising`
        : `${companyName} closed their raise`,
      detail: null,
      occurred_at: f.created_at,
    })
  }

  // Sort all events newest first, cap at 20
  return events
    .sort((a, b) =>
      new Date(b.occurred_at).getTime() - new Date(a.occurred_at).getTime()
    )
    .slice(0, 20)
}

// ─── Company detail ──────────────────────────────────────────────────────────

/**
 * Returns full detail for one company from the angel's perspective.
 * Includes their position, health history, and submission status.
 */
export async function getAngelCompanyDetail(
    userId: string,
    companyId: string
  ): Promise<AngelCompanyDetail | null> {
    const supabase = await createServerClient()
  
    // Get all of this angel's exposure rows, with company joined
    const { data: exposureData, error: exposureError } = await supabase
      .from('angel_exposures')
      .select(`
        economic_exposure (
          id,
          exposure_type,
          instrument_name,
          amount_invested,
          ownership_pct,
          issue_date,
          status,
          company_id
        )
      `)
      .eq('user_id', userId)
  
    if (exposureError || !exposureData?.length) return null
  
    // Filter to only the exposures that belong to this company
    const companyExposures = exposureData
      .map((row) => {
        const exp = Array.isArray(row.economic_exposure)
          ? row.economic_exposure[0]
          : row.economic_exposure
        return exp
      })
      .filter((exp): exp is NonNullable<typeof exp> =>
        exp !== null && exp.company_id === companyId
      )
  
    if (companyExposures.length === 0) return null
  
    // Get company data
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .select(`
        id,
        name,
        sector,
        stage,
        country,
        portfolio_health,
        health_reviewed_at,
        funding_status (
          is_actively_raising,
          created_at
        ),
        monthly_updates (
          submitted_at,
          status
        ),
        exit_readiness (
          overall_readiness
        )
      `)
      .eq('id', companyId)
      .single()
  
    if (companyError || !company) return null
  
    // Health history
    const { data: historyData } = await supabase
      .from('company_health_history')
      .select('health_status, previous_status, reviewed_at')
      .eq('company_id', companyId)
      .order('reviewed_at', { ascending: false })
      .limit(12)
  
    const fundingRows = (company.funding_status ?? []) as {
      is_actively_raising: boolean
      created_at: string
    }[]
    const latestFunding = fundingRows
      .sort((a, b) => b.created_at.localeCompare(a.created_at))
      .at(0)
  
    const updates = (company.monthly_updates ?? []) as {
      submitted_at: string
      status: string
    }[]
    const submittedThisCycle = updates.some(
      (u) => u.status === 'Submitted' && isCurrentCycle(u.submitted_at)
    )
  
    // Build the positions array — every exposure this angel holds in this company
    const positions: AngelPosition[] = companyExposures.map((exp) => ({
      exposure_id: exp.id,
      exposure_type: exp.exposure_type,
      instrument_name: exp.instrument_name ?? null,
      amount_invested: exp.amount_invested ?? null,
      ownership_pct: exp.ownership_pct ?? null,
      issue_date: exp.issue_date ?? null,
      status: exp.status,
    }))
  
    const blended = {
      total_invested: positions.reduce(
        (sum, p) => sum + (p.amount_invested ?? 0), 0
      ),
      total_ownership_pct: positions.reduce(
        (sum, p) => sum + (p.ownership_pct ?? 0), 0
      ),
    }
  
    return {
      company_id: company.id,
      company_name: company.name,
      sector: company.sector ?? null,
      stage: company.stage ?? null,
      country: company.country ?? null,
      portfolio_health: (company.portfolio_health as HealthStatus) ?? null,
      health_reviewed_at: company.health_reviewed_at ?? null,
      is_actively_raising: latestFunding?.is_actively_raising ?? false,
      update_submitted_this_cycle: submittedThisCycle,
    exit_readiness_signal: mapExitSignal(
      ((company.exit_readiness as unknown) as { overall_readiness: string | null })?.overall_readiness ?? null
    ),
      positions,
      blended,
      health_history: (historyData ?? []).map((h) => ({
        health_status: h.health_status as HealthStatus,
        previous_status: (h.previous_status as HealthStatus) ?? null,
        reviewed_at: h.reviewed_at,
      })),
    }
  }