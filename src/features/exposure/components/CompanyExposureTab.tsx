import ExposureTable from '@/features/exposure/components/ExposureTable'
import { FundingRoundHistoryCard } from './FundingRoundHistoryCard'
import { ExposureRow } from '@/features/companies/types'
import { getHoldersForPicker } from '@/features/exposure/services/holders.service'
import { TVCLABS_HOLDER_IDS } from '@/features/exposure/types'
import type { FundingRound } from '@/features/funding/types'

interface CompanyExposureTabProps {
  companyId: string
  rows: ExposureRow[]
  rounds: FundingRound[]        // ← received from page, not fetched here
}

export default async function CompanyExposureTab({ companyId, rows, rounds }: CompanyExposureTabProps) {
  const holders = await getHoldersForPicker()

  return (
    <div className="space-y-8">
      <FundingRoundHistoryCard rounds={rounds} />
      <div className="space-y-2">
        <div className="mb-6">
          <h2 className="text-sm font-medium text-zinc-900">Economic exposure</h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            All instruments where TVCLabs entities have economic exposure in this company.
          </p>
        </div>
        <ExposureTable
          rows={rows}
          companyId={companyId}
          canEdit={true}
          holders={holders}
          tvcHolderIds={TVCLABS_HOLDER_IDS}
        />
      </div>
    </div>
  )
}