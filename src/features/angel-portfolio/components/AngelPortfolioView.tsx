'use client'

import { useState } from 'react'
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
import { cn } from '@/lib/utils'

interface AngelPortfolioViewProps {
  companies: AngelCompanySummary[]
  summary: AngelPortfolioSummary
  events: AngelActivityEvent[]
}

type FilterTab = 'all' | 'on-track' | 'monitor' | 'raising'

const TABS: { id: FilterTab; label: string }[] = [
  { id: 'all', label: 'All positions' },
  { id: 'on-track', label: 'On track' },
  { id: 'monitor', label: 'Monitor' },
  { id: 'raising', label: 'Actively raising' },
]

function applyFilter(companies: AngelCompanySummary[], tab: FilterTab): AngelCompanySummary[] {
  switch (tab) {
    case 'on-track':  return companies.filter((c) => c.portfolio_health === 'Green')
    case 'monitor':   return companies.filter((c) => c.portfolio_health === 'Amber' || c.portfolio_health === 'Red')
    case 'raising':   return companies.filter((c) => c.is_actively_raising)
    default:          return companies
  }
}

export function AngelPortfolioView({
  companies,
  summary,
  events,
}: AngelPortfolioViewProps) {
  const [activeTab, setActiveTab] = useState<FilterTab>('all')

  if (companies.length === 0) {
    return <AngelEmptyState />
  }

  const filtered = applyFilter(companies, activeTab)

  return (
    <div className="space-y-8">

      {/* Page header */}
      <div>
        <h1 className="text-lg font-medium text-zinc-900">My Portfolio</h1>
        <p className="text-sm text-zinc-400 mt-0.5">
          Your personal positions across TVCLabs portfolio companies.
        </p>
      </div>

      <AngelSignalBanner companies={companies} />

      {/* KPI Tiles */}
      <AngelSummaryBar summary={summary} />

      {/* Main content — responsive split */}
      <div className="flex flex-col lg:flex-row gap-10">

        {/* Portfolio grid — left / full on mobile */}
        <div className="flex-1 min-w-0 space-y-5">

          {/* Filter tabs */}
          <div className="flex items-center gap-1 overflow-x-auto pb-0.5 scrollbar-none">
            {TABS.map((tab) => {
              const count = applyFilter(companies, tab.id).length
              const isActive = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors',
                    isActive
                      ? 'bg-zinc-900 text-white'
                      : 'bg-white border border-zinc-200 text-zinc-500 hover:border-zinc-300 hover:text-zinc-700'
                  )}
                >
                  {tab.label}
                  <span className={cn(
                    'inline-flex items-center justify-center rounded-full text-[10px] font-semibold w-4 h-4',
                    isActive ? 'bg-white/20 text-white' : 'bg-zinc-100 text-zinc-500'
                  )}>
                    {count}
                  </span>
                </button>
              )
            })}
          </div>

          {/* Cards */}
          {filtered.length === 0 ? (
            <p className="text-sm text-zinc-400 py-6">No companies match this filter.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {filtered.map((company) => (
                <AngelCompanyCard key={company.company_id} company={company} />
              ))}
            </div>
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