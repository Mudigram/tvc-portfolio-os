import RoleShell from '@/components/layout/RoleShell'
import AppShell from '@/components/layout/AppShell'
import { getClaims } from '@/features/auth/services/auth.server'

export default async function FounderLayout({ children }: { children: React.ReactNode }) {
  return (
    <RoleShell allowedRoles={['founder', 'internal', 'admin']}>
      <FounderShell>{children}</FounderShell>
    </RoleShell>
  )
}

async function FounderShell({ children }: { children: React.ReactNode }) {
  const claims = await getClaims()
  const activeRole = ['internal', 'admin'].includes(claims?.role ?? '') ? (claims!.role as any) : 'founder'
  return (
    <AppShell role={activeRole} email={claims!.email}>
      {children}
    </AppShell>
  )
}