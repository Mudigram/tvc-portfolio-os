'use client'

import { useRouter, usePathname } from 'next/navigation'
import { useTransition, useState } from 'react'
import Link from 'next/link'
import { AddFounderForm } from '@/features/founders/components/AddFounderForm'
import type { FounderListItem } from '@/features/founders/types'

const HEALTH_STYLES: Record<string, string> = {
  Green: 'text-emerald-700 bg-emerald-50 border-emerald-200',
  Amber: 'text-amber-700 bg-amber-50 border-amber-200',
  Red:   'text-red-700 bg-red-50 border-red-200',
}

const DDR_STYLES: Record<string, string> = {
  Verified:      'text-emerald-700 bg-emerald-50 border-emerald-200',
  'In Progress': 'text-amber-700 bg-amber-50 border-amber-200',
  Pending:       'text-zinc-500 bg-zinc-50 border-zinc-200',
  Flagged:       'text-red-700 bg-red-50 border-red-200',
}

const INDUSTRIES = [
  'Fintech', 'Healthtech', 'Developer Tools', 'Logistics',
  'SaaS / Productivity', 'Edtech', 'E-commerce', 'Climate', 'Media', 'Other',
]

const STAGES = ['Pre-Idea', 'Pre-Seed', 'Seed', 'Series A', 'Series B', 'Growth']

function formatDate(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
  })
}

interface FoundersListViewProps {
  founders: FounderListItem[]
  total: number
  page: number
  pageSize: number
  totalPages: number
  currentFilters: {
    search?: string
    industry?: string
    stage?: string
    linked?: string
    page?: string
  }
}

export function FoundersListView({
  founders,
  total,
  page,
  totalPages,
  currentFilters,
}: FoundersListViewProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [isPending, startTransition] = useTransition()
  const [searchInput, setSearchInput] = useState(currentFilters.search ?? '')
  const [showAddForm, setShowAddForm] = useState(false)

  function updateParams(updates: Record<string, string | undefined>) {
    const params = new URLSearchParams()
    if (currentFilters.search)   params.set('search', currentFilters.search)
    if (currentFilters.industry) params.set('industry', currentFilters.industry)
    if (currentFilters.stage)    params.set('stage', currentFilters.stage)
    if (currentFilters.linked)   params.set('linked', currentFilters.linked)

    Object.entries(updates).forEach(([key, value]) => {
      if (value) { params.set(key, value) } else { params.delete(key) }
    })

    if (!('page' in updates)) params.delete('page')

    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`)
    })
  }

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault()
    updateParams({ search: searchInput || undefined })
  }

  function handleClear() {
    setSearchInput('')
    startTransition(() => router.push(pathname))
  }

  const hasFilters =
    !!currentFilters.search ||
    !!currentFilters.industry ||
    !!currentFilters.stage ||
    !!currentFilters.linked

  const rangeStart = (page - 1) * 25 + 1
  const rangeEnd = Math.min(page * 25, total)

  return (
    <div className="space-y-6">

      {/* Page header */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-lg font-medium text-zinc-900">Founders</h1>
          <p className="text-sm text-zinc-400 mt-0.5">
            {total} {total === 1 ? 'founder' : 'founders'} in CRM
          </p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="h-8 px-4 text-xs font-medium text-white bg-[#1a23bd] rounded-md hover:bg-[#151c9a] transition-colors"
        >
          Add founder
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">

        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Search name, email, startup…"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="h-9 w-72 px-3 text-sm text-zinc-900 bg-white border border-zinc-200 rounded-md placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent"
          />
          <button
            type="submit"
            className="h-9 px-3 text-xs font-medium text-zinc-600 bg-white border border-zinc-200 rounded-md hover:border-zinc-300 transition-colors"
          >
            Search
          </button>
        </form>

        <select
          value={currentFilters.industry ?? ''}
          onChange={(e) => updateParams({ industry: e.target.value || undefined })}
          className="h-9 px-3 text-sm text-zinc-600 bg-white border border-zinc-200 rounded-md focus:outline-none focus:ring-2 focus:ring-zinc-900"
        >
          <option value="">All industries</option>
          {INDUSTRIES.map((i) => <option key={i}>{i}</option>)}
        </select>

        <select
          value={currentFilters.stage ?? ''}
          onChange={(e) => updateParams({ stage: e.target.value || undefined })}
          className="h-9 px-3 text-sm text-zinc-600 bg-white border border-zinc-200 rounded-md focus:outline-none focus:ring-2 focus:ring-zinc-900"
        >
          <option value="">All stages</option>
          {STAGES.map((s) => <option key={s}>{s}</option>)}
        </select>

        {/* Linked / unlinked filter */}
        <select
          value={currentFilters.linked ?? ''}
          onChange={(e) => updateParams({ linked: e.target.value || undefined })}
          className="h-9 px-3 text-sm text-zinc-600 bg-white border border-zinc-200 rounded-md focus:outline-none focus:ring-2 focus:ring-zinc-900"
        >
          <option value="">All founders</option>
          <option value="linked">Linked to company</option>
          <option value="unlinked">Not linked</option>
        </select>

        {hasFilters && (
          <button
            onClick={handleClear}
            className="text-xs text-zinc-400 hover:text-zinc-700 transition-colors"
          >
            Clear filters
          </button>
        )}

        <span className="text-xs text-zinc-400 ml-auto">
          {hasFilters || total > 25
            ? `${rangeStart}–${rangeEnd} of ${total}`
            : `${total} founders`
          }
        </span>
      </div>

      {/* Loading indicator */}
      {isPending && (
        <div className="h-0.5 bg-zinc-100 rounded overflow-hidden">
          <div className="h-full bg-zinc-400 animate-pulse w-1/2" />
        </div>
      )}

      {/* Table */}
      {founders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <p className="text-sm font-medium text-zinc-900">No founders found</p>
          <p className="text-sm text-zinc-400 mt-1">
            {hasFilters ? 'Try adjusting your filters.' : 'No founders in the CRM yet.'}
          </p>
        </div>
      ) : (
        <div className={`overflow-x-auto transition-opacity ${isPending ? 'opacity-50' : 'opacity-100'}`}>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-100">
                {[
                  'Founder', 'Startup', 'Industry', 'Stage',
                  'Location', 'Portfolio company', 'DDR', 'Last updated',
                ].map((col) => (
                  <th
                    key={col}
                    className="pb-3 pr-8 text-left text-xs font-medium text-zinc-400 uppercase tracking-wide whitespace-nowrap"
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-50">
              {founders.map((founder) => (
                <tr key={founder.id} className="group hover:bg-zinc-50 transition-colors">

                  <td className="py-4 pr-8 border-l-2 border-transparent group-hover:border-zinc-900 transition-colors">
                    <Link
                      href={`/founders/${founder.id}`}
                      className="font-medium text-zinc-900 hover:text-zinc-600 transition-colors block"
                    >
                      {founder.full_name}
                    </Link>
                    <span className="text-xs text-zinc-400">{founder.email}</span>
                  </td>

                  <td className="py-4 pr-8 text-zinc-600">{founder.startup_name ?? '—'}</td>
                  <td className="py-4 pr-8 text-zinc-500">{founder.industry ?? '—'}</td>
                  <td className="py-4 pr-8 text-zinc-500">{founder.stage ?? '—'}</td>

                  <td className="py-4 pr-8 text-zinc-500 whitespace-nowrap">
                    {[founder.city, founder.country].filter(Boolean).join(', ') || '—'}
                  </td>

                  <td className="py-4 pr-8">
                    {founder.linked_company ? (
                      <div className="flex items-center gap-2">
                        <span className={`
                          inline-flex items-center px-1.5 py-0.5 rounded border text-xs font-medium
                          ${founder.linked_company.portfolio_health
                            ? HEALTH_STYLES[founder.linked_company.portfolio_health]
                            : 'text-zinc-400 bg-zinc-50 border-zinc-200'
                          }
                        `}>
                          {founder.linked_company.portfolio_health ?? '—'}
                        </span>
                        <Link
                          href={`/companies/${founder.linked_company.id}`}
                          className="text-zinc-600 hover:text-zinc-900 transition-colors text-xs"
                        >
                          {founder.linked_company.name}
                        </Link>
                      </div>
                    ) : (
                      <span className="text-zinc-400 text-xs">Not linked</span>
                    )}
                  </td>

                  <td className="py-4 pr-8">
                    {founder.ddr_status ? (
                      <span className={`
                        inline-flex items-center px-2 py-0.5 rounded border text-xs font-medium
                        ${DDR_STYLES[founder.ddr_status] ?? 'text-zinc-500 bg-zinc-50 border-zinc-200'}
                      `}>
                        {founder.ddr_status}
                      </span>
                    ) : (
                      <span className="text-zinc-400 text-xs">—</span>
                    )}
                  </td>

                  <td className="py-4 pr-8 text-zinc-400 text-xs whitespace-nowrap">
                    {formatDate(founder.updated_at)}
                  </td>

                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-4 border-t border-zinc-100">
          <button
            onClick={() => updateParams({ page: String(page - 1) })}
            disabled={page <= 1 || isPending}
            className="h-8 px-3 text-xs font-medium text-zinc-600 bg-white border border-zinc-200 rounded-md hover:border-zinc-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Previous
          </button>

          <div className="flex items-center gap-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
              .reduce<(number | 'gap')[]>((acc, p, i, arr) => {
                if (i > 0 && p - (arr[i - 1] as number) > 1) acc.push('gap')
                acc.push(p)
                return acc
              }, [])
              .map((p, i) =>
                p === 'gap' ? (
                  <span key={`gap-${i}`} className="px-1 text-zinc-300 text-xs">…</span>
                ) : (
                  <button
                    key={p}
                    onClick={() => updateParams({ page: String(p) })}
                    disabled={isPending}
                    className={`
                      w-8 h-8 text-xs rounded-md transition-colors
                      ${p === page
                        ? 'bg-zinc-900 text-white font-medium'
                        : 'text-zinc-500 hover:bg-zinc-100'
                      }
                    `}
                  >
                    {p}
                  </button>
                )
              )
            }
          </div>

          <button
            onClick={() => updateParams({ page: String(page + 1) })}
            disabled={page >= totalPages || isPending}
            className="h-8 px-3 text-xs font-medium text-zinc-600 bg-white border border-zinc-200 rounded-md hover:border-zinc-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Next
          </button>
        </div>
      )}

      {/* Add founder modal */}
      {showAddForm && (
        <AddFounderForm onClose={() => setShowAddForm(false)} />
      )}

    </div>
  )
}