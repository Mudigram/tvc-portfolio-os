'use client'

import { useState, useMemo } from 'react'
import type {
  AngelCompanySummary,
  AngelPortfolioSummary,
  AngelActivityEvent,
} from '@/features/angel-portfolio/types'
import { AngelSummaryBar } from '@/features/angel-portfolio/components/AngelSummaryBar'
import { AngelCompanyCard } from '@/features/angel-portfolio/components/AngelCompanyCard'
import { AngelActivityDrawer } from '@/features/angel-portfolio/components/AngelActivityDrawer'
import { AngelEmptyState } from '@/features/angel-portfolio/components/AngelEmptyState'
import { AngelSignalBanner } from '@/features/angel-portfolio/components/AngelSignalBanner'
import { Search, Printer, SlidersHorizontal } from 'lucide-react'
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

export function AngelPortfolioView({
  companies,
  summary,
  events,
}: AngelPortfolioViewProps) {
  const [activeTab, setActiveTab] = useState<FilterTab>('all')
  const [searchQuery, setSearchQuery] = useState('')

  if (companies.length === 0) {
    return <AngelEmptyState />
  }

  // Memoized filter counts
  const tabCounts = useMemo(() => {
    return {
      all: companies.length,
      'on-track': companies.filter((c) => c.portfolio_health === 'Green').length,
      monitor: companies.filter((c) => c.portfolio_health === 'Amber' || c.portfolio_health === 'Red').length,
      raising: companies.filter((c) => c.is_actively_raising).length,
    }
  }, [companies])

  // Filtered companies based on active tab and search query
  const filtered = useMemo(() => {
    let result = companies
    switch (activeTab) {
      case 'on-track':
        result = result.filter((c) => c.portfolio_health === 'Green')
        break
      case 'monitor':
        result = result.filter((c) => c.portfolio_health === 'Amber' || c.portfolio_health === 'Red')
        break
      case 'raising':
        result = result.filter((c) => c.is_actively_raising)
        break
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim()
      result = result.filter(
        (c) =>
          c.company_name.toLowerCase().includes(q) ||
          (c.sector && c.sector.toLowerCase().includes(q)) ||
          (c.stage && c.stage.toLowerCase().includes(q))
      )
    }

    return result
  }, [companies, activeTab, searchQuery])

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print()
    }
  }

  return (
    <div className="space-y-6 pb-12">

      {/* Page Header with Action Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900">
            Portfolio Overview
          </h1>
          <p className="text-xs sm:text-sm text-zinc-600 mt-1">
            Personal exposure and governance telemetry across your TVCLabs portfolio holdings.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-center">
          <AngelActivityDrawer events={events} />

          <button
            type="button"
            onClick={handlePrint}
            aria-label="Export or print portfolio summary"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-200 bg-white hover:bg-zinc-50 hover:border-zinc-300 text-xs font-semibold text-zinc-700 transition-colors shadow-2xs min-h-[38px] cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5 text-zinc-500" />
            <span className="hidden sm:inline">Export / Print</span>
          </button>
        </div>
      </div>

      {/* Ambient Active Raising Signal Banner */}
      <AngelSignalBanner companies={companies} />

      {/* Carta-style Contiguous Financial Ledger Bar */}
      <AngelSummaryBar summary={summary} />

      {/* Search & Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
        
        {/* Accessible Filter Tabs */}
        <div
          role="tablist"
          aria-label="Filter positions by health and status"
          className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none"
        >
          {TABS.map((tab) => {
            const count = tabCounts[tab.id]
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                role="tab"
                aria-selected={isActive}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all min-h-[38px] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600',
                  isActive
                    ? 'bg-zinc-900 text-white shadow-2xs'
                    : 'bg-white border border-zinc-200 text-zinc-600 hover:border-zinc-300 hover:text-zinc-900'
                )}
              >
                <span>{tab.label}</span>
                <span
                  className={cn(
                    'inline-flex items-center justify-center rounded-full text-[10px] font-bold px-1.5 py-0.2 min-w-4.5',
                    isActive ? 'bg-white/20 text-white' : 'bg-zinc-100 text-zinc-600'
                  )}
                >
                  {count}
                </span>
              </button>
            )
          })}
        </div>

        {/* Quick Search Input */}
        <div className="relative sm:w-64">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by company or sector..."
            aria-label="Search portfolio companies"
            className="w-full bg-white border border-zinc-200 rounded-xl pl-9 pr-3 py-2 text-xs font-medium text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all min-h-[38px] shadow-2xs"
          />
        </div>

      </div>

      {/* Dossier Cards Full-Width Grid */}
      {filtered.length === 0 ? (
        <div className="bg-white border border-zinc-200/80 rounded-2xl p-12 text-center shadow-xs">
          <SlidersHorizontal className="w-8 h-8 text-zinc-300 mx-auto mb-3" />
          <p className="text-sm font-semibold text-zinc-800">No portfolio companies match your criteria</p>
          <p className="text-xs text-zinc-500 mt-1">Try clearing your search query or switching filter tabs.</p>
          {(searchQuery || activeTab !== 'all') && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('')
                setActiveTab('all')
              }}
              className="mt-4 px-3 py-1.5 rounded-lg border border-zinc-200 text-xs font-semibold text-zinc-700 hover:bg-zinc-50"
            >
              Reset Filters
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((company) => (
            <AngelCompanyCard key={company.company_id} company={company} />
          ))}
        </div>
      )}

    </div>
  )
}
