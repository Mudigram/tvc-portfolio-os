import { notFound, redirect } from 'next/navigation'
import { getClaims } from '@/features/auth/services/auth.server'
import { getAngelCompanyDetail } from '@/features/angel-portfolio/services/angel-portfolio.service'
import { AngelCompanyDetailView } from '@/features/angel-portfolio/components/detail/AngelCompanyDetailView'

interface AngelCompanyPageProps {
  params: Promise<{ companyId: string }>
}

export async function generateMetadata({ params }: AngelCompanyPageProps) {
  const { companyId } = await params
  const claims = await getClaims()
  if (!claims) return { title: 'Investment Detail' }
  const detail = await getAngelCompanyDetail(claims.userId, companyId)
  return {
    title: detail?.company_name ? `${detail.company_name} — Investment Detail` : 'Investment Detail',
  }
}

export default async function AngelCompanyPage({ params }: AngelCompanyPageProps) {
  const { companyId } = await params
  const claims = await getClaims()
  if (!claims) redirect('/login')

  const detail = await getAngelCompanyDetail(claims.userId, companyId)
  if (!detail) notFound()

  return <AngelCompanyDetailView detail={detail} />
}