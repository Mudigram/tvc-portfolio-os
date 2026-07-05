import { notFound, redirect } from 'next/navigation'
import { getClaims } from '@/features/auth/services/auth.server'
import { getAngelCompanyDetail } from '@/features/angel-portfolio/services/angel-portfolio.service'
import { AngelCompanyDetailView } from '@/features/angel-portfolio/components/detail/AngelCompanyDetailView'

interface AngelCompanyPageProps {
  params: Promise<{ companyId: string }>
}

export default async function AngelCompanyPage({ params }: AngelCompanyPageProps) {
  const { companyId } = await params
  const claims = await getClaims()
  if (!claims) redirect('/login')

  const detail = await getAngelCompanyDetail(claims.userId, companyId)
  if (!detail) notFound()

  return <AngelCompanyDetailView detail={detail} />
}