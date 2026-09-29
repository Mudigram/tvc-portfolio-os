import { redirect } from 'next/navigation'
import { getClaims, getRoleRedirect } from '@/features/auth/services/auth.server'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const claims = await getClaims()

  if (!claims) {
    redirect('/login')
  }

  const destination = getRoleRedirect(claims.role)
  redirect(destination)
}
