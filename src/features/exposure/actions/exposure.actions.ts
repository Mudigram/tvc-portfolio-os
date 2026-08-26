'use server'
// ─────────────────────────────────────────────────────────────
// Exposure — Server Actions
// ─────────────────────────────────────────────────────────────

import { revalidatePath } from 'next/cache'
import { createServerClient } from '@/lib/supabase/server'
import { getClaims } from '@/features/auth/services/auth.server'
import type { ExposureStatus, ExposureType, HolderType } from '@/features/exposure/types'

export interface UpdateExposureResult {
  success: boolean
  error?: string
}

export interface CreateExposureResult {
  success: boolean
  error?: string
  exposureId?: string
}

function parseNullableFloat(value: string | null): number | null {
  if (!value || value.trim() === '') return null
  const n = parseFloat(value)
  return isNaN(n) ? null : n
}

function parseNullableString(value: string | null): string | null {
  if (!value || value.trim() === '') return null
  return value.trim()
}

// ── Update a single exposure row ─────────────────────────────
// Internal only. Angels and founders cannot edit exposure.
export async function updateExposureRow(
  exposureId: string,
  companyId: string,
  formData: FormData,
): Promise<UpdateExposureResult> {
  const claims = await getClaims()
  if (!claims || (claims.role !== 'internal' && claims.role !== 'admin')) {
    return { success: false, error: 'Unauthorised' }
  }

  const exposure_type = parseNullableString(
    formData.get('exposure_type') as string,
  ) as ExposureType | null

  const instrument_name = parseNullableString(
    formData.get('instrument_name') as string,
  )
  const issue_date = parseNullableString(
    formData.get('issue_date') as string,
  )
  const amount_invested = parseNullableFloat(
    formData.get('amount_invested') as string,
  )
  const ownership_pct = parseNullableFloat(
    formData.get('ownership_pct') as string,
  )
  const share_class = parseNullableString(
    formData.get('share_class') as string,
  )
  const status = (formData.get('status') as ExposureStatus) || 'Active'
  const last_verified_date = parseNullableString(
    formData.get('last_verified_date') as string,
  )

  // Basic validation
  if (ownership_pct !== null && (ownership_pct < 0 || ownership_pct > 100)) {
    return { success: false, error: 'Ownership % must be between 0 and 100' }
  }

  const supabase = await createServerClient()

  const { error } = await supabase
    .from('exposure_positions')
    .update({
      exposure_type,
      instrument_name,
      issue_date,
      ownership_pct,
      share_class,
      status,
      last_verified_date,
      // Record who verified and when — uses the internal user's id
      ...(last_verified_date ? { verified_by: claims.email } : {}),
    })
    .eq('id', exposureId)

  if (error) {
    console.error('[exposure] update error:', error.message)
    return { success: false, error: error.message }
  }

  // If amount_invested is provided, insert a position event update if needed
  if (amount_invested !== null) {
    const today = new Date().toISOString().split('T')[0]
    await supabase.from('exposure_events').insert({
      position_id: exposureId,
      event_type: 'investment',
      effective_date: issue_date || today,
      amount: amount_invested,
      currency: 'USD',
      created_by: claims.userId,
    })
  }

  revalidatePath(`/companies/${companyId}`)
  revalidatePath('/exposure')

  return { success: true }
}

// ── Create a new exposure row ─────────────────────────────────
// Internal only. Supports two holder paths:
//   1. holder_id provided        → insert exposure row directly
//   2. new_holder_name provided  → insert holder first (is_tvclabs_entity
//                                   always false here), then the exposure row
//
// new_holder_name and holder_id are mutually exclusive — the form only
// ever sends one or the other based on what the user picked.
export async function createExposureRow(
  companyId: string,
  formData: FormData,
): Promise<CreateExposureResult> {
  const claims = await getClaims()
  if (!claims || (claims.role !== 'internal' && claims.role !== 'admin')) {
    return { success: false, error: 'Unauthorised' }
  }

  const holder_id = parseNullableString(formData.get('holder_id') as string)
  const new_holder_name = parseNullableString(
    formData.get('new_holder_name') as string,
  )
  const new_holder_type = parseNullableString(
    formData.get('new_holder_type') as string,
  ) as HolderType | null
  const new_holder_email = parseNullableString(
    formData.get('new_holder_email') as string,
  )

  if (!holder_id && !new_holder_name) {
    return { success: false, error: 'Select an existing holder or provide a name for a new one' }
  }

  if (new_holder_name && !new_holder_type) {
    return { success: false, error: 'Holder type is required when creating a new holder' }
  }

  const exposure_type = parseNullableString(
    formData.get('exposure_type') as string,
  ) as ExposureType | null

  if (!exposure_type) {
    return { success: false, error: 'Instrument type is required' }
  }

  const instrument_name = parseNullableString(
    formData.get('instrument_name') as string,
  )
  const issue_date = parseNullableString(
    formData.get('issue_date') as string,
  )
  const amount_invested = parseNullableFloat(
    formData.get('amount_invested') as string,
  )
  const ownership_pct = parseNullableFloat(
    formData.get('ownership_pct') as string,
  )
  const share_class = parseNullableString(
    formData.get('share_class') as string,
  )
  const status = (formData.get('status') as ExposureStatus) || 'Active'
  const last_verified_date = parseNullableString(
    formData.get('last_verified_date') as string,
  )

  if (ownership_pct !== null && (ownership_pct < 0 || ownership_pct > 100)) {
    return { success: false, error: 'Ownership % must be between 0 and 100' }
  }

  const supabase = await createServerClient()

 // ── Resolve holder_id — create the holder first if needed ───
 let resolvedHolderId = holder_id
 let resolvedHolderType: HolderType | null = null

 if (!resolvedHolderId && new_holder_name && new_holder_type) {
   const { data: newHolder, error: holderError } = await supabase
     .from('holders')
     .insert({
       name: new_holder_name,
       holder_type: new_holder_type,
       email: new_holder_email,
       is_tvclabs_entity: false,
     })
     .select('id, holder_type')
     .single()

   if (holderError || !newHolder) {
     console.error('[exposure] holder create error:', holderError?.message)
     return { success: false, error: 'Could not create new holder' }
   }

   resolvedHolderId = newHolder.id
   resolvedHolderType = newHolder.holder_type as HolderType
 }

 // For existing holder — fetch their type
 if (resolvedHolderId && !resolvedHolderType) {
   const { data: existingHolder } = await supabase
     .from('holders')
     .select('holder_type')
     .eq('id', resolvedHolderId)
     .single()

   resolvedHolderType = (existingHolder?.holder_type as HolderType) ?? null
 }

 if (!resolvedHolderId || !resolvedHolderType) {
   return { success: false, error: 'Could not resolve holder' }
 }

 // ── Insert the position row ──────────────────────────────────
 const { data: newExposure, error: exposureError } = await supabase
   .from('exposure_positions')
   .insert({
     company_id: companyId,
     holder_id: resolvedHolderId,
     holder_type: resolvedHolderType,   // ← now included
     exposure_type,
     instrument_name,
     issue_date,
     ownership_pct,
     share_class,
     status,
     last_verified_date,
     ...(last_verified_date ? { verified_by: claims.userId } : {}),
   })
   .select('id')
   .single()

  if (exposureError || !newExposure) {
    console.error('[exposure] create error:', exposureError?.message)
    return { success: false, error: exposureError?.message ?? 'Could not create exposure record' }
  }

  // Insert initial investment event into exposure_events log ledger
  if (amount_invested !== null && amount_invested > 0) {
    const today = new Date().toISOString().split('T')[0]
    const { error: eventError } = await supabase.from('exposure_events').insert({
      position_id: newExposure.id,
      event_type: 'investment',
      effective_date: issue_date || today,
      amount: amount_invested,
      currency: 'USD',
      created_by: claims.userId,
    })
    if (eventError) {
      console.error('[exposure] initial event insert error:', eventError.message)
    }
  }

  revalidatePath(`/companies/${companyId}`)
  revalidatePath('/exposure')
  revalidatePath('/investor-snapshot')

  return { success: true, exposureId: newExposure.id }
}

// ── Reconcile a position (Master Ledger) ─────────────────────
export async function reconcilePositionAction(
  positionId: string,
  companyId?: string
): Promise<{ success: boolean; error?: string }> {
  const { reconcilePosition } = await import('@/features/exposure/services/exposure-events.service')
  const result = await reconcilePosition(positionId)

  if (result.success) {
    if (companyId) revalidatePath(`/companies/${companyId}`)
    revalidatePath('/exposure')
    revalidatePath('/reconciliation')
    revalidatePath('/settings')
  }

  return result
}