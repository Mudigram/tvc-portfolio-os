'use client'

import { useState } from 'react'
import Link from 'next/link'
import DashboardCard from '@/features/companies/components/DashboardCard'
import type { CompanyCardData } from '@/features/companies/types'
import { ChevronDown, ArrowRight } from 'lucide-react'

interface DashboardGridProps {
  companies: CompanyCardData[]
}

export default function DashboardGrid({ companies }: DashboardGridProps) {
  if (companies.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center bg-white rounded-2xl border border-zinc-200/80 p-8 shadow-xs">
        <p className="text-sm font-medium text-zinc-900">No companies recorded</p>
        <p className="text-xs text-zinc-500 mt-1">
          Add a company to start tracking portfolio health and governance.
        </p>
      </div>
    )
  }

  const red   = companies.filter((c) => c.portfolio_health === 'Red')
  const amber = companies.filter((c) => c.portfolio_health === 'Amber')
  const green = companies.filter((c) => c.portfolio_health === 'Green')
  const unset = companies.filter((c) => !c.portfolio_health)

  return (
    <div className="space-y-4">
      {red.length > 0 && (
        <CollapsibleSection
          label="Needs attention"
          accentColor="text-rose-800"
          dotColor="bg-rose-500"
          companies={red}
          defaultOpen={true}
          cap={red.length} // always show all Red
        />
      )}
      {amber.length > 0 && (
        <CollapsibleSection
          label="Monitor closely"
          accentColor="text-amber-800"
          dotColor="bg-amber-400"
          companies={amber}
          defaultOpen={true}
          cap={6}
        />
      )}
      {green.length > 0 && (
        <CollapsibleSection
          label="On track"
          accentColor="text-emerald-800"
          dotColor="bg-emerald-500"
          companies={green}
          defaultOpen={false}
          cap={6}
        />
      )}
      {unset.length > 0 && (
        <CollapsibleSection
          label="Not reviewed"
          accentColor="text-zinc-600"
          dotColor="bg-zinc-300"
          companies={unset}
          defaultOpen={false}
          cap={6}
        />
      )}

      {/* Escape hatch to full portfolio table */}
      <div className="pt-2 flex justify-end">
        <Link
          href="/companies"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-700 hover:text-zinc-950 transition-colors"
        >
          <span>View full portfolio table ({companies.length} companies)</span>
          <ArrowRight className="w-3.5 h-3.5" />
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
    <div className="border border-zinc-200/80 rounded-2xl bg-white overflow-hidden shadow-2xs">
      {/* Section header — always visible, acts as toggle */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-zinc-50/50 transition-colors cursor-pointer"
      >
        <div className="flex items-center gap-2.5">
          <span className={`w-2 h-2 rounded-full ${dotColor}`} />
          <span className={`text-xs font-medium ${accentColor}`}>
            {label}
          </span>
          <span className="text-xs font-mono text-zinc-400 tabular-nums">({companies.length})</span>
        </div>
        <ChevronDown
          className={`w-4 h-4 text-zinc-400 transition-transform duration-150 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Card grid — animated open/close */}
      {open && (
        <div className="px-5 pb-5 border-t border-zinc-100">
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 pt-4">
            {visible.map((company) => (
              <DashboardCard key={company.id} company={company} />
            ))}
          </div>

          {/* Show more / show less */}
          {hasMore && (
            <button
              type="button"
              onClick={() => setExpanded((e) => !e)}
              className="mt-4 w-full py-2 text-xs font-medium text-zinc-500 hover:text-zinc-800 border border-zinc-200 rounded-lg hover:bg-zinc-50 transition-colors"
            >
              {expanded
                ? 'Show fewer positions ↑'
                : `Show ${companies.length - cap} more positions ↓`}
            </button>
          )}
        </div>
      )}
    </div>
  )
}
