import type { FounderCompanyData } from '@/features/founder-portal/types'
import { FounderCompanyHeader } from '@/features/founder-portal/components/FounderCompanyHeader'
import { FounderPositionCard } from '@/features/founder-portal/components/FounderPositionCard'
import { FounderFundingForm } from '@/features/founder-portal/components/FounderFundingForm'
import { FounderDDRStatus } from '@/features/founder-portal/components/FounderDDRStatus'
import CompanyUpdatesTab from '@/features/monthly-updates/components/CompanyUpdatesTab'

interface FounderCompanyViewProps {
  data: FounderCompanyData
}

export function FounderCompanyView({ data }: FounderCompanyViewProps) {
  return (
    <div className="space-y-10 max-w-2xl">

      <FounderCompanyHeader identity={data.identity} />

      <div className="border-t border-zinc-100" />

      {/* My position */}
      <section className="space-y-3">
        <h2 className="text-xs font-medium text-zinc-400 uppercase tracking-wide">
          My position
        </h2>
        <FounderPositionCard positions={data.positions} />
      </section>

      <div className="border-t border-zinc-100" />

      {/* Monthly POEM update — the core write action */}
      <section className="space-y-3">
        <h2 className="text-xs font-medium text-zinc-400 uppercase tracking-wide">
          Monthly update
        </h2>
        <CompanyUpdatesTab companyId={data.identity.id} />
      </section>

      <div className="border-t border-zinc-100" />

      {/* Funding status */}
      <section className="space-y-3">
        <h2 className="text-xs font-medium text-zinc-400 uppercase tracking-wide">
          Funding status
        </h2>
        <FounderFundingForm companyId={data.identity.id} current={data.funding} />
      </section>

      <div className="border-t border-zinc-100" />

      {/* DDR — thin status only */}
      <section className="space-y-3">
        <h2 className="text-xs font-medium text-zinc-400 uppercase tracking-wide">
          Due diligence verification
        </h2>
        <FounderDDRStatus ddr={data.ddr} />
      </section>

    </div>
  )
}