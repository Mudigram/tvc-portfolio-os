import { createServerClient } from '@/lib/supabase/server'
import type {
  PortfolioExposureData,
  CompanyExposureSummary,
  InstrumentTypeSummary,
  ExposureType,
} from '@/features/exposure/types'
import { TVCLABS_HOLDER_IDS } from '@/features/exposure/types'

/**
 * Fetches everything the /exposure page needs in one call.
 * Joins economic_exposure → holders, companies, funding_status.
 * Active instruments only — Converted, Exited, Cancelled are excluded
 * so they don't inflate deployed capital figures.
 */
export async function getPortfolioExposure(asOfDate?: string): Promise<PortfolioExposureData> {
  const supabase = await createServerClient()

  let query = supabase
    .from('exposure_positions')
    .select(`
      id,
      holder_id,
      holder_type,
      exposure_type,
      ownership_pct,
      status,
      issue_date,
      created_at,
      companies (
        id,
        name,
        sector,
        stage,
        portfolio_health,
        funding_status (
          is_actively_raising,
          created_at
        )
      ),
      holders (
        name
      ),
      exposure_events (
        amount,
        event_type,
        effective_date
      )
    `)
    .order('companies(name)')

  // When querying current state (no asOfDate), filter by Active status
  if (!asOfDate) {
    query = query.eq('status', 'Active')
  }

  const { data, error } = await query

  if (error) {
    console.error('[portfolio-exposure.service] error:', error.message)
    return {
      summary: {
        total_deployed: 0,
        active_instruments: 0,
        companies_tracked: 0,
        holders_on_record: 0,
      },
      byCompany: [],
      byInstrument: [],
      chartData: [],
    }
  }

  // Map and reconstruct historical status per position
  const rows = (data ?? [])
    .map((r) => {
      const allEvents = (r.exposure_events ?? []) as { amount: number; event_type?: string; effective_date: string }[]
      
      // Events on or prior to asOfDate
      const validEvents = allEvents.filter(
        (e) => !asOfDate || (e.effective_date && e.effective_date <= asOfDate)
      )
      
      const amountInvested = validEvents.reduce((sum, e) => sum + (Number(e.amount) || 0), 0)

      // Evaluate historical status on asOfDate
      let effectiveStatus = r.status
      if (asOfDate) {
        // Exclude positions created after asOfDate
        const issueOrCreated = r.issue_date || r.created_at?.split('T')[0]
        if (issueOrCreated && issueOrCreated > asOfDate) {
          effectiveStatus = 'Inactive'
        } else if (['Converted', 'Exited', 'Cancelled'].includes(r.status)) {
          // Check if the conversion/exit event occurred on or before asOfDate
          const terminalEvent = allEvents.find(
            (e) => ['Conversion', 'Exit', 'Cancellation'].includes(e.event_type || '') &&
                   e.effective_date && e.effective_date <= asOfDate
          )
          // If no terminal event occurred before asOfDate, position was Active as of date
          if (!terminalEvent) {
            effectiveStatus = 'Active'
          }
        }
      }

      return {
        ...r,
        status: effectiveStatus,
        amount_invested: amountInvested,
      }
    })
    .filter((r) => r.status === 'Active' && (r.amount_invested > 0 || !asOfDate))

  // ── Portfolio summary ──────────────────────────────────────────────────────

  const totalDeployed = rows
    .filter((r) => TVCLABS_HOLDER_IDS.includes(r.holder_id))
    .reduce((sum, r) => sum + (Number(r.amount_invested) || 0), 0)

  const summary = {
    total_deployed: totalDeployed,
    active_instruments: rows.length,
    companies_tracked: new Set(rows.map((r) => {
      const co = Array.isArray(r.companies) ? r.companies[0] : r.companies
      return co?.id
    }).filter(Boolean)).size,
    holders_on_record: new Set(rows.map((r) => r.holder_id)).size,
  }

  // ── By company ────────────────────────────────────────────────────────────

  // Group rows by company_id
  const companyMap = new Map<string, typeof rows>()

  for (const row of rows) {
    const co = Array.isArray(row.companies) ? row.companies[0] : row.companies
    if (!co?.id) continue
    if (!companyMap.has(co.id)) companyMap.set(co.id, [])
    companyMap.get(co.id)!.push(row)
  }

  const byCompany: CompanyExposureSummary[] = Array.from(companyMap.entries())
    .map(([companyId, companyRows]) => {
      const co = Array.isArray(companyRows[0].companies)
        ? companyRows[0].companies[0]
        : companyRows[0].companies

      // Latest funding status row
      const fundingRows = (co?.funding_status ?? []) as {
        is_actively_raising: boolean
        created_at: string
      }[]
      const latestFunding = fundingRows
        .sort((a, b) => b.created_at.localeCompare(a.created_at))
        .at(0)

      // TVCLabs entity rows only
      const tvcRows = companyRows.filter((r) =>
        TVCLABS_HOLDER_IDS.includes(r.holder_id)
      )

      const tvcInvested = tvcRows.reduce(
        (sum, r) => sum + (Number(r.amount_invested) || 0), 0
      )
      const tvcOwnership = tvcRows.reduce(
        (sum, r) => sum + (Number(r.ownership_pct) || 0), 0
      )
      const instrumentTypes = [
        ...new Set(tvcRows.map((r) => r.exposure_type as ExposureType)),
      ]

      return {
        company_id: companyId,
        company_name: co?.name ?? '—',
        portfolio_health: co?.portfolio_health ?? null,
        stage: co?.stage ?? null,
        sector: co?.sector ?? null,
        is_actively_raising: latestFunding?.is_actively_raising ?? false,
        tvclabs_invested: tvcInvested,
        tvclabs_ownership_pct: tvcOwnership,
        instrument_types: instrumentTypes,
        total_rows: companyRows.length,
      }
    })
    .sort((a, b) => b.tvclabs_invested - a.tvclabs_invested)

  // ── By instrument type ─────────────────────────────────────────────────────

  const instrumentMap = new Map<string, {
    total_invested: number
    company_ids: Set<string>
    row_count: number
  }>()

  for (const row of rows) {
    const type = row.exposure_type
    if (!instrumentMap.has(type)) {
      instrumentMap.set(type, {
        total_invested: 0,
        company_ids: new Set(),
        row_count: 0,
      })
    }
    const entry = instrumentMap.get(type)!
    entry.total_invested += Number(row.amount_invested) || 0
    entry.row_count += 1
    const co = Array.isArray(row.companies) ? row.companies[0] : row.companies
    if (co?.id) entry.company_ids.add(co.id)
  }

  const byInstrument: InstrumentTypeSummary[] = Array.from(
    instrumentMap.entries()
  )
    .map(([type, data]) => ({
      exposure_type: type as ExposureType,
      total_invested: data.total_invested,
      company_count: data.company_ids.size,
      row_count: data.row_count,
    }))
    .sort((a, b) => b.total_invested - a.total_invested)

  // ── Chart data — one row per company, columns per instrument type ──────────

  const INSTRUMENT_TYPES: ExposureType[] = [
    'Equity', 'SAFE', 'Convertible Note', 'Option', 'Warrant', 'Advisory Equity',
  ]

  const chartData = Array.from(companyMap.entries()).map(([_, companyRows]) => {
    const co = Array.isArray(companyRows[0].companies)
      ? companyRows[0].companies[0]
      : companyRows[0].companies

    const entry: Record<string, string | number> = {
      company_name: co?.name ?? '—',
    }

    for (const type of INSTRUMENT_TYPES) {
      entry[type] = companyRows
        .filter((r) =>
          r.exposure_type === type &&
          TVCLABS_HOLDER_IDS.includes(r.holder_id)
        )
        .reduce((sum, r) => sum + (Number(r.amount_invested) || 0), 0)
    }

    return entry as {
      company_name: string
      Equity: number
      SAFE: number
      'Convertible Note': number
      Option: number
      Warrant: number
      'Advisory Equity': number
    }
  })

  return { summary, byCompany, byInstrument, chartData }
}