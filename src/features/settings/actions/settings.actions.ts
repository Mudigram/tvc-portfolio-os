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