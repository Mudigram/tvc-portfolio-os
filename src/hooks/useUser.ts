'use client'

import { useEffect, useState } from 'react'
import { createBrowserClient } from '@/lib/supabase/client'
import type { UserRole } from '@/types/roles'

interface UserState {
  userId: string | null
  email: string | null
  role: UserRole | null
  loading: boolean
}

/**
 * Client-side hook for accessing the current user's identity and role.
 *
 * Use this in client components that need to show role-conditional UI
 * (e.g. a sidebar that differs between internal and angel users).
 *
 * For server-side access control, use getClaims() from auth.server.ts instead.
 */
export function useUser(): UserState {
  const [state, setState] = useState<UserState>({
    userId: null,
    email: null,
    role: null,
    loading: true,
  })

  useEffect(() => {
    const supabase = createBrowserClient()

    // Read the initial session
    supabase.auth.getUser().then(({ data: { user } }) => {
      setState({
        userId: user?.id ?? null,
        email: user?.email ?? null,
        role: (user?.app_metadata?.role as UserRole) ?? null,
        loading: false,
      })
    })

    // Keep in sync if the session changes (e.g. sign out in another tab)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const user = session?.user ?? null
      setState({
        userId: user?.id ?? null,
        email: user?.email ?? null,
        role: (user?.app_metadata?.role as UserRole) ?? null,
        loading: false,
      })
    })

    return () => subscription.unsubscribe()
  }, [])

  return state
}
