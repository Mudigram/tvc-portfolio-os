// src/app/(auth)/auth/callback/page.tsx
'use client'

import { useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createBrowserClient } from '@/lib/supabase/client'
import type { UserRole } from '@/types/roles'

const ROLE_REDIRECTS: Record<UserRole, string> = {
  admin: '/dashboard',
  internal: '/dashboard',
  angel: '/portfolio',
  founder: '/founder-dashboard',
}

function AuthCallbackContent() {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const run = async () => {
      const supabase = createBrowserClient()
      const code = searchParams.get('code')
      const next = searchParams.get('next')

      if (!code) {
        router.replace('/login?error=missing_code')
        return
      }

      const { data, error } = await supabase.auth.exchangeCodeForSession(code)
      if (error || !data.user) {
        router.replace('/login?error=auth_failed')
        return
      }

      const role = data.user.app_metadata?.role as UserRole | undefined
      if (!role) {
        router.replace('/login?error=no_claims')
        return
      }

      router.replace(next ?? ROLE_REDIRECTS[role] ?? '/')
    }
    run()
  }, [])

  return <div>Signing you in…</div>
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={<div>Signing you in…</div>}>
      <AuthCallbackContent />
    </Suspense>
  )
}