import RoleShell from '@/components/layout/RoleShell'
import AppShell from '@/components/layout/AppShell'
import { getClaims } from '@/features/auth/services/auth.server'    

export default async function AngelLayout({ children }: { children: React.ReactNode }) {
  return (
    <RoleShell allowedRoles={['angel', 'internal', 'admin']}>
      <AngelShell>{children}</AngelShell>
    </RoleShell>
  )
}

async function AngelShell({ children }: { children: React.ReactNode }) {
  const claims = await getClaims()
  const activeRole = ['internal', 'admin'].includes(claims?.role ?? '') ? (claims!.role as any) : 'angel'
  return (
    <AppShell role={activeRole} email={claims!.email}>
      {children}
    </AppShell>
  )
}