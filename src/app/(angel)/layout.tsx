import RoleShell from '@/components/layout/RoleShell'
import AppShell from '@/components/layout/AppShell'
import { getClaims } from '@/features/auth/services/auth.server'    

export default async function AngelLayout({ children }: { children: React.ReactNode }) {
  return (
    <RoleShell allowedRoles={['angel', 'internal']}>
      <AngelShell>{children}</AngelShell>
    </RoleShell>
  )
}

async function AngelShell({ children }: { children: React.ReactNode }) {
  const claims = await getClaims()
  return (
    <AppShell role={claims!.role === 'internal' ? 'internal' : 'angel'} email={claims!.email}>
      {children}
    </AppShell>
  )
}