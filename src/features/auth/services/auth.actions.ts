'use server'

import { createServerClient as createSupabaseServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { SignInResult } from '@/features/auth/types'

/**
 * Send a magic link from the server so the PKCE code verifier is stored in
 * cookies that /auth/callback can read during exchangeCodeForSession.
 */
export async function signInWithMagicLink(
  email: string,
  origin: string
): Promise<SignInResult> {
  const cookieStore = await cookies()

  const supabase = createSupabaseServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        },
      },
    }
  )

  const { error } = await supabase.auth.signInWithOtp({
    email: email.trim().toLowerCase(),
    options: {
      emailRedirectTo: `${origin}/auth/callback`,
      shouldCreateUser: false,
    },
  })

  if (error) {
    return {
      success: false,
      error:
        error.message.toLowerCase().includes('email not confirmed') ||
        error.message.toLowerCase().includes('signups not allowed')
          ? 'This email address is not registered. Contact your TVCLabs administrator.'
          : 'Something went wrong. Try again or contact your administrator.',
    }
  }

  return { success: true }
}
