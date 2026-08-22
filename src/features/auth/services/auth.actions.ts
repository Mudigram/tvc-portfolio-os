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

/**
 * Sign in using email and password (for testing and password-enabled accounts).
 */
export async function signInWithPasswordAction(
  email: string,
  password: string
): Promise<{ success: boolean; error?: string; redirectUrl?: string }> {
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

  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim().toLowerCase(),
    password,
  })

  if (error || !data.user) {
    return {
      success: false,
      error: error?.message || 'Invalid email or password.',
    }
  }

  const role = data.user.app_metadata?.role
  if (!role) {
    return {
      success: false,
      error: 'Your account has no role assigned. Contact your TVCLabs administrator.',
    }
  }

  const destinations: Record<string, string> = {
    admin: '/dashboard',
    internal: '/dashboard',
    angel: '/portfolio',
    founder: '/my-company',
  }
  const redirectUrl = destinations[role] ?? '/dashboard'

  return { success: true, redirectUrl }
}
