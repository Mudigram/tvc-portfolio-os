// ─────────────────────────────────────────────────────────────
// Supabase — Service role client
// Used ONLY in server actions/services that need to bypass RLS
// or access auth.users (user management, invite, role changes).
// NEVER import this in client components or pages directly.
// ─────────────────────────────────────────────────────────────

import { createClient } from '@supabase/supabase-js'

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