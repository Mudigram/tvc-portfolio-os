'use client'

import { useState } from 'react'
import type { CompanyProfile, ExposureRow } from '@/features/companies/types'
import CompanyOverviewTab from '@/features/companies/components/CompanyOverviewTab'


// Loaded dynamically — it is a server component doing its own data fetch


const TABS = [
  'Overview',
  'Exposure',
  'Updates',
  'Cap Tables',
  'Funding',
  'Advisory',
  'DDR',
  'Exit Readiness',
] as const

type Tab = typeof TABS[number]

interface CompanyTabsProps {
  company: CompanyProfile
  exposureRows: ExposureRow[]
  updatesTabElement: React.ReactNode
  fundingTabElement: React.ReactNode // 🟢 Add this slot
  advisoryTabElement: React.ReactNode;
  exposureTabElement: React.ReactNode
  exitTabElement: React.ReactNode;
  ddrTabElement: React.ReactNode;
  captableTabElement: React.ReactNode;
}


function TabLoading() {
  return (
    <div className="py-24 flex items-center justify-center">
      <p className="text-sm text-zinc-400">Loading…</p>
    </div>
  )
}

export default function CompanyTabs({ company, exposureRows, updatesTabElement, fundingTabElement, advisoryTabElement, exitTabElement, ddrTabElement, captableTabElement, exposureTabElement }: CompanyTabsProps) {
  const [active, setActive] = useState<Tab>('Overview')

  return (
    <div className="space-y-8">
      {/* Tab bar */}
      <div className="flex items-center gap-0.5 border-b border-zinc-100">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActive(tab)}
            className={`
              px-4 py-2.5 text-sm transition-colors relative
              ${active === tab
                ? 'text-zinc-900 font-medium'
                : 'text-zinc-400 hover:text-zinc-700'
              }
            `}
          >
            {tab}
            {active === tab && (
              <span className="absolute bottom-0 left-0 right-0 h-px bg-[#1a23bd]" />
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div>
        {active === 'Overview'       && <CompanyOverviewTab company={company} />}
        {active === 'Exposure'       && exposureTabElement}
        {active === 'Updates'        && updatesTabElement} {/* Render the slot node here */}
        {active === 'Funding'        && fundingTabElement}
        {active === 'Cap Tables'     && captableTabElement}
        {active === 'Advisory'       && advisoryTabElement}
        {active === 'DDR'            && ddrTabElement}
        {active === 'Exit Readiness' && exitTabElement}
      </div>
    </div>
  )
}