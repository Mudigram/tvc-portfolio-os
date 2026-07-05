import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { getRoleRedirect } from '@/features/auth/services/auth.server'
import type { UserRole } from '@/types/roles'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)

  const code = searchParams.get('code')
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type')
  const next = searchParams.get('next') ?? null

  const supabase = await createServerClient()
  let userId: string | null = null
  let role: UserRole | null = null

  if (code) {
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    if (error || !data.user) {
      console.error('[callback] exchangeCodeForSession error:', error?.message)
      return NextResponse.redirect(`${origin}/login?error=auth_failed`)
    }
    userId = data.user.id
    role = data.user.app_metadata?.role as UserRole ?? null

  } else if (token_hash && type) {
    const { data, error } = await supabase.auth.verifyOtp({
      token_hash,
      type: type as 'magiclink' | 'email',
    })
    if (error || !data.user) {
      console.error('[callback] verifyOtp error:', error?.message)
      return NextResponse.redirect(`${origin}/login?error=auth_failed`)
    }
    userId = data.user.id
    role = data.user.app_metadata?.role as UserRole ?? null

  } else {
    return NextResponse.redirect(`${origin}/login?error=missing_code`)
  }

  console.log('[callback] userId:', userId, '| role:', role)

  if (!role) {
    return NextResponse.redirect(`${origin}/login?error=no_claims`)
  }

  if (next) {
    return NextResponse.redirect(`${origin}${next}`)
  }

  return NextResponse.redirect(`${origin}${getRoleRedirect(role)}`)
}