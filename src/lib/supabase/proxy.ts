import { createServerClient } from '@supabase/ssr'
import { type NextRequest, NextResponse } from 'next/server'

/**
 * Creates a Supabase client that can read and write cookies in the proxy layer.
 *
 * This is the only place where we need to both read and mutate cookies in a
 * single request/response cycle — hence the separate helper.
 *
 * Used exclusively by src/proxy.ts.
 */
export function createProxyClient(request: NextRequest) {
  // Start with a passthrough response so we can attach refreshed cookies to it
  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          // Write cookies to both the request (so later middleware can read them)
          // and the response (so the browser receives them)
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  return { supabase, response }
}
