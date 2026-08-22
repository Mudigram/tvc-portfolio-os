'use server'
// ↑ This directive is what makes it a server action.
// Without it, this would run in the browser and expose your database credentials.

import { revalidatePath } from 'next/cache'
import { createServerClient } from '@/lib/supabase/server'
import { getClaims } from '@/features/auth/services/auth.server'
import type { CreateUpdateInput } from '@/features/monthly-updates/types'

export async function submitUpdateAction(
  input: CreateUpdateInput
): Promise<{ success: boolean; error?: string }> {

  // ── Step 1: Auth check ───────────────────────────────────────────────────
  // Always the first thing in any server action. If there's no valid session,
  // stop immediately. Never trust that the client "already checked" auth.
  const claims = await getClaims()
  if (!claims) return { success: false, error: 'Not authenticated.' }

  if (!['internal', 'founder'].includes(claims.role)) {
    return { success: false, error: 'Not authorised to submit updates.' }
  }

  // ── Step 2: Validate input ───────────────────────────────────────────────
  // Basic sanity checks. The form already validates on the client but
  // server actions must validate independently — never trust client input.
  if (!input.achievements?.trim()) return { success: false, error: 'Achievements are required.' }
  if (!input.challenges?.trim())   return { success: false, error: 'Challenges are required.' }
  if (!input.targets?.trim())      return { success: false, error: 'Targets are required.' }

  const supabase = await createServerClient()

  // ── Step 3: Founder scope check ──────────────────────────────────────────
  // Founders can only submit updates for their own company.
  // Internal users can submit for any company.
  // RLS enforces this at the DB layer too — this is a friendly pre-check.
  if (claims.role === 'founder') {
    const { data: company } = await supabase
      .from('companies')
      .select('id')
      .eq('id', input.company_id)
      .eq('crm_founder_id', claims.userId)
      .single()

    if (!company) {
      return { success: false, error: 'You can only submit updates for your own company.' }
    }
  }

  // ── Step 4: Check for existing update this period ────────────────────────
  // If a Draft exists for this month/year — update it.
  // If a Submitted update exists — block it. Can't resubmit.
  const { data: existing } = await supabase
    .from('monthly_updates')
    .select('id, status')
    .eq('company_id', input.company_id)
    .eq('month', input.month)
    .eq('year', input.year)
    .maybeSingle()
  // ↑ .maybeSingle() returns null if no row found. .single() would error.

  if (existing) {
    if (existing.status !== 'Draft' && existing.status !== 'Needs Correction') {
      return {
        success: false,
        error: `An update for ${input.month}/${input.year} has already been submitted and is currently ${existing.status}.`,
      }
    }

    // Update the existing draft or resubmit corrected update
    const { error } = await supabase
      .from('monthly_updates')
      .update({
        achievements: input.achievements.trim(),
        challenges: input.challenges.trim(),
        targets: input.targets.trim(),
        submitted_by: claims.email,
        status: input.status ?? 'Draft',
        submitted_at: input.status === 'Submitted' ? new Date().toISOString() : null,
      })
      .eq('id', existing.id)

    if (error) return { success: false, error: 'Failed to save update.' }
  } else {
    // Insert a new row
    const { error } = await supabase
      .from('monthly_updates')
      .insert({
        company_id: input.company_id,
        month: input.month,
        year: input.year,
        achievements: input.achievements.trim(),
        challenges: input.challenges.trim(),
        targets: input.targets.trim(),
        submitted_by: claims.email,
        status: input.status ?? 'Draft',
        submitted_at: input.status === 'Submitted' ? new Date().toISOString() : null,
      })

    if (error) return { success: false, error: 'Failed to save update.' }
  }

  // ── Step 5: Revalidate ───────────────────────────────────────────────────
  // After a write, Next.js needs to know which cached pages are now stale.
  // This tells it to re-fetch data for these two paths on the next request.
  revalidatePath(`/companies/${input.company_id}`)
  revalidatePath('/dashboard')

  return { success: true }
}