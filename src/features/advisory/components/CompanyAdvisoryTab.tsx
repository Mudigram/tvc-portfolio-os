import { getCompanyAdvisoryData } from '../services/advisory.service'
import AdvisoryTabView from './AdvisoryTabView'

interface CompanyAdvisoryTabProps {
  companyId: string
}

export default async function CompanyAdvisoryTab({ companyId }: CompanyAdvisoryTabProps) {
  const { activities, roster } = await getCompanyAdvisoryData(companyId)

  return (
    <AdvisoryTabView
      companyId={companyId}
      activities={activities}
      roster={roster}
    />
  )
}