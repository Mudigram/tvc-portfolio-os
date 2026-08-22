import { getCompanyExitReadiness } from '../services/exit-readiness.service'
import ExitReadinessTabView from './ExitReadinessTabView'

interface CompanyExitReadinessTabProps {
  companyId: string
}

export default async function CompanyExitReadinessTab({ companyId }: CompanyExitReadinessTabProps) {
  const data = await getCompanyExitReadiness(companyId)

  return (
    <ExitReadinessTabView
      companyId={companyId}
      initialData={data}
    />
  )
}