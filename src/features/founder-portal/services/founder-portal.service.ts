import { createServerClient } from '@/lib/supabase/server'
import type {
  FounderCompanyData,
  FounderCompanyIdentity,
  FounderPosition,
  FundingStatus,
  DDRStatusSummary,
  UpdateFundingInput,
} from '@/features/founder-portal/types'

/**
 * Resolves the company a founder is linked to via:
 * auth.users.id → founders.user_id → companies.crm_founder_id
 *
 * Returns null if the founder has no linked company —
 * either their founders row has no user_id set, or no company
 * points crm_founder_id at their founders.id.
 */
export async function getFounderCompanyId(authUserId: string): Promise<string | null> {
  const supabase = await createServerClient()

  const { data: founder, error: founderError } = await supabase
    .from('founders')
    .select('id')
    .eq('user_id', authUserId)
    .maybeSingle()

  if (founderError || !founder) {
    console.error('[founder-portal.service] no founders row for user_id:', authUserId)
    return null
  }

  const { data: company, error: companyError } = await supabase
    .from('companies')
    .select('id')
    .eq('crm_founder_id', founder.id)
    .maybeSingle()

  if (companyError || !company) {
    console.error('[founder-portal.service] no company linked to founder:', founder.id)
    return null
  }

  return company.id
}

/**
 * Resolves the founder row ID from auth user ID.
 */
export async function getFounderRowByUserId(authUserId: string): Promise<{ id: string } | null> {
  const supabase = await createServerClient()
  const { data, error } = await supabase
    .from('founders')
    .select('id')
    .eq('user_id', authUserId)
    .maybeSingle()

  if (error || !data) {
    console.error('[founder-portal.service] getFounderRowByUserId error:', error?.message)
    return null
  }
  return data
}

/**
 * Returns everything the founder portal needs in one call.
 * All data is scoped to the founder's own company only.
 */
export async function getFounderCompanyData(
  companyId: string,
  founderId?: string
): Promise<FounderCompanyData | null> {
  
  const supabase = await createServerClient()

  // ── Company identity ────────────────────────────────────────────────────
  const { data: company, error: companyError } = await supabase
    .from('companies')
    .select(`
      id, name, sector, stage, country, website, logo_url, logo_path, founded_year,
      portfolio_health, health_reviewed_at
    `)
    .eq('id', companyId)
    .single()

  if (companyError || !company) {
    console.error('[founder-portal.service] company fetch error:', companyError?.message)
    return null
  }

  const identity: FounderCompanyIdentity = {
    id: company.id,
    name: company.name,
    sector: company.sector ?? null,
    stage: company.stage ?? null,
    country: company.country ?? null,
    website: company.website ?? null,
    logo_url: company.logo_url ?? null,
    logo_path: company.logo_path ?? null,
    founded_year: company.founded_year ?? null,
    portfolio_health: company.portfolio_health ?? null,
    health_reviewed_at: company.health_reviewed_at ?? null,
  }

  // ── Cap table position — founder's own holder row only ──────────────────
  // The founder's holder_id is matched via holders.email = founders' linked email,
  // since economic_exposure.holder_id points to holders, not founders directly.
  const { data: founderRecord } = await supabase
    .from('founders')
    .select('email')
    .eq('id', founderId)
    .single()

  let positions: FounderPosition[] = []

  if (founderRecord?.email) {
    const { data: holderRow } = await supabase
      .from('holders')
      .select('id')
      .eq('email', founderRecord.email)
      .maybeSingle()

    if (holderRow) {
      const { data: exposureRows } = await supabase
        .from('exposure_positions')
        .select(`
          id, exposure_type, instrument_name, issue_date, ownership_pct, status
        `)
        .eq('company_id', companyId)
        .eq('holder_id', holderRow.id)
        .eq('status', 'Active')

      positions = (exposureRows ?? []).map((r) => ({
        exposure_id: r.id,
        exposure_type: r.exposure_type,
        instrument_name: r.instrument_name ?? null,
        issue_date: r.issue_date ?? null,
        ownership_pct: r.ownership_pct ?? null,
        status: r.status,
      }))
    }
  }

  // ── Funding status ────────────────────────────────────────────────────────
  const { data: fundingRow } = await supabase
    .from('funding_status')
    .select('*')
    .eq('company_id', companyId)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  const funding: FundingStatus | null = fundingRow
    ? {
        id: fundingRow.id,
        company_id: fundingRow.company_id,
        runway_months: fundingRow.runway_months ?? null,
        current_raise_target: fundingRow.current_raise_target ?? null,
        instrument: fundingRow.instrument ?? null,
        valuation_cap: fundingRow.valuation_cap ?? null,
        lead_investor_status: fundingRow.lead_investor_status ?? null,
        existing_commitments: fundingRow.existing_commitments ?? null,
        followon_opportunity: fundingRow.followon_opportunity ?? false,
        investor_materials_status: fundingRow.investor_materials_status ?? null,
        is_actively_raising: fundingRow.is_actively_raising ?? false,
        last_verified_date: fundingRow.last_verified_date ?? null,
        verified_by: fundingRow.verified_by ?? null,
        updated_at: fundingRow.updated_at ?? null,
      }
    : null

  // ── DDR — thin status read, future seam ──────────────────────────────────
  const { data: ddrRow } = await supabase
    .from('poem_ddr')
    .select('status, updated_at')
    .eq('company_id', companyId)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  const ddr: DDRStatusSummary | null = ddrRow
    ? { status: ddrRow.status ?? null, updated_at: ddrRow.updated_at ?? null }
    : null

  return { identity, positions, funding, ddr }
}