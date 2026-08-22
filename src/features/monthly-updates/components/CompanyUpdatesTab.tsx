import {
  getCompanyUpdates,
  getCompanyReportingTargets,
  computeUpdateStatus,
} from '@/features/monthly-updates/services/monthly-updates.service'
import { UpdatesTabView } from '@/features/monthly-updates/components/UpdatesTabView'

interface CompanyUpdatesTabProps {
  companyId: string
}

export default async function CompanyUpdatesTab({ companyId }: CompanyUpdatesTabProps) {
  const [updates, targets] = await Promise.all([
    getCompanyUpdates(companyId),
    getCompanyReportingTargets(companyId),
  ])
  const status = computeUpdateStatus(updates)

  return (
    <UpdatesTabView
      companyId={companyId}
      updates={updates}
      status={status}
      targets={targets}
    />
  )
}