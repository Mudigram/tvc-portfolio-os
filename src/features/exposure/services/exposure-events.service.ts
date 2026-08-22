// ─────────────────────────────────────────────────────────────
// Exposure Event Log — Server service layer
//
// Append-only ledger operations for economic exposure tracking.
// These functions are called from server actions or server
// components — never imported client-side.
//
// Non-negotiable rules:
//   • Never UPDATE or DELETE rows in exposure_events
//   • Corrections always go through reverseExposureEvent
//   • created_by is always set from getClaims(), never from caller
// ─────────────────────────────────────────────────────────────

import { createServerClient } from '@/lib/supabase/server'
import { getClaims } from '@/features/auth/services/auth.server'
import type {
  ExposureEvent,
  ExposureEventType,
  ExposureEventResult,
  CurrentExposure,
  PositionAsOf,
  MasterLedgerStatus,
} from '@/features/exposure/types'

// ─── Function 1: recordExposureEvent ────────────────────────────────────────
//
// The only sanctioned way application code adds to a holder's position history.
// Inserts a single row into exposure_events.
//
// Does NOT touch exposure_positions.ownership_pct or last_verified_date —
// those stay manually managed per the design decision.

export async function recordExposureEvent(input: {
  position_id: string
  event_type: ExposureEventType
  effective_date: string        // ISO date string
  amount: number                // signed — caller decides sign
  currency: string
  source_document_url?: string | null
  notes?: string | null
}): Promise<ExposureEventResult> {
  // Auth: internal only (add 'admin' here when admin tier is built)
  const claims = await getClaims()
  if (!claims) return { success: false, error: 'Not authenticated.' }
  if (claims.role !== 'internal' && claims.role !== 'admin') {
    return { success: false, error: 'Not authorised. Only internal managers or admins may record exposure events.' }
  }

  // Validate position exists before inserting — fail clearly rather than
  // letting a bad FK produce a confusing Postgres error
  const supabase = await createServerClient()

  const { data: position, error: posError } = await supabase
    .from('exposure_positions')
    .select('id')
    .eq('id', input.position_id)
    .maybeSingle()

  if (posError) {
    console.error('[exposure-events] position lookup error:', posError.message)
    return { success: false, error: 'Failed to validate position.' }
  }
  if (!position) {
    return { success: false, error: `Position ${input.position_id} does not exist.` }
  }

  // Insert event — created_by is set from claims, never from caller
  const { data, error } = await supabase
    .from('exposure_events')
    .insert({
      position_id: input.position_id,
      event_type: input.event_type,
      effective_date: input.effective_date,
      amount: input.amount,
      currency: input.currency,
      source_document_url: input.source_document_url ?? null,
      notes: input.notes ?? null,
      created_by: claims.userId,
    })
    .select('*')
    .single()

  if (error) {
    console.error('[exposure-events] recordExposureEvent error:', error.message)
    return { success: false, error: error.message }
  }

  return { success: true, event: data as ExposureEvent }
}

// ─── Function 2: reverseExposureEvent ───────────────────────────────────────
//
// The sanctioned way to correct a mistaken event without ever mutating history.
//
// Inserts a new 'correction' event that negates the original amount.
// effective_date is always today — don't backdate the reversal.
// reverses_event_id links to the original; a unique index enforces
// that each event can only be reversed once.

export async function reverseExposureEvent(input: {
  event_id: string
  notes?: string | null
}): Promise<ExposureEventResult> {
  // Auth: internal only (add 'admin' here when admin tier is built)
  const claims = await getClaims()
  if (!claims) return { success: false, error: 'Not authenticated.' }
  if (claims.role !== 'internal' && claims.role !== 'admin') {
    return { success: false, error: 'Not authorised. Only internal managers or admins may reverse exposure events.' }
  }

  const supabase = await createServerClient()

  // Look up the original event
  const { data: original, error: lookupError } = await supabase
    .from('exposure_events')
    .select('*')
    .eq('id', input.event_id)
    .maybeSingle()

  if (lookupError) {
    console.error('[exposure-events] reversal lookup error:', lookupError.message)
    return { success: false, error: 'Failed to look up original event.' }
  }
  if (!original) {
    return { success: false, error: `Event ${input.event_id} does not exist.` }
  }

  // Insert the correction — effective_date is today, amount is negated
  const today = new Date().toISOString().split('T')[0] // YYYY-MM-DD

  const { data, error } = await supabase
    .from('exposure_events')
    .insert({
      position_id: original.position_id,
      event_type: 'correction',
      effective_date: today,
      amount: -original.amount,
      currency: original.currency,
      reverses_event_id: original.id,
      notes: input.notes ?? `Reversal of event ${original.id}`,
      created_by: claims.userId,
    })
    .select('*')
    .single()

  if (error) {
    // Catch the unique constraint violation on reverses_event_id —
    // this means the event was already reversed
    if (error.code === '23505') {
      return { success: false, error: 'This event has already been reversed.' }
    }
    console.error('[exposure-events] reverseExposureEvent error:', error.message)
    return { success: false, error: error.message }
  }

  return { success: true, event: data as ExposureEvent }
}

// ─── Function 3: getCurrentExposure ─────────────────────────────────────────
//
// Reads current-state exposure from the economic_exposure view.
// Role-scoped:
//   • internal: no additional restriction beyond passed filters
//   • angel:    force-scoped to the caller's visible exposures via
//               angel_exposures join table — never trust a client-supplied
//               filter for this role
//   • founder:  rejected — this table is not queryable for founders

export async function getCurrentExposure(filters?: {
  company_id?: string
  holder_id?: string
}): Promise<CurrentExposure[]> {
  const claims = await getClaims()
  if (!claims) {
    console.error('[exposure-events] getCurrentExposure: not authenticated')
    return []
  }

  // Founders cannot query exposure data
  if (claims.role === 'founder') {
    console.error('[exposure-events] getCurrentExposure: founders cannot access exposure data')
    return []
  }

  const supabase = await createServerClient()

  // Angel scoping: resolve which exposure IDs this angel can see,
  // then filter the view to only those rows.
  // This matches the existing angel-portfolio.service.ts pattern.
  if (claims.role === 'angel') {
    const { data: angelRows, error: angelError } = await supabase
      .from('angel_exposures')
      .select('exposure_id')
      .eq('user_id', claims.userId)

    if (angelError) {
      console.error('[exposure-events] angel scoping error:', angelError.message)
      return []
    }

    const visibleIds = (angelRows ?? []).map((r) => r.exposure_id)
    if (visibleIds.length === 0) return []

    let query = supabase
      .from('exposure_positions')
      .select('*, exposure_events(amount)')
      .in('id', visibleIds)

    if (filters?.company_id) query = query.eq('company_id', filters.company_id)

    const { data, error } = await query
    if (error) {
      console.error('[exposure-events] getCurrentExposure (angel) error:', error.message)
      return []
    }
    return (data ?? []).map((row: any) => {
      const events = (row.exposure_events ?? []) as { amount: number }[]
      const amountInvested = events.reduce((sum, e) => sum + (Number(e.amount) || 0), 0)
      return {
        ...row,
        amount_invested: amountInvested,
      }
    }) as CurrentExposure[]
  }

  // Internal: apply filters directly, no additional restriction
  let query = supabase
    .from('exposure_positions')
    .select('*, exposure_events(amount)')

  if (filters?.company_id) query = query.eq('company_id', filters.company_id)
  if (filters?.holder_id) query = query.eq('holder_id', filters.holder_id)

  const { data, error } = await query
  if (error) {
    console.error('[exposure-events] getCurrentExposure error:', error.message)
    return []
  }

  return (data ?? []).map((row: any) => {
    const events = (row.exposure_events ?? []) as { amount: number }[]
    const amountInvested = events.reduce((sum, e) => sum + (Number(e.amount) || 0), 0)
    return {
      ...row,
      amount_invested: amountInvested,
    }
  }) as CurrentExposure[]
}

// ─── Function 4: getPositionAsOf ────────────────────────────────────────────
//
// Point-in-time query: "what was the position on date X."
//
// Calls the exposure_as_of(date) Postgres function — the DB function
// is the source of truth for this aggregation, not TypeScript.
// Same role-based scoping as getCurrentExposure.

export async function getPositionAsOf(input: {
  as_of_date: string           // ISO date string (YYYY-MM-DD)
  company_id?: string
  holder_id?: string
}): Promise<PositionAsOf[]> {
  const claims = await getClaims()
  if (!claims) {
    console.error('[exposure-events] getPositionAsOf: not authenticated')
    return []
  }

  // Founders cannot query exposure data
  if (claims.role === 'founder') {
    console.error('[exposure-events] getPositionAsOf: founders cannot access exposure data')
    return []
  }

  const supabase = await createServerClient()

  // Call the DB function
  const { data, error } = await supabase
    .rpc('exposure_as_of', { as_of: input.as_of_date })

  if (error) {
    console.error('[exposure-events] getPositionAsOf error:', error.message)
    return []
  }

  let rows = (data ?? []) as PositionAsOf[]

  // Angel scoping: resolve visible exposure IDs, filter result set
  if (claims.role === 'angel') {
    const { data: angelRows, error: angelError } = await supabase
      .from('angel_exposures')
      .select('exposure_id')
      .eq('user_id', claims.userId)

    if (angelError) {
      console.error('[exposure-events] angel scoping error:', angelError.message)
      return []
    }

    const visibleIds = new Set((angelRows ?? []).map((r) => r.exposure_id))
    rows = rows.filter((r) => visibleIds.has(r.position_id))
    // Ignore caller-supplied holder_id for angels
  }

  // Apply optional filters
  if (input.company_id) {
    rows = rows.filter((r) => r.company_id === input.company_id)
  }
  if (input.holder_id && claims.role !== 'angel') {
    rows = rows.filter((r) => r.holder_id === input.holder_id)
  }

  return rows
}

// ─── Function 5: reconcilePosition ──────────────────────────────────────────
//
// Reconciles an exposure position:
//   1. Auth check: internal or admin only.
//   2. Evidence hard-gate: position MUST have at least one exposure_event
//      with a non-null source_document_url. Otherwise reject with explicit error.
//   3. Stamp last_verified_date = now and verified_by = claims.email (from auth token).

export async function reconcilePosition(
  positionId: string
): Promise<{ success: boolean; error?: string; position?: any }> {
  const claims = await getClaims()
  if (!claims) {
    return { success: false, error: 'Not authenticated.' }
  }

  if (claims.role !== 'internal' && claims.role !== 'admin') {
    return { success: false, error: 'Unauthorised. Only internal managers or admins may reconcile positions.' }
  }

  const supabase = await createServerClient()

  // 1. Evidence Check: Must have at least one linked event with a non-null source_document_url
  const { data: evidenceEvents, error: evidenceError } = await supabase
    .from('exposure_events')
    .select('id, source_document_url')
    .eq('position_id', positionId)
    .not('source_document_url', 'is', null)

  if (evidenceError) {
    console.error('[exposure-events] evidence lookup error:', evidenceError.message)
    return { success: false, error: 'Failed to verify position source evidence.' }
  }

  if (!evidenceEvents || evidenceEvents.length === 0) {
    return {
      success: false,
      error: 'Cannot reconcile: no source document linked to any event for this position',
    }
  }

  // 2. Perform reconciliation update: stamp verified_by from verified JWT claims
  const today = new Date().toISOString().split('T')[0]

  const { data: updatedPosition, error: updateError } = await supabase
    .from('exposure_positions')
    .update({
      last_verified_date: today,
      verified_by: claims.email,
    })
    .eq('id', positionId)
    .select('*')
    .single()

  if (updateError) {
    console.error('[exposure-events] reconcilePosition update error:', updateError.message)
    return { success: false, error: updateError.message }
  }

  return { success: true, position: updatedPosition }
}

// ─── Function 6: getMasterLedgerStatus ─────────────────────────────────────
//
// Returns company-level reconciliation rollup status from master_ledger_status view.
// Gated to internal or admin only.

export async function getMasterLedgerStatus(): Promise<MasterLedgerStatus[]> {
  const claims = await getClaims()
  if (!claims) {
    console.error('[exposure-events] getMasterLedgerStatus: not authenticated')
    return []
  }

  if (claims.role !== 'internal' && claims.role !== 'admin') {
    console.error('[exposure-events] getMasterLedgerStatus: unauthorized role', claims.role)
    return []
  }

  const supabase = await createServerClient()

  const { data, error } = await supabase
    .from('master_ledger_status')
    .select('*')
    .order('company_name')

  if (error) {
    console.error('[exposure-events] getMasterLedgerStatus error:', error.message)
    return []
  }

  return (data ?? []) as MasterLedgerStatus[]
}

export async function getReconciliationPositions() {
  const claims = await getClaims()
  if (!claims || (claims.role !== 'internal' && claims.role !== 'admin')) {
    return []
  }

  const supabase = await createServerClient()

  const { data, error } = await supabase
    .from('exposure_positions')
    .select(`
      id,
      company_id,
      exposure_type,
      instrument_name,
      status,
      last_verified_date,
      verified_by,
      companies ( name ),
      holders ( name ),
      exposure_events ( source_document_url )
    `)
    .order('created_at', { ascending: false })

  if (error || !data) return []

  return data.map((row: any) => {
    const compRow = Array.isArray(row.companies) ? row.companies[0] : row.companies
    const holderRow = Array.isArray(row.holders) ? row.holders[0] : row.holders
    const events = (row.exposure_events ?? []) as { source_document_url: string | null }[]
    const docEvent = events.find((e) => Boolean(e.source_document_url))

    return {
      id: row.id,
      company_id: row.company_id,
      company_name: compRow?.name ?? 'Unknown Company',
      holder_name: holderRow?.name ?? 'Unknown Holder',
      exposure_type: row.exposure_type,
      instrument_name: row.instrument_name ?? null,
      status: row.status,
      last_verified_date: row.last_verified_date ?? null,
      verified_by: row.verified_by ?? null,
      has_source_document: Boolean(docEvent?.source_document_url),
      source_document_url: docEvent?.source_document_url ?? null,
    }
  })
}

