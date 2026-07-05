import { createBrowserClient as createSupabaseBrowserClient } from '@supabase/ssr'

/**
 * Browser-side Supabase client for client components only.
 */
export function createBrowserClient() {
  return createSupabaseBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
