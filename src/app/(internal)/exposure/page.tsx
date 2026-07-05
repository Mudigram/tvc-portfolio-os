import { getPortfolioExposure } from '@/features/exposure/services/portfolio-exposure.service'
import { PortfolioExposureView } from '@/features/exposure/components/PortfolioExposureView'

export const metadata = {
  title: 'Exposure — TVCLabs Portfolio OS',
}

export default async function ExposurePage() {
  const data = await getPortfolioExposure()
  return <PortfolioExposureView data={data} />
}