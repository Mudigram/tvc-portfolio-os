// ─────────────────────────────────────────────────────────────
// Campaigns — Recipient resolution service
// Resolves selected pools + individual emails into a
// deduplicated list of ResolvedRecipient objects.
// Called server-side only — for preview and at send time.
// ─────────────────────────────────────────────────────────────

import { createServerClient } from '@/lib/supabase/server'
import type { RecipientPool, ResolvedRecipient } from '../types'

export async function resolveRecipients(
  pools: RecipientPool[],
  individualEmails: string[],
): Promise<ResolvedRecipient[]> {
  const supabase = await createServerClient()
  const recipients: ResolvedRecipient[] = []
  const seenEmails = new Set<string>()

  function addRecipient(r: ResolvedRecipient) {
    const email = r.email.toLowerCase().trim()
    if (!email || seenEmails.has(email)) return
    seenEmails.add(email)
    recipients.push({ ...r, email })
  }

  // ── Angels pool ───────────────────────────────────────────
  if (pools.includes('angels')) {
    const { data, error } = await supabase
      .from('holders')
      .select('name, email')
      .eq('holder_type', 'Investor')
      .eq('is_tvclabs_entity', false)
      .not('email', 'is', null)

    if (error) {
      console.error('[campaigns] angels fetch error:', error.message)
    } else {
      for (const row of data ?? []) {
        if (row.email) {
          addRecipient({ email: row.email, type: 'angel', name: row.name })
        }
      }
    }
  }

  // ── Founders with portfolio companies ─────────────────────
  if (pools.includes('founders_with_companies') || pools.includes('all_founders')) {
    const { data, error } = await supabase
      .from('founders')
      .select('full_name, email, companies!inner(id)')

    if (error) {
      console.error('[campaigns] founders_with_companies fetch error:', error.message)
    } else {
      for (const row of data ?? []) {
        if (row.email) {
          addRecipient({
            email: row.email,
            type: 'founder_portfolio',
            name: row.full_name,
          })
        }
      }
    }
  }

  // ── Founders in CRM only (no company linkage) ─────────────
  if (pools.includes('founders_crm_only') || pools.includes('all_founders')) {
    const { data, error } = await supabase
      .from('founders')
      .select('full_name, email')
      .not('id', 'in', `(
        select crm_founder_id from companies
        where crm_founder_id is not null
      )`)

    if (error) {
      console.error('[campaigns] founders_crm_only fetch error:', error.message)
    } else {
      for (const row of data ?? []) {
        if (row.email) {
          addRecipient({
            email: row.email,
            type: 'founder_crm',
            name: row.full_name,
          })
        }
      }
    }
  }

  // ── Individual emails (manually added) ────────────────────
  for (const email of individualEmails) {
    const trimmed = email.toLowerCase().trim()
    if (!trimmed) continue
    addRecipient({ email: trimmed, type: 'individual', name: null })
  }

  return recipients
}

// ── Fetch campaign history ────────────────────────────────────
export async function getCampaignHistory() {
  const supabase = await createServerClient()

  const { data, error } = await supabase
    .from('campaigns')
    .select(`
      *,
      sender:user_emails!campaigns_sent_by_fkey ( email )
    `)
    .eq('status', 'sent')
    .order('sent_at', { ascending: false })
    .limit(50)

  if (error) {
    console.error('[campaigns] history fetch error:', error.message)
    return []
  }

  return (data ?? []).map((row) => {
    const sender = Array.isArray(row.sender) ? row.sender[0] : row.sender
    return {
      ...row,
      sender_email: sender?.email ?? null,
    }
  })
}