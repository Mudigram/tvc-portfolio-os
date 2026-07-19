// ─────────────────────────────────────────────────────────────
// Settings — Server service
// Three separate fetches, each called from their respective
// tab server component. No single god-fetch.
// ─────────────────────────────────────────────────────────────

import { createServerClient } from '@/lib/supabase/server'
import { createServiceRoleClient } from '@/lib/supabase/service'
import { TVCLABS_HOLDER_IDS } from '@/features/exposure/types'
import type {
  AppSetting,
  SettingsMap,
  SettingKey,
  ManagedUser,
  TvcEntity,
} from '@/features/settings/types/index'

// ── 1. Fetch all app settings ─────────────────────────────────
export async function getAppSettings(): Promise<SettingsMap> {
  const supabase = await createServerClient()

  const { data, error } = await supabase
    .from('app_settings')
    .select('*')
    .order('key')

  if (error) {
    console.error('[settings] fetch error:', error.message)
    return {} as SettingsMap
  }

  return Object.fromEntries(
    (data as AppSetting[]).map((s) => [s.key, s])
  ) as SettingsMap
}

// ── 2. Fetch all users for user management ────────────────────
// Requires service role — auth.users is not accessible via anon/authed key
export async function getManagedUsers(): Promise<ManagedUser[]> {
  const supabase = createServiceRoleClient()

  const { data, error } = await supabase.auth.admin.listUsers()

  if (error) {
    console.error('[settings] list users error:', error.message)
    return []
  }

  return (data.users ?? []).map((u) => ({
    id: u.id,
    email: u.email ?? '',
    role: (u.app_metadata?.role as ManagedUser['role']) ?? null,
    last_sign_in_at: u.last_sign_in_at ?? null,
    created_at: u.created_at,
    is_disabled: u.banned_until
      ? new Date(u.banned_until) > new Date()
      : false,
  }))
}

// ── 3. Fetch TVC entity holders ───────────────────────────────
export async function getTvcEntities(): Promise<TvcEntity[]> {
  const supabase = await createServerClient()

  const { data, error } = await supabase
    .from('holders')
    .select('id, name, holder_type, email')
    .in('id', TVCLABS_HOLDER_IDS)
    .order('name')

  if (error) {
    console.error('[settings] tvc entities error:', error.message)
    return []
  }

  return (data ?? []) as TvcEntity[]
}