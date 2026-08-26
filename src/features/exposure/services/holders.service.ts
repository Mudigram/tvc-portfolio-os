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
export async function getHoldersForPicker(): Promise<HolderOption[]> {
  const supabase = await createServerClient()

  // 1. Primary: query holders table directly using basic columns (id, name)
  try {
    const { data: holdersData, error: holdersError } = await supabase
      .from('holders')
      .select('id, name')
      .order('name', { ascending: true })

    if (!holdersError && holdersData && holdersData.length > 0) {
      return holdersData.map((h: any) => ({
        id: h.id,
        name: h.name || 'Unnamed Investor',
        holder_type: (h.holder_type as HolderType) ?? 'Investor',
        is_tvclabs_entity: false,
        email: null,
      }))
    }

    if (holdersError) {
      console.warn('[holders.service] direct select info:', holdersError.message)
    }
  } catch (err: any) {
    console.warn('[holders.service] direct catch:', err?.message)
  }

  // 2. Fallback: Query unique holders from exposure_positions table
  try {
    const { data: posData, error: posError } = await supabase
      .from('exposure_positions')
      .select('holder_id, holders(id, name)')

    if (!posError && posData && posData.length > 0) {
      const holderMap = new Map<string, HolderOption>()

      for (const row of posData) {
        const hRow = Array.isArray(row.holders) ? row.holders[0] : row.holders
        if (hRow && hRow.id) {
          if (!holderMap.has(hRow.id)) {
            holderMap.set(hRow.id, {
              id: hRow.id,
              name: hRow.name || 'Unnamed Investor',
              holder_type: 'Investor',
              is_tvclabs_entity: false,
              email: null,
            })
          }
        } else if (row.holder_id && !holderMap.has(row.holder_id)) {
          holderMap.set(row.holder_id, {
            id: row.holder_id,
            name: `Investor (${row.holder_id.slice(0, 8)})`,
            holder_type: 'Investor',
            is_tvclabs_entity: false,
            email: null,
          })
        }
      }

      const list = Array.from(holderMap.values()).sort((a, b) =>
        a.name.localeCompare(b.name),
      )
      if (list.length > 0) return list
    }

    if (posError) {
      console.warn('[holders.service] position fallback info:', posError.message)
    }
  } catch (err: any) {
    console.warn('[holders.service] fallback catch:', err?.message)
  }

  return []
}