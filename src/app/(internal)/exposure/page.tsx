import { getPortfolioExposure } from '@/features/exposure/services/portfolio-exposure.service'
import { PortfolioExposureView } from '@/features/exposure/components/PortfolioExposureView'

export const metadata = {
  title: 'Exposure — TVCLabs Portfolio OS',
}

interface ExposurePageProps {
  searchParams: Promise<{ as_of?: string }>
}

export default async function ExposurePage({ searchParams }: ExposurePageProps) {
  const resolvedSearchParams = await searchParams
  const asOf = resolvedSearchParams?.as_of
  const data = await getPortfolioExposure(asOf)

  return <PortfolioExposureView data={data} asOfDate={asOf} />
}