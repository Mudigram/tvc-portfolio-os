import type { SupabaseClient } from '@supabase/supabase-js'
import { createServerClient } from '@/lib/supabase/server'
import type { UserRole } from '@/types/roles'
import type { AuthClaims } from '@/features/auth/types'

/**
 * Read claims from an existing Supabase client (e.g. during /auth/callback).
 */
export async function getClaimsFromSupabase(
  supabase: SupabaseClient
): Promise<AuthClaims | null> {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) return null

  const role = user.app_metadata?.role as UserRole | undefined

  if (!role) {
    console.warn(
      `[auth] User ${user.id} has no role in app_metadata. ` +
        'Assign a role via the Supabase dashboard or a server-side function.'
    )
    return null
  }

  return {
    userId: user.id,
    email: user.email ?? '',
    role,
  }
}

/**
 * Read the user's role and ID from the validated JWT.
 *
 * Uses getUser (not getSession) so the JWT is cryptographically verified
 * on every call. Never use getSession() on the server.
 *
 * Returns null if the user is not authenticated.
 */
export async function getClaims(): Promise<AuthClaims | null> {
  const supabase = await createServerClient()
  return getClaimsFromSupabase(supabase)
}

/**
 * Map a role to its root dashboard path.
 * Used after sign-in and in the auth callback to redirect the user correctly.
 */
export function getRoleRedirect(role: UserRole): string {
  const destinations: Record<UserRole, string> = {
    internal: '/dashboard',
    angel: '/portfolio',
    founder: '/my-company',
  }
  return destinations[role] ?? '/login'
}
