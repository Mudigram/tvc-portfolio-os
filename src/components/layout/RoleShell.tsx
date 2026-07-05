import { redirect } from 'next/navigation'
import { getClaims } from '@/features/auth/services/auth.server'
import { getRoleRedirect } from '@/features/auth/services/auth.server'
import type { UserRole } from '@/types/roles'

interface RoleShellProps {
  allowedRoles: UserRole[]
  children: React.ReactNode
}

export default async function RoleShell({ allowedRoles, children }: RoleShellProps) {
  const claims = await getClaims()

  if (!claims) {
    redirect('/login')
  }

  if (!allowedRoles.includes(claims.role)) {
    redirect(getRoleRedirect(claims.role))
  }

  return <>{children}</>
}