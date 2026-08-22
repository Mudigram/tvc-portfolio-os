'use client'

import { useState } from 'react'
import Link from 'next/link'
import type { CompanyCardData } from '@/features/companies/types'
import { AddCompanyForm } from '@/features/companies/components/AddCompanyForm'
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { X } from "lucide-react"
import { getCompanyLogoUrl } from '@/features/companies/services/logo'

const HEALTH_COLORS: Record<string, string> = {
  Green: 'text-emerald-700 bg-emerald-50/60',
  Amber: 'text-amber-700 bg-amber-50/60',
  Red:   'text-red-700 bg-red-50/60',
}

const PAGE_SIZE = 10

interface CompaniesListViewProps {
  companies: CompanyCardData[]
}

export function CompaniesListView({ companies }: CompaniesListViewProps) {
  const [search, setSearch]             = useState('')
  const [healthFilter, setHealthFilter] = useState<string>('All')
  const [sectorFilter, setSectorFilter] = useState<string>('All')
  const [showAddForm, setShowAddForm]   = useState(false)
  const [page, setPage]                 = useState(1)

  const sectors = ['All', ...Array.from(
    new Set(companies.map((c) => c.sector).filter(Boolean))
  ) as string[]]

  const filtered = companies.filter((c) => {
    const matchesSearch = c.name.toLowerCase().includes(search.toLowerCase())
    const matchesHealth =
      healthFilter === 'All' || c.portfolio_health === healthFilter ||
      (healthFilter === 'Not set' && !c.portfolio_health)
    const matchesSector = sectorFilter === 'All' || c.sector === sectorFilter
    return matchesSearch && matchesHealth && matchesSector
  })

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage   = Math.min(page, totalPages)
  const pageStart  = (safePage - 1) * PAGE_SIZE
  const paginated  = filtered.slice(pageStart, pageStart + PAGE_SIZE)

  // Reset to page 1 whenever a filter changes
  function applySearch(val: string)  { setSearch(val);       setPage(1) }
  function applyHealth(val: string)  { setHealthFilter(val); setPage(1) }
  function applySector(val: string)  { setSectorFilter(val); setPage(1) }
  function resetAll()                { setSearch(''); setHealthFilter('All'); setSectorFilter('All'); setPage(1) }

  return (
    <div className="space-y-8 max-w-[1600px] mx-auto py-4">

      {/* Header Section */}
      <div className="flex items-end justify-between border-b border-zinc-100 pb-6">
        <div>
          <h1 className="text-xl font-semibold text-zinc-900 tracking-tight">Portfolio Asset Directory</h1>
          <p className="text-xs text-zinc-400 mt-1 uppercase tracking-wider font-medium">
            {companies.length} Ecosystem Economic Exposures
          </p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="inline-flex items-center justify-center h-8 px-3.5 text-xs font-semibold text-white bg-[#1a23bd] rounded hover:bg-[#151c9a] transition-colors shadow-sm"
        >
          Add Company
        </button>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-zinc-100">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full sm:w-auto">

          <div className="relative w-full sm:w-72">
            <Input
              type="text"
              placeholder="Filter by asset name…"
              value={search}
              onChange={(e) => applySearch(e.target.value)}
              className="h-10 text-sm text-zinc-900 bg-transparent border-0 border-b border-zinc-200 rounded-none px-0 tracking-wide placeholder:text-zinc-400 focus-visible:ring-0 focus-visible:border-zinc-900 transition-colors shadow-none"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider whitespace-nowrap">Health:</span>
            <Select value={healthFilter} onValueChange={applyHealth}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="All Profiles" />
              </SelectTrigger>
              <SelectContent className="bg-white border border-zinc-100 rounded-md shadow-md">
                {['All', 'Green', 'Amber', 'Red', 'Not set'].map((h) => (
                  <SelectItem key={h} value={h} className="text-sm font-medium focus:bg-zinc-50 cursor-pointer">
                    {h === 'All' ? 'All Profiles' : h}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider whitespace-nowrap">Sector:</span>
            <Select value={sectorFilter} onValueChange={applySector}>
              <SelectTrigger className="w-44">
                <SelectValue placeholder="All Sectors" />
              </SelectTrigger>
              <SelectContent className="bg-white border border-zinc-100 rounded-md shadow-md">
                {sectors.map((s) => (
                  <SelectItem key={s} value={s} className="text-sm font-medium focus:bg-zinc-50 cursor-pointer">
                    {s === 'All' ? 'All Sectors' : s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {(search || healthFilter !== 'All' || sectorFilter !== 'All') && (
          <Button
            variant="ghost"
            size="sm"
            onClick={resetAll}
            className="h-9 px-3 text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50/50 transition-colors gap-1.5"
          >
            <X className="w-3.5 h-3.5 stroke-[2.5]" />
            Reset Criteria
          </Button>
        )}
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="py-24 text-center">
          <p className="text-sm font-medium text-zinc-500">No assets matching your criteria</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left border-collapse">
            <thead>
              <tr className="border-b border-zinc-200">
                {['Company Asset', 'Sector', 'Current Stage', 'Health Profile', 'Cycle Compliance', 'Funding Status', 'Exit Signal'].map((col, idx) => (
                  <th
                    key={col}
                    className={`pb-3 text-[11px] font-bold text-zinc-400 uppercase tracking-wider whitespace-nowrap ${idx === 0 ? 'pl-4' : 'px-4'}`}
                  >
                    {col}
                  </th>
                ))}
                <th className="pb-3 pr-4 text-right text-[11px] font-bold text-zinc-400 uppercase tracking-wider whitespace-nowrap">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {paginated.map((company) => (
                <tr key={company.id} className="group hover:bg-zinc-50/40 transition-colors relative">

                  <td className="py-3 pl-4 pr-4 whitespace-nowrap relative">
                    <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-transparent group-hover:bg-[#1a23bd] transition-colors" />
                    <Link href={`/companies/${company.id}`} className="flex items-center gap-3 hover:text-[#1a23bd] transition-colors">
                      {/* Logo avatar */}
                      {(() => {
                        const logoUrl = getCompanyLogoUrl({ logo_path: company.logo_path, logo_url: company.logo_url })
                        const initials = company.name.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase()
                        return logoUrl ? (
                          <img
                            src={logoUrl}
                            alt={company.name}
                            className="w-7 h-7 rounded-md border border-zinc-100 object-contain bg-white shrink-0"
                          />
                        ) : (
                          <div className="w-7 h-7 rounded-md border border-zinc-100 bg-zinc-50 flex items-center justify-center shrink-0">
                            <span className="text-[10px] font-bold text-zinc-400">{initials}</span>
                          </div>
                        )
                      })()}
                      <span className="font-semibold text-zinc-900 text-sm">{company.name}</span>
                    </Link>
                  </td>

                  <td className="py-4 px-4 text-zinc-600 whitespace-nowrap font-medium">
                    {company.sector ?? <span className="text-zinc-300">—</span>}
                  </td>

                  <td className="py-4 px-4 text-zinc-500 whitespace-nowrap text-xs font-mono">
                    {company.stage ?? '—'}
                  </td>

                  <td className="py-4 px-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border border-transparent ${company.portfolio_health ? HEALTH_COLORS[company.portfolio_health] : 'text-zinc-400 bg-zinc-50'}`}>
                      <span className={`w-1 h-1 rounded-full mr-1.5 ${
                        company.portfolio_health === 'Green' ? 'bg-emerald-600' :
                        company.portfolio_health === 'Amber' ? 'bg-amber-500' :
                        company.portfolio_health === 'Red'   ? 'bg-red-600' : 'bg-zinc-400'
                      }`} />
                      {company.portfolio_health ?? 'Not Tracked'}
                    </span>
                  </td>

                  <td className="py-4 px-4 whitespace-nowrap">
                    {company.update_submitted_this_cycle ? (
                      <span className="text-xs text-emerald-600 font-medium">Clear / Submitted</span>
                    ) : (
                      <span className="text-xs text-rose-600 font-semibold tracking-wide">Action Required</span>
                    )}
                  </td>

                  <td className="py-4 px-4 whitespace-nowrap">
                    {company.is_actively_raising ? (
                      <span className="text-xs text-amber-700 font-semibold bg-amber-50 px-1.5 py-0.5 rounded">Actively Raising</span>
                    ) : (
                      <span className="text-xs text-zinc-400 font-normal">Fully Capitalized</span>
                    )}
                  </td>

                  <td className="py-4 px-4 text-zinc-700 font-mono text-xs whitespace-nowrap">
                    {company.exit_readiness_signal ? (
                      <span className="font-semibold">{company.exit_readiness_signal}</span>
                    ) : (
                      <span className="text-zinc-300">—</span>
                    )}
                  </td>

                  <td className="py-4 pr-4 text-right whitespace-nowrap">
                    <Link href={`/companies/${company.id}`} className="text-xs font-bold text-zinc-400 hover:text-[#1a23bd] transition-colors">
                      Manage
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Pagination bar ─────────────────────────────────── */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-zinc-100 pt-4">

          {/* Range label */}
          <p className="text-xs text-zinc-400">
            Showing{' '}
            <span className="font-semibold text-zinc-700">{pageStart + 1}–{Math.min(pageStart + PAGE_SIZE, filtered.length)}</span>
            {' '}of{' '}
            <span className="font-semibold text-zinc-700">{filtered.length}</span>
            {' '}companies
          </p>

          {/* Page controls */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={safePage === 1}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-zinc-600 border border-zinc-200 rounded-md hover:bg-zinc-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              ← Prev
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={`w-8 h-8 text-xs font-semibold rounded-md transition-colors ${
                  p === safePage
                    ? 'bg-[#1a23bd] text-white'
                    : 'text-zinc-500 hover:bg-zinc-50 border border-zinc-200'
                }`}
              >
                {p}
              </button>
            ))}

            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={safePage === totalPages}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-zinc-600 border border-zinc-200 rounded-md hover:bg-zinc-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Next →
            </button>
          </div>
        </div>
      )}

      {showAddForm && (
        <AddCompanyForm onClose={() => setShowAddForm(false)} />
      )}
    </div>
  )
}