import RoleShell from '@/components/layout/RoleShell'
import AppShell from '@/components/layout/AppShell'
import { getClaims } from '@/features/auth/services/auth.server'

export default async function FounderLayout({ children }: { children: React.ReactNode }) {
  return (
    <RoleShell allowedRoles={['founder', 'internal']}>
      <FounderShell>{children}</FounderShell>
    </RoleShell>
  )
}

async function FounderShell({ children }: { children: React.ReactNode }) {
  const claims = await getClaims()
  return (
    <AppShell role={claims!.role === 'internal' ? 'internal' : 'founder'} email={claims!.email}>
      {children}
    </AppShell>
  )
}