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

// Helper to safely format local date as YYYY-MM-DD without UTC timezone rollback
function formatLocalDateStr(d: Date): string {
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// Generates cutoff dates for the current date/month + the 3 preceding month-ends
function getPastMonthCutoffs(asOfDateStr?: string, monthsCount = 4) {
  const baseDate = asOfDateStr ? new Date(asOfDateStr + 'T23:59:59') : new Date()
  const results: { label: string; cutoffDateStr: string; cutoffDate: Date }[] = []

  const currentYear = baseDate.getFullYear()
  const currentMonth = baseDate.getMonth()

  for (let i = 0; i < monthsCount; i++) {
    let d: Date
    let cutoffDateStr: string

    if (i === 0) {
      d = baseDate
      cutoffDateStr = asOfDateStr || formatLocalDateStr(baseDate)
    } else {
      d = new Date(currentYear, currentMonth - i + 1, 0, 23, 59, 59)
      cutoffDateStr = formatLocalDateStr(d)
    }

    const monthLabel = d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
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

  // 1. First fetch holder profile from holders table
  const { data: holder, error: holderErr } = await supabase
    .from('holders')
    .select('id, name')
    .eq('id', holderId)
    .maybeSingle()

  if (holderErr || !holder) {
    if (holderErr) console.error('[getHolderSnapshot] holder lookup error:', holderErr.message)
    return null
  }

  const holderName = holder.name ?? 'Investor'
  const holderEmail = null

  // 2. Fetch positions for this holder
  const { data, error } = await supabase
    .from('exposure_positions')
    .select(`
      id,
      holder_id,
      exposure_type,
      ownership_pct,
      status,
      issue_date,
      created_at,
      companies ( id, name, sector, stage, portfolio_health, logo_path ),
      exposure_events ( amount, event_type, effective_date )
    `)
    .eq('holder_id', holderId)

  if (error) {
    console.error('[getHolderSnapshot] query error:', error.message)
    return null
  }

  const cutoff = asOfDate ? new Date(asOfDate + 'T23:59:59') : new Date()
  const positions: HolderPositionCard[] = []

  for (const row of (data ?? [])) {
    const rawCo = Array.isArray(row.companies) ? row.companies[0] : row.companies
    const company = rawCo as unknown as {
      id: string; name: string; sector: string | null; stage: string | null
      portfolio_health: 'Green' | 'Amber' | 'Red' | null; logo_path?: string | null
    } | null
    if (!company) continue

    // Point-in-time check: exclude positions issued or created after asOfDate
    if (asOfDate) {
      const issueOrCreated = row.issue_date || (row.created_at ? row.created_at.split('T')[0] : null)
      if (issueOrCreated && issueOrCreated > asOfDate) {
        continue
      }
    }

    const events = (row.exposure_events as { amount: number; event_type: string; effective_date: string }[]) ?? []

    // Sum all events on or before the cutoff date
    const relevantEvents = events.filter((e) => !e.effective_date || new Date(e.effective_date) <= cutoff)
    const amountInvested = relevantEvents.reduce((sum, e) => sum + (Number(e.amount) || 0), 0)

    const effectiveStatus = asOfDate
      ? reconstructEffectiveStatus(row.status ?? '', events, cutoff)
      : row.status ?? ''

    if (asOfDate && effectiveStatus !== 'Active') continue

    // Position must have positive amount or positive ownership on cutoff date
    const ownershipPct = row.ownership_pct != null ? Number(row.ownership_pct) : null
    if (amountInvested <= 0 && (!ownershipPct || ownershipPct <= 0)) {
      continue
    }

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
      ownership_pct: ownershipPct,
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

    for (const row of (data ?? [])) {
      const rawCo = Array.isArray(row.companies) ? row.companies[0] : row.companies
      const company = rawCo as unknown as { id: string } | null
      if (!company) continue

      // Point-in-time check for this cutoff
      const issueOrCreated = row.issue_date || (row.created_at ? row.created_at.split('T')[0] : null)
      if (issueOrCreated && issueOrCreated > c.cutoffDateStr) {
        continue
      }

      const events = (row.exposure_events as { amount: number; event_type: string; effective_date: string }[]) ?? []
      const rel = events.filter((e) => !e.effective_date || new Date(e.effective_date) <= c.cutoffDate)
      const amt = rel.reduce((sum, e) => sum + (Number(e.amount) || 0), 0)

      const status = reconstructEffectiveStatus(row.status ?? '', events, c.cutoffDate)
      const ownershipPct = row.ownership_pct != null ? Number(row.ownership_pct) : null

      if (status === 'Active' && (amt > 0 || (ownershipPct && ownershipPct > 0))) {
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

  const todayStr = formatLocalDateStr(new Date())

  return {
    holder_name: holderName,
    holder_email: holderEmail,
    as_of_date: asOfDate ?? todayStr,
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
      ownership_pct,
      status,
      issue_date,
      created_at,
      companies ( id, name, sector, stage, portfolio_health, logo_path ),
      exposure_events ( amount, event_type, effective_date )
    `)
    .in('holder_id', TVCLABS_HOLDER_IDS)

  const today = formatLocalDateStr(new Date())

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

    // Point-in-time check: exclude positions issued or created after asOfDate
    if (asOfDate) {
      const issueOrCreated = row.issue_date || (row.created_at ? row.created_at.split('T')[0] : null)
      if (issueOrCreated && issueOrCreated > asOfDate) {
        continue
      }
    }

    const events = (row.exposure_events as { amount: number; event_type: string; effective_date: string }[]) ?? []
    const relevantEvents = events.filter((e) => !e.effective_date || new Date(e.effective_date) <= cutoff)
    const amountInvested = relevantEvents.reduce((sum, e) => sum + (Number(e.amount) || 0), 0)

    // Reconstruct status
    const effectiveStatus = asOfDate
      ? reconstructEffectiveStatus(row.status ?? '', events, cutoff)
      : row.status ?? ''

    if (asOfDate && effectiveStatus !== 'Active') continue

    const ownershipPct = row.ownership_pct != null ? Number(row.ownership_pct) : 0
    if (amountInvested <= 0 && ownershipPct <= 0) {
      continue
    }

    const existing = companyMap.get(company.id)
    if (existing) {
      existing.tvclabs_invested += amountInvested
      if (ownershipPct > existing.tvclabs_ownership_pct) {
        existing.tvclabs_ownership_pct = ownershipPct
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
        tvclabs_ownership_pct: ownershipPct,
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

      // Point-in-time check for this cutoff
      const issueOrCreated = row.issue_date || (row.created_at ? row.created_at.split('T')[0] : null)
      if (issueOrCreated && issueOrCreated > c.cutoffDateStr) {
        continue
      }

      const events = (row.exposure_events as { amount: number; event_type: string; effective_date: string }[]) ?? []
      const rel = events.filter((e) => !e.effective_date || new Date(e.effective_date) <= c.cutoffDate)
      const amt = rel.reduce((sum, e) => sum + (Number(e.amount) || 0), 0)

      const status = reconstructEffectiveStatus(row.status ?? '', events, c.cutoffDate)
      const ownershipPct = row.ownership_pct != null ? Number(row.ownership_pct) : 0

      if (status === 'Active' && (amt > 0 || ownershipPct > 0)) {
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
