// ─────────────────────────────────────────────────────────────
// Supabase — Service role client
// Used ONLY in server actions/services that need to bypass RLS
// or access auth.users (user management, invite, role changes).
// NEVER import this in client components or pages directly.
// ─────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────
// Supabase — service role client
// Used ONLY in server actions/services that need to bypass RLS
// or access auth.users (user management, invite, role changes).
// NEVER import this in client components or pages directly.
// ─────────────────────────────────────────────────────────────

import { createClient } from '@supabase/supabase-js'

/**
 * SECURITY DEBT — single source of truth for the RLS bypass.
 *
 * RLS cannot currently serve angel/founder reads. Eight policies are
 * permanently FALSE because they test the wrong JWT claim
 * (`auth.jwt() -> 'user_metadata' ->> 'role'`, or bare `auth.jwt() ->> 'role'`
 * which yields 'authenticated'). Reads were moved onto the service-role
 * client, which bypasses RLS, to work around that.
 *
 * Migration `20261030000000_fix_dead_rls_role_claims.sql` repairs the
 * policies. Flip this flag to `false` ONLY after all three are true:
 *   1. that migration is applied       (`npx supabase db push`)
 *   2. `supabase/verify_rls_claims.sql` section [2] returns 0 rows and
 *      section [3] reports REPAIRED for all 8 policies
 *   3. the angel portfolio still renders non-zero invested capital with
 *      RLS enforced (i.e. with this flag already false, locally)
 *
 * Until then, isolation on those read paths is enforced by application code
 * (`.eq('user_id', ...)`) and NOT by the database. Treat that as unverified.
 */
export const RLS_BYPASS_STILL_REQUIRED = true

/**
 * Returns the client used for angel / investor-snapshot reads.
 *
 * Deliberately NOT wrapped in try/catch: the previous shape —
 *   try { return createServiceRoleClient() } catch { return createServerClient() }
 * silently swapped between "RLS enforced" and "RLS bypassed" depending on
 * whether SUPABASE_SECRET_KEY happened to be set in that environment. That
 * makes the security model environment-dependent, so a passing isolation test
 * locally proves nothing about production. A missing key must fail loudly.
 */
export async function createPortfolioReadClient() {
  if (RLS_BYPASS_STILL_REQUIRED) {
    return createServiceRoleClient()
  }
  const { createServerClient } = await import('@/lib/supabase/server')
  return createServerClient()
}

export function createServiceRoleClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key =
    process.env.SUPABASE_SECRET_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SERVICE_KEY

  if (!url || !key) {
    throw new Error(
      '[service-role] Missing NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SECRET_KEY, or SUPABASE_SERVICE_ROLE_KEY env vars',
    )
  }

  return createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}