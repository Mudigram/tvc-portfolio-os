// ─────────────────────────────────────────────────────────────
// Holders — Server service (for the exposure holder picker)
// Internal only. No direct Supabase imports in components.
// ─────────────────────────────────────────────────────────────

"use server"

import { createServerClient } from '@/lib/supabase/server'
import type { HolderType } from '@/features/exposure/types'

export interface HolderOption {
  id: string
  name: string
  holder_type: HolderType
  is_tvclabs_entity: boolean
  email: string | null
}

// ── Fetch all holders for the picker ──────────────────────────
// TVCLabs entities are pinned to the top by the caller (component),
// this just returns everything sorted by name.
export async function getHoldersForPicker(): Promise<HolderOption[]> {
  const supabase = await createServerClient()

  const { data, error } = await supabase
    .from('holders')
    .select('id, name, holder_type, is_tvclabs_entity, email')
    .order('is_tvclabs_entity', { ascending: false })  // TVCLabs entities first
    .order('name', { ascending: true })

  if (error) {
    console.error('[holders] fetch error:', error.message)
    return []
  }

  return (data ?? []) as HolderOption[]
}