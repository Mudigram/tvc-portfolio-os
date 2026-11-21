import {
  getCompanyUpdates,
  getCompanyReportingTargets,
  computeUpdateStatus,
} from '@/features/monthly-updates/services/monthly-updates.service'
import { UpdatesTabView } from '@/features/monthly-updates/components/UpdatesTabView'

interface CompanyUpdatesTabProps {
  companyId: string
  companyName?: string
}

export default async function CompanyUpdatesTab({ companyId, companyName }: CompanyUpdatesTabProps) {
  const [updates, targets] = await Promise.all([
    getCompanyUpdates(companyId),
    getCompanyReportingTargets(companyId),
  ])
  const status = computeUpdateStatus(updates)

  return (
    <UpdatesTabView
      companyId={companyId}
      companyName={companyName}
      updates={updates}
      status={status}
      targets={targets}
    />
  )
}
