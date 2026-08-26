import { type NextRequest, NextResponse } from 'next/server'
import { createProxyClient } from '@/lib/supabase/proxy'
import type { UserRole } from '@/types/roles'

/**
 * Route protection proxy for Next.js 16+.
 *
 * Replaces middleware.ts — export must be named `proxy`.
 *
 * Strategy:
 * 1. Refresh the session cookie so it never goes stale.
 * 2. If the route is public, pass through immediately.
 * 3. If there is no authenticated user, redirect to /login.
 * 4. If the user's role does not permit the requested route group, redirect
 *    them to their own dashboard rather than showing a 403.
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // ------------------------------------------------------------------
  // 1. Public routes — no auth check needed
  // ------------------------------------------------------------------
  if (isPublicRoute(pathname)) {
    return NextResponse.next()
  }

  // ------------------------------------------------------------------
  // 2. Refresh session cookie and read the user
  // ------------------------------------------------------------------
  const { response, supabase } = createProxyClient(request)

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // ------------------------------------------------------------------
  // 3. Unauthenticated — redirect to login
  // ------------------------------------------------------------------
  if (!user) {
    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = '/login'
    // Preserve the intended destination so the callback can honour it
    loginUrl.searchParams.set('next', pathname)
    return NextResponse.redirect(loginUrl)
  }

  const role = user.app_metadata?.role as UserRole | undefined

  if (!role) {
    // Authenticated but no role — account is misconfigured
    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = '/login'
    loginUrl.searchParams.set('error', 'no_claims')
    return NextResponse.redirect(loginUrl)
  }

  // ------------------------------------------------------------------
  // 4. Role-based route protection
  // ------------------------------------------------------------------
  if (!isRoutePermitted(pathname, role)) {
    // Send the user to their own dashboard rather than an error page
    const dashboardUrl = request.nextUrl.clone()
    dashboardUrl.pathname = getRoleDashboard(role)
    dashboardUrl.search = ''
    return NextResponse.redirect(dashboardUrl)
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all routes except:
     * - _next/static  (static files)
     * - _next/image   (image optimisation)
     * - favicon.ico
     * - Public assets in /public
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function isPublicRoute(pathname: string): boolean {
  const publicRoutes = ['/login', '/auth/callback']
  return publicRoutes.some(
    (route) => pathname === route || pathname.startsWith(route + '/')
  )
}

/**
 * Returns true if a user with `role` is allowed to access `pathname`.
 *
 * Route group mapping:
 *   /dashboard, /companies, /founders, /exposure, /advisory, /settings
 *     → internal only
 *
 *   /portfolio
 *     → angel only
 *
 *   /my-company, /submit-update, /documents
 *     → founder only
 */
function isRoutePermitted(pathname: string, role: UserRole): boolean {
  const internalRoutes = [
    '/dashboard',
    '/companies',
    '/founders',
    '/exposure',
    '/investor-snapshot',
    '/reconciliation',
    '/advisory',
    '/settings',
    '/campaigns',
    '/funding',
    '/poem-ddr',
    '/exit-readiness',
  ]

  const angelRoutes = ['/portfolio']

  const founderRoutes = ['/my-company', '/submit-update', '/documents']

  if (role === 'internal' || role === 'admin') {
    return (
      internalRoutes.some((r) => pathname === r || pathname.startsWith(r + '/')) ||
      angelRoutes.some((r) => pathname === r || pathname.startsWith(r + '/')) ||
      founderRoutes.some((r) => pathname === r || pathname.startsWith(r + '/'))
    )
  }

  if (role === 'angel') {
    return angelRoutes.some(
      (r) => pathname === r || pathname.startsWith(r + '/')
    )
  }

  if (role === 'founder') {
    return founderRoutes.some(
      (r) => pathname === r || pathname.startsWith(r + '/')
    )
  }

  return false
}

function getRoleDashboard(role: UserRole): string {
  const dashboards: Record<UserRole, string> = {
    admin: '/dashboard',
    internal: '/dashboard',
    angel: '/portfolio',
    founder: '/my-company',
  }
  return dashboards[role]
}
