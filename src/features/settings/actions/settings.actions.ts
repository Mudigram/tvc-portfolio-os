'use server'
// ─────────────────────────────────────────────────────────────
// Settings — Server Actions
// ─────────────────────────────────────────────────────────────

import { revalidatePath } from 'next/cache'
import { createServerClient } from '@/lib/supabase/server'
import { createServiceRoleClient } from '@/lib/supabase/service'
import { getClaims } from '@/features/auth/services/auth.server'
import type {
  SettingKey,
  UserRole,
  SettingsActionResult,
} from '../types'

// ── Guard — all settings actions are internal only ────────────
async function guardInternal(): Promise<SettingsActionResult | null> {
  const claims = await getClaims()
  if (!claims || (claims.role !== 'internal' && claims.role !== 'admin')) {
    return { success: false, error: 'Unauthorised' }
  }
  return null
}

// ── 1. Update a single setting value ─────────────────────────
export async function updateSettingAction(
  key: SettingKey,
  value: string,
): Promise<SettingsActionResult> {
  const guard = await guardInternal()
  if (guard) return guard

  const claims = await getClaims()
  const supabase = await createServerClient()

  const { error } = await supabase
    .from('app_settings')
    .update({
      value: value.trim(),
      updated_by: claims!.userId,
    })
    .eq('key', key)

  if (error) {
    console.error('[settings] update error:', error.message)
    return { success: false, error: error.message }
  }

  revalidatePath('/settings')
  revalidatePath('/dashboard')  // thresholds affect dashboard alerts

  return { success: true }
}

// ── 2. Invite a new user ──────────────────────────────────────
// Uses service role to call auth.admin.inviteUserByEmail
// Sets role in app_metadata at invite time so the user lands
// on the right portal after clicking the magic link.
export async function inviteUserAction(
  email: string,
  role: UserRole,
): Promise<SettingsActionResult> {
  const guard = await guardInternal()
  if (guard) return guard

  if (!email || !role) {
    return { success: false, error: 'Email and role are required' }
  }

  const supabase = createServiceRoleClient()

  const { error } = await supabase.auth.admin.inviteUserByEmail(email, {
    data: { role },   // lands in app_metadata on the invited user
  })

  if (error) {
    console.error('[settings] invite error:', error.message)
    return { success: false, error: error.message }
  }

  revalidatePath('/settings')
  return { success: true }
}

// ── 3. Change an existing user's role ────────────────────────
export async function updateUserRoleAction(
  userId: string,
  role: UserRole,
): Promise<SettingsActionResult> {
  const guard = await guardInternal()
  if (guard) return guard

  const supabase = createServiceRoleClient()

  const { error } = await supabase.auth.admin.updateUserById(userId, {
    app_metadata: { role },
  })

  if (error) {
    console.error('[settings] role update error:', error.message)
    return { success: false, error: error.message }
  }

  revalidatePath('/settings')
  return { success: true }
}

// ── 4. Revoke / restore user access ──────────────────────────
// Ban = set banned_until far in future. Restore = clear ban.
export async function toggleUserAccessAction(
  userId: string,
  disable: boolean,
): Promise<SettingsActionResult> {
  const guard = await guardInternal()
  if (guard) return guard

  const supabase = createServiceRoleClient()

  const { error } = await supabase.auth.admin.updateUserById(userId, {
    ban_duration: disable ? '876600h' : 'none',  // 100 years = effectively permanent
  })

  if (error) {
    console.error('[settings] toggle access error:', error.message)
    return { success: false, error: error.message }
  }

  revalidatePath('/settings')
  return { success: true }
}

// ── 5. Fetch linked holdings for an angel user ─────────────────
export async function getAngelHoldingsAction(
  angelUserId: string
): Promise<import('../types').AngelHolding[]> {
  const guard = await guardInternal()
  if (guard) return []

  const supabase = createServiceRoleClient()

  const { data, error } = await supabase
    .from('angel_exposures')
    .select(`
      id,
      exposure_id,
      exposure_positions (
        id,
        exposure_type,
        instrument_name,
        ownership_pct,
        issue_date,
        status,
        company_id,
        companies (
          id,
          name,
          logo_path
        ),
        exposure_events (
          amount
        )
      )
    `)
    .eq('user_id', angelUserId)

  if (error || !data) {
    console.error('[settings] getAngelHoldings error:', error?.message)
    return []
  }

  return data.map((row: any) => {
    const pos = Array.isArray(row.exposure_positions) ? row.exposure_positions[0] : row.exposure_positions
    const comp = Array.isArray(pos?.companies) ? pos.companies[0] : pos?.companies
    const events = (pos?.exposure_events ?? []) as { amount: number }[]
    const amountInvested = events.reduce((sum, e) => sum + (Number(e.amount) || 0), 0)

    return {
      id: row.id,
      exposure_id: row.exposure_id,
      company_id: comp?.id ?? '',
      company_name: comp?.name ?? '—',
      logo_path: comp?.logo_path ?? null,
      instrument_name: pos?.instrument_name ?? null,
      exposure_type: pos?.exposure_type ?? '',
      amount_invested: amountInvested,
      ownership_pct: pos?.ownership_pct ?? null,
      status: pos?.status ?? 'Active',
      issue_date: pos?.issue_date ?? null,
    }
  })
}

// ── 6. Fetch all available exposure positions across companies ──
export async function getAvailableExposuresAction(): Promise<import('../types').AvailableExposure[]> {
  const guard = await guardInternal()
  if (guard) return []

  const supabase = createServiceRoleClient()

  const { data, error } = await supabase
    .from('exposure_positions')
    .select(`
      id,
      company_id,
      instrument_name,
      exposure_type,
      companies (
        id,
        name
      ),
      exposure_events (
        amount
      )
    `)
    .order('company_id')

  if (error || !data) {
    console.error('[settings] getAvailableExposures error:', error?.message)
    return []
  }

  return data.map((row: any) => {
    const comp = Array.isArray(row.companies) ? row.companies[0] : row.companies
    const events = (row.exposure_events ?? []) as { amount: number }[]
    const amountInvested = events.reduce((sum, e) => sum + (Number(e.amount) || 0), 0)

    return {
      id: row.id,
      company_id: comp?.id ?? row.company_id,
      company_name: comp?.name ?? 'Unknown Company',
      instrument_name: row.instrument_name ?? null,
      exposure_type: row.exposure_type ?? '',
      amount_invested: amountInvested,
    }
  })
}

// ── 7. Link an exposure position to an angel user ──────────────
export async function linkAngelExposureAction(
  angelUserId: string,
  exposureId: string
): Promise<SettingsActionResult> {
  const guard = await guardInternal()
  if (guard) return guard

  const supabase = createServiceRoleClient()

  const { error } = await supabase
    .from('angel_exposures')
    .insert({
      user_id: angelUserId,
      exposure_id: exposureId,
    })

  if (error) {
    if (error.code === '23505') {
      return { success: false, error: 'This position is already linked to this angel.' }
    }
    console.error('[settings] linkAngelExposure error:', error.message)
    return { success: false, error: error.message }
  }

  revalidatePath('/settings')
  revalidatePath('/portfolio')
  return { success: true }
}

// ── 8. Unlink an exposure position from an angel user ────────────
export async function unlinkAngelExposureAction(
  angelUserId: string,
  exposureId: string
): Promise<SettingsActionResult> {
  const guard = await guardInternal()
  if (guard) return guard

  const supabase = createServiceRoleClient()

  const { error } = await supabase
    .from('angel_exposures')
    .delete()
    .eq('user_id', angelUserId)
    .eq('exposure_id', exposureId)

  if (error) {
    console.error('[settings] unlinkAngelExposure error:', error.message)
    return { success: false, error: error.message }
  }

  revalidatePath('/settings')
  revalidatePath('/portfolio')
  return { success: true }
}

// ── 9. Fetch registered angel users for selectors ───────────────
export async function getRegisteredAngelUsersAction(): Promise<{ id: string; email: string; name?: string }[]> {
  const guard = await guardInternal()
  if (guard) return []

  const supabase = createServiceRoleClient()
  const { data: userData, error } = await supabase.auth.admin.listUsers()

  if (error || !userData) {
    return []
  }

  const { data: holderRows } = await supabase
    .from('holders')
    .select('name, email, user_id')

  const holderMap = new Map<string, string>()
  for (const h of holderRows ?? []) {
    if (h.user_id) holderMap.set(h.user_id, h.name)
    if (h.email) holderMap.set(h.email.toLowerCase(), h.name)
  }

  return userData.users
    .filter((u) => u.app_metadata?.role === 'angel')
    .map((u) => ({
      id: u.id,
      email: u.email ?? '',
      name: holderMap.get(u.id) || (u.email ? holderMap.get(u.email.toLowerCase()) : undefined),
    }))
}