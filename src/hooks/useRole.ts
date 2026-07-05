'use client'

import { useUser } from '@/hooks/useUser'
import type { UserRole } from '@/types/roles'

/**
 * Convenience hook. Returns the current user's role and a loading flag.
 *
 * Example:
 *   const { role, loading } = useRole()
 *   if (loading) return <Spinner />
 *   if (role !== 'internal') return null
 */
export function useRole(): { role: UserRole | null; loading: boolean } {
  const { role, loading } = useUser()
  return { role, loading }
}
