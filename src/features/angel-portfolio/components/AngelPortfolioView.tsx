'use client'

import type {
  AngelCompanySummary,
  AngelPortfolioSummary,
  AngelActivityEvent,
} from '@/features/angel-portfolio/types'
import { AngelSummaryBar } from '@/features/angel-portfolio/components/AngelSummaryBar'
import { AngelCompanyCard } from '@/features/angel-portfolio/components/AngelCompanyCard'
import { AngelActivityFeed } from '@/features/angel-portfolio/components/AngelActivityFeed'
import { AngelEmptyState } from '@/features/angel-portfolio/components/AngelEmptyState'
import { AngelSignalBanner } from '@/features/angel-portfolio/components/AngelSignalBanner'
import { AngelPulseRibbon } from '@/features/angel-portfolio/components/detail/AngelPulseRibbon'

interface AngelPortfolioViewProps {
  companies: AngelCompanySummary[]
  summary: AngelPortfolioSummary
  events: AngelActivityEvent[]
}


function Section({
  label,
  count,
  companies,
}: {
  label: string
  count: number
  companies: AngelCompanySummary[]
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-baseline gap-2">
        <h2 className="text-xs font-medium text-zinc-400 uppercase tracking-wide">
          {label}
        </h2>
        <span className="text-xs text-zinc-300">{count}</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {companies.map((company) => (
          <AngelCompanyCard key={company.company_id} company={company} />
        ))}
      </div>
    </div>
  )
}

export function AngelPortfolioView({
  companies,
  summary,
  events,
}: AngelPortfolioViewProps) {
  if (companies.length === 0) {
    return <AngelEmptyState />
  }

  const red   = companies.filter((c) => c.portfolio_health === 'Red')
  const amber = companies.filter((c) => c.portfolio_health === 'Amber')
  const green = companies.filter((c) => c.portfolio_health === 'Green')
  const unset = companies.filter((c) => !c.portfolio_health)

  return (
    // Responsive layout:
    // Mobile — single column, activity feed below portfolio
    // Desktop — portfolio takes 2/3, activity feed takes 1/3 on the right
    <div className="space-y-8">

      {/* Page header */}
      <div>
  <h1 className="text-lg font-medium text-zinc-900">My Portfolio</h1>
  <p className="text-sm text-zinc-400 mt-0.5">
    Your personal positions across TVCLabs portfolio companies.
  </p>
</div>
<AngelSignalBanner companies={companies} />

      {/* Summary bar */}
      <AngelSummaryBar summary={summary} />

      {/* Main content — responsive split */}
      <div className="flex flex-col lg:flex-row gap-10">

        {/* Portfolio grid — left / full on mobile */}
        <div className="flex-1 min-w-0 space-y-8">
          {red.length > 0 && (
            <Section label="Needs attention" count={red.length} companies={red} />
          )}
          {amber.length > 0 && (
            <Section label="Monitor closely" count={amber.length} companies={amber} />
          )}
          {green.length > 0 && (
            <Section label="On track" count={green.length} companies={green} />
          )}
          {unset.length > 0 && (
            <Section label="Not yet reviewed" count={unset.length} companies={unset} />
          )}
        </div>

          
        {/* Activity feed — right on desktop, below on mobile */}
        <div className="w-full lg:w-72 shrink-0">
          <div className="lg:sticky lg:top-8 space-y-4">
          <AngelPulseRibbon events={events} />
            <h2 className="text-xs font-medium text-zinc-400 uppercase tracking-wide">
              Recent activity
            </h2>
            <AngelActivityFeed events={events} />
          </div>
        </div>

      </div>

    </div>
  )
}