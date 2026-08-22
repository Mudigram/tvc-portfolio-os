import RoleShell from '@/components/layout/RoleShell'
import AppShell from '@/components/layout/AppShell'
import { getClaims } from '@/features/auth/services/auth.server'

export default async function InternalLayout({ children }: { children: React.ReactNode }) {
  return (
    <RoleShell allowedRoles={['internal', 'admin']}>
      <InternalShell>{children}</InternalShell>
    </RoleShell>
  )
}

async function InternalShell({ children }: { children: React.ReactNode }) {
  const claims = await getClaims()
  const activeRole = claims?.role === 'admin' ? 'admin' : 'internal'
  return (
    <AppShell role={activeRole} email={claims!.email}>
      {children}
    </AppShell>
  )
}