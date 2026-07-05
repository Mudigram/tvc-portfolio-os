'use client'

import { createBrowserClient } from '@/lib/supabase/client'
import type { SignOutResult } from '@/features/auth/types'

/**
 * Sign the current user out and redirect to /login.
 * Safe to call from a client component.
 */
export async function signOut(): Promise<SignOutResult> {
  const supabase = createBrowserClient()
  const { error } = await supabase.auth.signOut()

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true }
}
