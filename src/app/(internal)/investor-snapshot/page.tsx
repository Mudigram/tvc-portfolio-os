import { getHolderSnapshot, getPortfolioShowcase } from '@/features/investor-snapshot/services/investor-snapshot.service'
import { getHoldersForPicker } from '@/features/exposure/services/holders.service'
import InvestorSnapshotView from '@/features/investor-snapshot/components/InvestorSnapshotView'
import type { SnapshotMode } from '@/features/investor-snapshot/types'

export const metadata = {
  title: 'Investor View — TVCLabs Portfolio OS',
  description:
    'Generate presentation-ready portfolio position snapshots for existing and prospective investors.',
}

interface Props {
  searchParams: Promise<{
    mode?: string
    holder_id?: string
    as_of?: string
  }>
}

export default async function InvestorSnapshotPage({ searchParams }: Props) {
  const params = await searchParams

  // Resolve mode from URL param — default to position_statement
  const mode: SnapshotMode =
    params.mode === 'showcase' ? 'portfolio_showcase' : 'position_statement'

  const rawHolderId = params.holder_id
  const asOf = params.as_of

  // Always load the holders list for the picker dropdown
  const holders = await getHoldersForPicker()

  // Default to first investor in picker list if mode is position_statement and no holder_id passed in URL
  const effectiveHolderId =
    rawHolderId || (mode === 'position_statement' && holders.length > 0 ? holders[0].id : undefined)

  // Fetch snapshot data depending on mode + params
  const [holderSnapshot, portfolioShowcase] = await Promise.all([
    mode === 'position_statement' && effectiveHolderId
      ? getHolderSnapshot(effectiveHolderId, asOf)
      : Promise.resolve(null),
    mode === 'portfolio_showcase'
      ? getPortfolioShowcase(asOf)
      : Promise.resolve(null),
  ])

  return (
    <InvestorSnapshotView
      holders={holders}
      initialMode={mode}
      initialHolderId={effectiveHolderId}
      initialAsOf={asOf}
      holderSnapshot={holderSnapshot}
      portfolioShowcase={portfolioShowcase}
    />
  )
}
