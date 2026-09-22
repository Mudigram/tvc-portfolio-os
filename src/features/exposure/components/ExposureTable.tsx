'use client'
// ─────────────────────────────────────────────────────────────
// ExposureTable — per-company exposure tab
// Changes from previous version:
//   - Added companyId prop (needed by the edit action)
//   - Added Edit button per row (internal role only)
//   - Inline ExposureEditForm expands below the active row
//   - onSaved closes the form and shows a success flash
// ─────────────────────────────────────────────────────────────

import { useState, Fragment } from 'react' // 💡 Added Fragment here
import type { ExposureRow, CapTableView } from '@/features/companies/types'
import { OwnershipPieChart } from '@/features/exposure/components/OwnershipPieChart'
import { InvestmentBarChart } from '@/features/exposure/components/InvestmentBarChat'
import { ExposureEditForm } from '@/features/exposure/components/ExposureEditForm'
import { ExposureCreateForm } from '@/features/exposure/components/ExposureCreateForm'
import type { HolderOption } from '@/features/exposure/services/holders.service'
import { Button } from '@/components/ui/button'

interface ExposureTableProps {
  rows: ExposureRow[]
  companyId: string
  canEdit?: boolean
  holders?: HolderOption[]      
  tvcHolderIds?: string[]        // ← new
  stalenessDays?: number
}

const VIEWS: { key: CapTableView; label: string }[] = [
  { key: 'full-equity',      label: 'Full equity' },
  { key: 'founder',          label: 'Founders' },
  { key: 'safe-convertible', label: 'SAFEs & notes' },
  { key: 'esop-incentive',   label: 'ESOP & incentives' },
]

function filterRows(rows: ExposureRow[], view: CapTableView): ExposureRow[] {
  switch (view) {
    case 'full-equity':
      return rows.filter((r) =>
        ['Equity', 'SAFE', 'Convertible Note'].includes(r.exposure_type),
      )
    case 'founder':
      return rows.filter((r) => r.holder_type === 'Founder')
    case 'safe-convertible':
      return rows.filter((r) =>
        ['SAFE', 'Convertible Note'].includes(r.exposure_type),
      )
    case 'esop-incentive':
      return rows.filter((r) =>
        ['Option', 'Warrant', 'Advisory Equity'].includes(r.exposure_type),
      )
  }
}

function formatCurrency(n: number | null): string {
  if (n === null) return '—'
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(n)
}

function formatPct(n: number | null): string {
  if (n === null || n === 0) return '—'
  return `${n.toFixed(2)}%`
}

function formatDate(d: string | null): string {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

const STATUS_STYLES: Record<string, string> = {
  Active:    'text-emerald-700 bg-emerald-50 border-emerald-200',
  Converted: 'text-blue-700 bg-blue-50 border-blue-200',
  Exited:    'text-zinc-500 bg-zinc-50 border-zinc-200',
  Cancelled: 'text-red-600 bg-red-50 border-red-200',
}

function isStale(dateStr: string | null, days: number = 90): boolean {
  if (!dateStr) return true
  const thresholdMs = days * 24 * 60 * 60 * 1000
  return Date.now() - new Date(dateStr).getTime() > thresholdMs
}

// ─────────────────────────────────────────────────────────────

export default function ExposureTable({
  rows,
  companyId,
  canEdit = false,
  holders = [],
  tvcHolderIds = [],
  stalenessDays = 90,
}: ExposureTableProps)  {
  const [view, setView] = useState<CapTableView>('full-equity')
  const [isCreating, setIsCreating] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [savedId, setSavedId] = useState<string | null>(null)   // flash on save

  const filtered = filterRows(rows, view)

  const totalInvested = filtered.reduce(
    (sum, r) => sum + (r.amount_invested ?? 0), 0,
  )
  const totalOwnership = filtered.reduce(
    (sum, r) => sum + (r.ownership_pct ?? 0), 0,
  )

  function handleSaved(id: string) {
    setEditingId(null)
    setSavedId(id)
    setTimeout(() => setSavedId(null), 3000)
  }

  function handleCreated() {
    setIsCreating(false)
    // Optional: flash a success state the same way handleSaved does
  }
  return (
    <div className="space-y-6">
 
      {/* View switcher + Add button row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1 p-1 bg-zinc-100 rounded-lg w-fit">
          {VIEWS.map((v) => (
            <button
            key={v.key}
            onClick={() => { setView(v.key); setEditingId(null) }}
            className={`
              px-3 py-1.5 rounded-md text-xs font-medium transition-all
              ${view === v.key
                ? 'bg-white text-zinc-900 shadow-sm'
                : 'text-zinc-500 hover:text-zinc-700'
              }
            `}
          >
            {v.label}
          </button>
          ))}
        </div>
 
        {canEdit && (
          <Button
            size="sm"
            onClick={() => setIsCreating((prev) => !prev)}
          >
            {isCreating ? 'Close' : '+ Add exposure'}
          </Button>
        )}
      </div>
 
      {/* Create form panel — only when open */}
      {isCreating && canEdit && (
        <ExposureCreateForm
          companyId={companyId}
          holders={holders}
          tvcHolderIds={tvcHolderIds}
          onClose={() => setIsCreating(false)}
          onSaved={handleCreated}
        />
      )}

      {/* Summary bar */}
      {filtered.length > 0 && (
        <div className="flex items-center gap-8">
          <div>
            <p className="text-xs text-zinc-400">Total invested</p>
            <p className="text-sm font-medium text-zinc-900">
              {totalInvested > 0 ? formatCurrency(totalInvested) : '—'}
            </p>
          </div>
          <div>
            <p className="text-xs text-zinc-400">Total ownership</p>
            <p className="text-sm font-medium text-zinc-900">
              {totalOwnership > 0 ? formatPct(totalOwnership) : '—'}
            </p>
          </div>
          <div>
            <p className="text-xs text-zinc-400">Holders</p>
            <p className="text-sm font-medium text-zinc-900">{filtered.length}</p>
          </div>
        </div>
      )}

      {/* Charts */}
      {(view === 'full-equity' || view === 'founder') && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 py-4 border-t border-b border-zinc-50">
          <OwnershipPieChart rows={filtered} />
          <InvestmentBarChart rows={filtered} />
        </div>
      )}

      {/* Empty state */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <p className="text-sm font-medium text-zinc-900">No records</p>
          <p className="text-sm text-zinc-400 mt-1">
            No exposure entries match this view.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-100">
                {[
                  'Holder', 'Type', 'Instrument',
                  'Issued', 'Invested', 'Ownership',
                  'Share class', 'Status', 'Verified',
                  ...(canEdit ? [''] : []),   // Edit column header — internal only
                ].map((col) => (
                  <th
                    key={col}
                    className="pb-3 pr-6 text-left text-xs font-medium text-zinc-400 uppercase tracking-wide whitespace-nowrap"
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-50">
              {filtered.map((row) => {
                const stale = isStale(row.last_verified_date)
                const isEditing = editingId === row.id
                const justSaved = savedId === row.id

                return (
                  // 💡 FIX: Using <Fragment key={...}> as the root element of your map iterator
                  <Fragment key={row.id}>
                    {/* ── Data row ─────────────────────────── */}
                    <tr
                      className={`group transition-colors ${
                        isEditing ? 'bg-zinc-50' : 'hover:bg-zinc-50'
                      }`}
                    >
                      <td className="py-4 pr-6 font-medium text-zinc-900 whitespace-nowrap">
                        {row.holder_name}
                      </td>
                      <td className="py-4 pr-6 text-zinc-500 whitespace-nowrap">
                        {row.holder_type}
                      </td>
                      <td className="py-4 pr-6 text-zinc-600 whitespace-nowrap">
                        {row.instrument_name ?? '—'}
                      </td>
                      <td className="py-4 pr-6 text-zinc-500 whitespace-nowrap">
                        {formatDate(row.issue_date)}
                      </td>
                      <td className="py-4 pr-6 text-zinc-900 whitespace-nowrap tabular-nums">
                        {formatCurrency(row.amount_invested)}
                      </td>
                      <td className="py-4 pr-6 text-zinc-900 whitespace-nowrap tabular-nums">
                        {formatPct(row.ownership_pct)}
                      </td>
                      <td className="py-4 pr-6 text-zinc-500 whitespace-nowrap">
                        {row.share_class ?? '—'}
                      </td>
                      <td className="py-4 pr-6 whitespace-nowrap">
                        <span className={`
                          inline-flex items-center px-2 py-0.5 rounded border text-xs font-medium
                          ${STATUS_STYLES[row.status] ?? STATUS_STYLES.Active}
                        `}>
                          {row.status}
                        </span>
                      </td>
                      <td className="py-4 pr-6 whitespace-nowrap">
                        {justSaved ? (
                          <span className="text-xs text-emerald-600 font-medium">
                            ✓ Saved
                          </span>
                        ) : stale ? (
                          <span className="text-xs text-amber-600 font-medium">
                            ⚠ Stale
                          </span>
                        ) : (
                          <span className="text-xs text-zinc-400">
                            {formatDate(row.last_verified_date)}
                          </span>
                        )}
                      </td>

                      {/* Edit button — internal only */}
                      {canEdit && (
                        <td className="py-4 whitespace-nowrap">
                          <button
                            onClick={() =>
                              setEditingId(isEditing ? null : row.id)
                            }
                            className={`text-xs font-medium transition-colors ${
                              isEditing
                                ? 'text-zinc-400 hover:text-zinc-700'
                                : 'text-[#1a23bd] hover:text-[#1520a8]'
                            }`}
                          >
                            {isEditing ? 'Close' : 'Edit'}
                          </button>
                        </td>
                      )}
                    </tr>

                    {/* ── Inline edit form ─────────────────── */}
                    {isEditing && (
                      <tr>
                        <td
                          colSpan={canEdit ? 10 : 9}
                          className="pb-4 pt-0 pr-0"
                        >
                          <ExposureEditForm
                            row={row}
                            companyId={companyId}
                            onClose={() => setEditingId(null)}
                            onSaved={() => handleSaved(row.id)}
                          />
                        </td>
                      </tr>
                    )}
                  </Fragment>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}