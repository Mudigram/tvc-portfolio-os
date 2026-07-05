import { getClaims } from '@/features/auth/services/auth.server'
import { redirect } from 'next/navigation'
import {
  getAngelPortfolio,
  getAngelActivityFeed,
} from '@/features/angel-portfolio/services/angel-portfolio.service'
import { AngelPortfolioView } from '@/features/angel-portfolio/components/AngelPortfolioView'

export const metadata = {
  title: 'My Portfolio — TVCLabs',
}

export default async function AngelPortfolioPage() {
  const claims = await getClaims()
  if (!claims) redirect('/login')

  const [{ companies, summary }, events] = await Promise.all([
    getAngelPortfolio(claims.userId),
    getAngelActivityFeed(claims.userId),
  ])

  return (
    <AngelPortfolioView
      companies={companies}
      summary={summary}
      events={events}
    />
  )
}