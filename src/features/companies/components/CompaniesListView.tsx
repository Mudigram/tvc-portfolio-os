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

const HEALTH_COLORS: Record<string, string> = {
  Green: 'text-emerald-700 bg-emerald-50/60',
  Amber: 'text-amber-700 bg-amber-50/60',
  Red:   'text-red-700 bg-red-50/60',
}

interface CompaniesListViewProps {
  companies: CompanyCardData[]
}

export function CompaniesListView({ companies }: CompaniesListViewProps) {
  const [search, setSearch] = useState('')
  const [healthFilter, setHealthFilter] = useState<string>('All')
  const [sectorFilter, setSectorFilter] = useState<string>('All')
  const [showAddForm, setShowAddForm] = useState(false)

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
          className="
            inline-flex items-center justify-center h-8 px-3.5 text-xs font-semibold text-white bg-[#1a23bd]
            rounded hover:bg-[#151c9a] transition-colors shadow-sm
          "
        >
          Add Company
        </button>
      </div>

      {/* Inline Toolbar (Frameless Filters) */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-zinc-100">
  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full sm:w-auto">
    
    {/* Scaled Minimal Search Input */}
    <div className="relative w-full sm:w-72">
      <Input
        type="text"
        placeholder="Filter by asset name…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="
          h-10 text-sm text-zinc-900 bg-transparent
          border-0 border-b border-zinc-200 rounded-none px-0 tracking-wide
          placeholder:text-zinc-400 focus-visible:ring-0 
          focus-visible:border-zinc-900 transition-colors shadow-none
        "
      />
    </div>

    {/* Shadcn Health Profile Select Dropdown */}
    <div className="flex items-center gap-2">
      <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider whitespace-nowrap">
        Health:
      </span>
      <Select value={healthFilter} onValueChange={(value) => setHealthFilter(value)}>
        <SelectTrigger className="h-10 w-40 border-0 border-b border-zinc-200 rounded-none bg-transparent px-1 font-medium text-zinc-800 text-sm shadow-none focus:ring-0 focus-visible:ring-0 focus:border-zinc-900 transition-colors">
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

    {/* Shadcn Sector Profile Select Dropdown */}
    <div className="flex items-center gap-2">
      <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider whitespace-nowrap">
        Sector:
      </span>
      <Select value={sectorFilter} onValueChange={(value) => setSectorFilter(value)}>
        <SelectTrigger className="h-10 w-44 border-0 border-b border-zinc-200 rounded-none bg-transparent px-1 font-medium text-zinc-800 text-sm shadow-none focus:ring-0 focus-visible:ring-0 focus:border-zinc-900 transition-colors">
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

  {/* Clear Action Button Trigger */}
  {(search || healthFilter !== 'All' || sectorFilter !== 'All') && (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => { setSearch(''); setHealthFilter('All'); setSectorFilter('All') }}
      className="h-9 px-3 text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50/50 transition-colors gap-1.5"
    >
      <X className="w-3.5 h-3.5 stroke-[2.5]" />
      Reset Criteria
    </Button>
  )}
</div>

      {/* Main Grid View */}
      {filtered.length === 0 ? (
        <div className="py-24 text-center">
          <p className="text-sm font-medium text-zinc-500">No assets track matching variables</p>
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
              {filtered.map((company) => (
                <tr key={company.id} className="group hover:bg-zinc-50/40 transition-colors relative">
                  
                  {/* Left Highlight Stroke and Company Link */}
                  <td className="py-4 pl-4 pr-4 font-semibold text-zinc-900 whitespace-nowrap relative">
                    <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-transparent group-hover:bg-[#1a23bd] transition-colors" />
                    <Link
                      href={`/companies/${company.id}`}
                      className="hover:text-[#1a23bd] transition-colors inline-block"
                    >
                      {company.name}
                    </Link>
                  </td>
                  
                  {/* Sector */}
                  <td className="py-4 px-4 text-zinc-600 whitespace-nowrap font-medium">
                    {company.sector ?? <span className="text-zinc-300">—</span>}
                  </td>
                  
                  {/* Stage */}
                  <td className="py-4 px-4 text-zinc-500 whitespace-nowrap text-xs font-mono">
                    {company.stage ?? '—'}
                  </td>
                  
                  {/* Portfolio Health Metric */}
                  <td className="py-4 px-4 whitespace-nowrap">
                    <span className={`
                      inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border border-transparent
                      ${company.portfolio_health
                        ? HEALTH_COLORS[company.portfolio_health]
                        : 'text-zinc-400 bg-zinc-50'
                      }
                    `}>
                      <span className={`w-1 h-1 rounded-full mr-1.5 ${
                        company.portfolio_health === 'Green' ? 'bg-emerald-600' :
                        company.portfolio_health === 'Amber' ? 'bg-amber-500' :
                        company.portfolio_health === 'Red' ? 'bg-red-600' : 'bg-zinc-400'
                      }`} />
                      {company.portfolio_health ?? 'Not Tracked'}
                    </span>
                  </td>
                  
                  {/* 1st-5th Rhythm Reporting Compliance */}
                  <td className="py-4 px-4 whitespace-nowrap">
                    {company.update_submitted_this_cycle ? (
                      <span className="text-xs text-emerald-600 font-medium">Clear / Submitted</span>
                    ) : (
                      <span className="text-xs text-rose-600 font-semibold tracking-wide">Action Required</span>
                    )}
                  </td>
                  
                  {/* Active Capital Raising Parameter */}
                  <td className="py-4 px-4 whitespace-nowrap">
                    {company.is_actively_raising ? (
                      <span className="text-xs text-amber-700 font-semibold bg-amber-50 px-1.5 py-0.5 rounded">Actively Raising</span>
                    ) : (
                      <span className="text-xs text-zinc-400 font-normal">Fully Capitalized</span>
                    )}
                  </td>
                  
                  {/* Macro Exit Signal Indicator */}
                  <td className="py-4 px-4 text-zinc-700 font-mono text-xs whitespace-nowrap">
                    {company.exit_readiness_signal ? (
                      <span className="font-semibold">{company.exit_readiness_signal}</span>
                    ) : (
                      <span className="text-zinc-300">—</span>
                    )}
                  </td>

                  {/* Operational Routing Link */}
                  <td className="py-4 pr-4 text-right whitespace-nowrap">
                    <Link
                      href={`/companies/${company.id}`}
                      className="text-xs font-bold text-zinc-400 hover:text-[#1a23bd] transition-colors"
                    >
                      Manage
                    </Link>
                  </td>

                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showAddForm && (
        <AddCompanyForm onClose={() => setShowAddForm(false)} />
      )}
    </div>
  )
}