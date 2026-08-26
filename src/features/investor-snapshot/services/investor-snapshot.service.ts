import { createServerClient } from '@/lib/supabase/server'
import { TVCLABS_HOLDER_IDS } from '@/features/exposure/types'
import type {
  HolderPositionCard,
  HolderSnapshotData,
  ShowcaseCompanyCard,
  PortfolioShowcaseData,
  MonthlyValuePoint,
} from '../types'

// Derives a Supabase Storage public URL for a company logo path.
function deriveLogoUrl(
  supabase: Awaited<ReturnType<typeof createServerClient>>,
  logoPath: string | null | undefined,
): string | null {
  if (!logoPath) return null
  try {
    const { data } = supabase.storage.from('company-logos').getPublicUrl(logoPath)
    return data?.publicUrl ?? null
  } catch {
    return null
  }
}

// Point-in-time status reconstruction.
function reconstructEffectiveStatus(
  currentStatus: string,
  events: { event_type: string; effective_date: string }[],
  cutoff: Date,
): string {
  if (currentStatus !== 'Converted' && currentStatus !== 'Exited') return currentStatus
  const terminalEvent = events
    .filter((e) => e.event_type === 'conversion' || e.event_type === 'exit')
    .sort(
      (a, b) =>
        new Date(a.effective_date).getTime() - new Date(b.effective_date).getTime(),
    )[0]
  if (terminalEvent && new Date(terminalEvent.effective_date) > cutoff) return 'Active'
  return currentStatus
}

// Generates cutoff dates for the current date/month + the 3 preceding month-ends
function getPastMonthCutoffs(asOfDateStr?: string, monthsCount = 4) {
  const baseDate = asOfDateStr ? new Date(asOfDateStr + 'T23:59:59') : new Date()
  const results: { label: string; cutoffDateStr: string; cutoffDate: Date }[] = []

  const currentYear = baseDate.getFullYear()
  const currentMonth = baseDate.getMonth()

  for (let i = 0; i < monthsCount; i++) {
    let d: Date
    if (i === 0) {
      d = baseDate
    } else {
      d = new Date(currentYear, currentMonth - i + 1, 0, 23, 59, 59)
    }

    const monthLabel = d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    const cutoffDateStr = d.toISOString().split('T')[0]
    results.push({ label: monthLabel, cutoffDateStr, cutoffDate: d })
  }

  return results
}

// ─────────────────────────────────────────────────────────────────────────────
// MODE A — Position Statement: positions for a single named holder
// ─────────────────────────────────────────────────────────────────────────────
export async function getHolderSnapshot(
  holderId: string,
  asOfDate?: string,
): Promise<HolderSnapshotData | null> {
  const supabase = await createServerClient()

  const { data, error } = await supabase
    .from('exposure_positions')
    .select(`
      id,
      holder_id,
      exposure_type,
      amount_invested,
      ownership_pct,
      status,
      issue_date,
      companies ( id, name, sector, stage, portfolio_health ),
      holders ( name ),
      exposure_events ( amount, event_type, effective_date )
    `)
    .eq('holder_id', holderId)

  if (error || !data || data.length === 0) {
    if (error) console.error('[getHolderSnapshot] query error:', error.message)
    return null
  }

  const holderRow = data[0]
  const holderRecord = (Array.isArray(holderRow.holders) ? holderRow.holders[0] : holderRow.holders) as unknown as { name?: string } | null
  const holderName = holderRecord?.name ?? 'Investor'
  const holderEmail = null

  const cutoff = asOfDate ? new Date(asOfDate + 'T23:59:59') : new Date()
  const positions: HolderPositionCard[] = []

  for (const row of data) {
    const rawCo = Array.isArray(row.companies) ? row.companies[0] : row.companies
    const company = rawCo as unknown as {
      id: string; name: string; sector: string | null; stage: string | null
      portfolio_health: 'Green' | 'Amber' | 'Red' | null; logo_path?: string | null
    } | null
    if (!company) continue

    const events = (row.exposure_events as { amount: number; event_type: string; effective_date: string }[]) ?? []

    // Sum all events on or before the cutoff date
    const relevantEvents = events.filter((e) => !e.effective_date || new Date(e.effective_date) <= cutoff)
    let amountInvested = relevantEvents.reduce((sum, e) => sum + (Number(e.amount) || 0), 0)

    // Fallback: If exposure_events is empty for legacy rows, use position amount_invested
    if (amountInvested <= 0 && row.amount_invested && Number(row.amount_invested) > 0) {
      amountInvested = Number(row.amount_invested)
    }

    // If still <= 0, allow position if ownership_pct > 0 or row status active
    const effectiveStatus = asOfDate
      ? reconstructEffectiveStatus(row.status ?? '', events, cutoff)
      : row.status ?? ''

    if (asOfDate && effectiveStatus !== 'Active') continue

    positions.push({
      position_id: row.id,
      company_id: company.id,
      company_name: company.name,
      company_sector: company.sector,
      company_stage: company.stage,
      portfolio_health: company.portfolio_health,
      logo_url: deriveLogoUrl(supabase, company.logo_path ?? null),
      exposure_type: row.exposure_type ?? '',
      amount_invested: amountInvested,
      ownership_pct: row.ownership_pct ?? null,
      status: effectiveStatus,
    })
  }

  // Sort alphabetically by company name
  positions.sort((a, b) => a.company_name.localeCompare(b.company_name))

  // Compute 4-month historical trajectory points (current + past 3 months)
  const cutoffs = getPastMonthCutoffs(asOfDate, 4)
  const rawPoints: { month_label: string; cutoff_date: string; total_invested: number; active_companies: number; active_positions: number }[] = []

  for (const c of cutoffs) {
    let monthTotal = 0
    const activeCompSet = new Set<string>()
    let activePosCount = 0

    for (const row of data) {
      const rawCo = Array.isArray(row.companies) ? row.companies[0] : row.companies
      const company = rawCo as unknown as { id: string } | null
      if (!company) continue
      const events = (row.exposure_events as { amount: number; event_type: string; effective_date: string }[]) ?? []
      const rel = events.filter((e) => !e.effective_date || new Date(e.effective_date) <= c.cutoffDate)
      let amt = rel.reduce((sum, e) => sum + (Number(e.amount) || 0), 0)

      if (amt <= 0 && row.amount_invested && Number(row.amount_invested) > 0) {
        amt = Number(row.amount_invested)
      }

      const status = reconstructEffectiveStatus(row.status ?? '', events, c.cutoffDate)
      if (status === 'Active') {
        monthTotal += amt
        activeCompSet.add(company.id)
        activePosCount++
      }
    }

    rawPoints.push({
      month_label: c.label,
      cutoff_date: c.cutoffDateStr,
      total_invested: monthTotal,
      active_companies: activeCompSet.size,
      active_positions: activePosCount,
    })
  }

  // Compute net_change vs previous month and reverse to chronological order (oldest -> newest)
  const monthly_history: MonthlyValuePoint[] = rawPoints.map((pt, idx) => {
    const prevPt = rawPoints[idx + 1]
    const prevTotal = prevPt ? prevPt.total_invested : pt.total_invested
    return {
      ...pt,
      net_change: pt.total_invested - prevTotal,
    }
  }).reverse()

  return {
    holder_name: holderName,
    holder_email: holderEmail,
    as_of_date: asOfDate ?? new Date().toISOString().split('T')[0],
    positions,
    total_invested: positions.reduce((sum, p) => sum + p.amount_invested, 0),
    monthly_history,
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// MODE B — Portfolio Showcase: TVCLabs' full portfolio for external investors
// ─────────────────────────────────────────────────────────────────────────────
export async function getPortfolioShowcase(asOfDate?: string): Promise<PortfolioShowcaseData> {
  const supabase = await createServerClient()

  const { data, error } = await supabase
    .from('exposure_positions')
    .select(`
      id,
      holder_id,
      exposure_type,
      amount_invested,
      ownership_pct,
      status,
      issue_date,
      companies ( id, name, sector, stage, portfolio_health ),
      exposure_events ( amount, event_type, effective_date )
    `)
    .in('holder_id', TVCLABS_HOLDER_IDS)

  const today = new Date().toISOString().split('T')[0]

  if (error || !data) {
    if (error) console.error('[getPortfolioShowcase] query error:', error.message)
    return {
      as_of_date: asOfDate ?? today,
      companies: [],
      total_deployed: 0,
      active_company_count: 0,
      sectors: [],
      monthly_history: [],
    }
  }

  const cutoff = asOfDate ? new Date(asOfDate + 'T23:59:59') : new Date()
  const companyMap = new Map<string, ShowcaseCompanyCard>()

  for (const row of data) {
    const rawCo = Array.isArray(row.companies) ? row.companies[0] : row.companies
    const company = rawCo as unknown as {
      id: string; name: string; sector: string | null; stage: string | null
      portfolio_health: 'Green' | 'Amber' | 'Red' | null; logo_path?: string | null
    } | null
    if (!company) continue

    const events = (row.exposure_events as { amount: number; event_type: string; effective_date: string }[]) ?? []
    const relevantEvents = events.filter((e) => !e.effective_date || new Date(e.effective_date) <= cutoff)
    let amountInvested = relevantEvents.reduce((sum, e) => sum + (Number(e.amount) || 0), 0)

    if (amountInvested <= 0 && row.amount_invested && Number(row.amount_invested) > 0) {
      amountInvested = Number(row.amount_invested)
    }

    // Reconstruct status
    const effectiveStatus = asOfDate
      ? reconstructEffectiveStatus(row.status ?? '', events, cutoff)
      : row.status ?? ''

    if (asOfDate && effectiveStatus !== 'Active') continue

    const existing = companyMap.get(company.id)
    if (existing) {
      existing.tvclabs_invested += amountInvested
      if ((row.ownership_pct ?? 0) > existing.tvclabs_ownership_pct) {
        existing.tvclabs_ownership_pct = row.ownership_pct ?? 0
      }
      if (row.exposure_type && !existing.instrument_types.includes(row.exposure_type)) {
        existing.instrument_types.push(row.exposure_type)
      }
    } else {
      companyMap.set(company.id, {
        company_id: company.id,
        company_name: company.name,
        sector: company.sector,
        stage: company.stage,
        portfolio_health: company.portfolio_health,
        logo_url: deriveLogoUrl(supabase, company.logo_path ?? null),
        tvclabs_invested: amountInvested,
        tvclabs_ownership_pct: row.ownership_pct ?? 0,
        instrument_types: row.exposure_type ? [row.exposure_type] : [],
      })
    }
  }

  // Sort by total deployed descending
  const companies = Array.from(companyMap.values()).sort(
    (a, b) => b.tvclabs_invested - a.tvclabs_invested,
  )

  const sectors = [...new Set(companies.map((c) => c.sector).filter(Boolean) as string[])].sort()

  // Compute 4-month historical trajectory points (current + past 3 months)
  const cutoffs = getPastMonthCutoffs(asOfDate, 4)
  const rawPoints: { month_label: string; cutoff_date: string; total_invested: number; active_companies: number; active_positions: number }[] = []

  for (const c of cutoffs) {
    let monthTotal = 0
    const activeCompSet = new Set<string>()
    let activePosCount = 0

    for (const row of data) {
      const rawCo = Array.isArray(row.companies) ? row.companies[0] : row.companies
      const company = rawCo as unknown as { id: string } | null
      if (!company) continue
      const events = (row.exposure_events as { amount: number; event_type: string; effective_date: string }[]) ?? []
      const rel = events.filter((e) => !e.effective_date || new Date(e.effective_date) <= c.cutoffDate)
      let amt = rel.reduce((sum, e) => sum + (Number(e.amount) || 0), 0)

      if (amt <= 0 && row.amount_invested && Number(row.amount_invested) > 0) {
        amt = Number(row.amount_invested)
      }

      const status = reconstructEffectiveStatus(row.status ?? '', events, c.cutoffDate)
      if (status === 'Active') {
        monthTotal += amt
        activeCompSet.add(company.id)
        activePosCount++
      }
    }

    rawPoints.push({
      month_label: c.label,
      cutoff_date: c.cutoffDateStr,
      total_invested: monthTotal,
      active_companies: activeCompSet.size,
      active_positions: activePosCount,
    })
  }

  // Compute net_change vs previous month and reverse to chronological order (oldest -> newest)
  const monthly_history: MonthlyValuePoint[] = rawPoints.map((pt, idx) => {
    const prevPt = rawPoints[idx + 1]
    const prevTotal = prevPt ? prevPt.total_invested : pt.total_invested
    return {
      ...pt,
      net_change: pt.total_invested - prevTotal,
    }
  }).reverse()

  return {
    as_of_date: asOfDate ?? today,
    companies,
    total_deployed: companies.reduce((sum, c) => sum + c.tvclabs_invested, 0),
    active_company_count: companies.length,
    sectors,
    monthly_history,
  }
}
