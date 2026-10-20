import { redirect } from 'next/navigation'
import { getClaims } from '@/features/auth/services/auth.server'
import { getAngelProfile } from '@/features/angel-portfolio/services/angel-portfolio.service'
import { AngelProfileView } from '@/features/angel-portfolio/components/AngelProfileView'

export const metadata = {
  title: 'Investor Profile — TVCLabs Portfolio OS',
}

export default async function AngelProfilePage() {
  const claims = await getClaims()
  if (!claims) redirect('/login')

  const profile = await getAngelProfile(claims.userId, claims.email)

  return <AngelProfileView profile={profile} />
}