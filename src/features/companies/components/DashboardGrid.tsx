'use client'

import { useState } from 'react'
import Link from 'next/link'
import DashboardCard from '@/features/companies/components/DashboardCard'
import type { CompanyCardData } from '@/features/companies/types'

interface DashboardGridProps {
  companies: CompanyCardData[]
}

export default function DashboardGrid({ companies }: DashboardGridProps) {
  if (companies.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <p className="text-sm font-medium text-zinc-900">No companies yet</p>
        <p className="text-sm text-zinc-400 mt-1">
          Add a company to start tracking portfolio health.
        </p>
      </div>
    )
  }

  const red   = companies.filter((c) => c.portfolio_health === 'Red')
  const amber = companies.filter((c) => c.portfolio_health === 'Amber')
  const green = companies.filter((c) => c.portfolio_health === 'Green')
  const unset = companies.filter((c) => !c.portfolio_health)

  return (
    <div className="space-y-3">
      {red.length > 0 && (
        <CollapsibleSection
          label="Needs attention"
          accentColor="text-red-600"
          dotColor="bg-red-400"
          companies={red}
          defaultOpen={true}
          cap={red.length} // always show all Red
        />
      )}
      {amber.length > 0 && (
        <CollapsibleSection
          label="Monitor closely"
          accentColor="text-amber-600"
          dotColor="bg-amber-400"
          companies={amber}
          defaultOpen={true}
          cap={5}
        />
      )}
      {green.length > 0 && (
        <CollapsibleSection
          label="On track"
          accentColor="text-emerald-600"
          dotColor="bg-emerald-400"
          companies={green}
          defaultOpen={false}
          cap={5}
        />
      )}
      {unset.length > 0 && (
        <CollapsibleSection
          label="Not reviewed"
          accentColor="text-zinc-500"
          dotColor="bg-zinc-300"
          companies={unset}
          defaultOpen={false}
          cap={5}
        />
      )}

      {/* Escape hatch to full portfolio table */}
      <div className="pt-2 flex justify-end">
        <Link
          href="/companies"
          className="text-xs font-medium text-[#1a23bd] hover:underline underline-offset-2 transition-colors"
        >
          View full portfolio table ({companies.length} companies) →
        </Link>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// Collapsible section with optional cap + "show more" toggle
// ─────────────────────────────────────────────────────────────
function CollapsibleSection({
  label,
  accentColor,
  dotColor,
  companies,
  defaultOpen,
  cap,
}: {
  label: string
  accentColor: string
  dotColor: string
  companies: CompanyCardData[]
  defaultOpen: boolean
  cap: number
}) {
  const [open, setOpen]         = useState(defaultOpen)
  const [expanded, setExpanded] = useState(false)

  const visible = open
    ? expanded
      ? companies
      : companies.slice(0, cap)
    : []

  const hasMore = companies.length > cap

  return (
    <div className="border border-zinc-100 rounded-xl bg-white overflow-hidden">
      {/* Section header — always visible, acts as toggle */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-zinc-50/60 transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <span className={`w-2 h-2 rounded-full ${dotColor}`} />
          <span className={`text-xs font-semibold uppercase tracking-wider ${accentColor}`}>
            {label}
          </span>
          <span className="text-xs text-zinc-300 font-medium">{companies.length}</span>
        </div>
        <svg
          className={`w-4 h-4 text-zinc-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Card grid — animated open/close */}
      {open && (
        <div className="px-5 pb-5 border-t border-zinc-50">
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 pt-4">
            {visible.map((company) => (
              <DashboardCard key={company.id} company={company} />
            ))}
          </div>

          {/* Show more / show less */}
          {hasMore && (
            <button
              onClick={() => setExpanded((e) => !e)}
              className="mt-4 w-full py-2 text-xs font-medium text-zinc-400 hover:text-zinc-700 border border-dashed border-zinc-200 rounded-lg transition-colors"
            >
              {expanded
                ? 'Show less ↑'
                : `Show ${companies.length - cap} more ↓`}
            </button>
          )}
        </div>
      )}
    </div>
  )
}