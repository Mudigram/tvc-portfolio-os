'use client'

import { useState, useTransition } from 'react'
import type { MasterLedgerStatus } from '@/features/exposure/types'
import { reconcilePositionAction } from '@/features/exposure/actions/exposure.actions'
import { CheckCircle2, AlertCircle, FileCheck, FileX, RefreshCw, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

export interface PositionReconciliationItem {
  id: string
  company_id: string
  company_name: string
  holder_name: string
  exposure_type: string
  instrument_name: string | null
  status: string
  last_verified_date: string | null
  verified_by: string | null
  has_source_document: boolean
  source_document_url: string | null
}

interface ReconciliationConsoleProps {
  ledgerStatuses: MasterLedgerStatus[]
  positions: PositionReconciliationItem[]
}

// ── Helpers ────────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
  })
}

// ── Company accordion group ────────────────────────────────────────────────

function CompanyGroup({
  companyName,
  companyId,
  positions,
  ledgerStatus,
  onReconcile,
  activeId,
  isPending,
  feedback,
}: {
  companyName: string
  companyId: string
  positions: PositionReconciliationItem[]
  ledgerStatus: MasterLedgerStatus | undefined
  onReconcile: (positionId: string, companyId: string) => void
  activeId: string | null
  isPending: boolean
  feedback: { id: string; success: boolean; msg: string } | null
}) {
  const verifiedCount = positions.filter((p) => p.last_verified_date && p.verified_by).length
  const totalCount    = positions.length
  const isFullyDone   = ledgerStatus?.is_reconciled ?? verifiedCount === totalCount
  // Unreconciled companies open by default so action items surface immediately
  const [open, setOpen] = useState(!isFullyDone)
  const pct = totalCount > 0 ? Math.round((verifiedCount / totalCount) * 100) : 0

  return (
    <div className="border border-zinc-100 rounded-xl bg-white overflow-hidden shadow-sm">
      {/* Company header — always visible */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-zinc-50/60 transition-colors text-left"
      >
        <div className="flex items-center gap-3 min-w-0">
          {/* Status dot */}
          <span className={`w-2 h-2 rounded-full shrink-0 ${isFullyDone ? 'bg-emerald-400' : verifiedCount > 0 ? 'bg-amber-400' : 'bg-red-400'}`} />

          <div className="min-w-0">
            <span className="text-sm font-semibold text-zinc-900 truncate block">{companyName}</span>
            <span className="text-[11px] text-zinc-400">
              {verifiedCount} / {totalCount} positions verified
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4 shrink-0">
          {/* Mini progress bar */}
          <div className="hidden sm:flex items-center gap-2">
            <div className="w-24 h-1.5 rounded-full bg-zinc-100 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${isFullyDone ? 'bg-emerald-500' : 'bg-[#1a23bd]'}`}
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="text-[11px] font-medium text-zinc-500 w-8 text-right">{pct}%</span>
          </div>

          {/* Badge */}
          {isFullyDone ? (
            <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
              <CheckCircle2 className="w-3 h-3" /> Reconciled
            </span>
          ) : (
            <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-amber-50 text-amber-700 border border-amber-200">
              <AlertCircle className="w-3 h-3" /> Pending
            </span>
          )}

          <ChevronDown className={`w-4 h-4 text-zinc-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
        </div>
      </button>

      {/* Position rows */}
      {open && (
        <div className="border-t border-zinc-50">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-50 border-b border-zinc-100">
              <tr>
                {['Holder', 'Instrument', 'Source Evidence', 'Last Verified', ''].map((h) => (
                  <th key={h} className={`px-4 py-2.5 text-[11px] font-semibold text-zinc-400 uppercase tracking-wider whitespace-nowrap ${h === '' ? 'text-right' : ''}`}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-50">
              {positions.map((p) => {
                const isVerified  = Boolean(p.last_verified_date && p.verified_by)
                const isExecuting = isPending && activeId === p.id
                const hasFeedback = feedback?.id === p.id

                return (
                  <tr key={p.id} className={`transition-colors ${hasFeedback && feedback?.success ? 'bg-emerald-50/40' : 'hover:bg-zinc-50/40'}`}>
                    <td className="px-4 py-3 font-medium text-zinc-800 whitespace-nowrap">{p.holder_name}</td>

                    <td className="px-4 py-3 text-zinc-500 whitespace-nowrap">
                      {p.exposure_type}{p.instrument_name ? ` · ${p.instrument_name}` : ''}
                    </td>

                    <td className="px-4 py-3">
                      {p.has_source_document ? (
                        <a
                          href={p.source_document_url!}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-[#1a23bd] hover:underline underline-offset-2"
                        >
                          <FileCheck className="w-3.5 h-3.5 shrink-0" />
                          Linked
                        </a>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-amber-700">
                          <FileX className="w-3.5 h-3.5 shrink-0" />
                          Missing
                        </span>
                      )}
                    </td>

                    <td className="px-4 py-3 whitespace-nowrap">
                      {isVerified ? (
                        <div>
                          <span className="font-medium text-zinc-900">{formatDate(p.last_verified_date!)}</span>
                          <span className="block text-[10px] text-zinc-400">
                            by {p.verified_by?.split('@')[0]}
                          </span>
                        </div>
                      ) : (
                        <span className="text-amber-600 font-medium">Unverified</span>
                      )}
                    </td>

                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      {hasFeedback ? (
                        <span className={`text-[11px] font-medium ${feedback?.success ? 'text-emerald-600' : 'text-red-600'}`}>
                          {feedback?.success ? '✓ Verified' : '✗ Failed'}
                        </span>
                      ) : (
                        <Button
                          size="xs"
                          variant={isVerified ? "secondary" : "default"}
                          onClick={() => onReconcile(p.id, p.company_id)}
                          disabled={isExecuting || !p.has_source_document}
                          title={
                            !p.has_source_document
                              ? 'Link a source document first'
                              : isVerified ? 'Re-verify position' : 'Reconcile & mark verified'
                          }
                        >
                          {isExecuting && <RefreshCw className="w-3 h-3 animate-spin mr-1" />}
                          {isVerified ? 'Re-verify' : 'Reconcile'}
                        </Button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// ── Main console ───────────────────────────────────────────────────────────

export function ReconciliationConsole({ ledgerStatuses, positions }: ReconciliationConsoleProps) {
  const [filter, setFilter]     = useState<'all' | 'unreconciled' | 'reconciled'>('all')
  const [search, setSearch]     = useState('')
  const [isPending, startTransition] = useTransition()
  const [activeId, setActiveId] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<{ id: string; success: boolean; msg: string } | null>(null)

  // ── Aggregations ──────────────────────────────────────────────
  const totalCompanies      = ledgerStatuses.length
  const reconciledCompanies = ledgerStatuses.filter((s) => s.is_reconciled).length
  const totalPositions      = positions.length
  const verifiedPositions   = positions.filter((p) => p.last_verified_date && p.verified_by).length
  const overallPct          = totalPositions > 0 ? Math.round((verifiedPositions / totalPositions) * 100) : 0

  // ── Group positions by company ────────────────────────────────
  const companies = Array.from(
    positions.reduce((map, p) => {
      if (!map.has(p.company_id)) map.set(p.company_id, { name: p.company_name, items: [] })
      map.get(p.company_id)!.items.push(p)
      return map
    }, new Map<string, { name: string; items: PositionReconciliationItem[] }>())
  )

  // ── Filter ────────────────────────────────────────────────────
  const filteredCompanies = companies.filter(([companyId, { name, items }]) => {
    const ledger = ledgerStatuses.find((s) => s.company_id === companyId)
    const matchesSearch = name.toLowerCase().includes(search.toLowerCase()) ||
      items.some((p) => p.holder_name.toLowerCase().includes(search.toLowerCase()))

    if (filter === 'reconciled')   return matchesSearch && (ledger?.is_reconciled ?? false)
    if (filter === 'unreconciled') return matchesSearch && !(ledger?.is_reconciled ?? false)
    return matchesSearch
  })

  // ── Action ────────────────────────────────────────────────────
  function handleReconcile(positionId: string, companyId: string) {
    setActiveId(positionId)
    setFeedback(null)
    startTransition(async () => {
      const res = await reconcilePositionAction(positionId, companyId)
      setFeedback({
        id: positionId,
        success: res.success,
        msg: res.success ? 'Position reconciled and verified.' : res.error || 'Failed to reconcile.',
      })
      setActiveId(null)
    })
  }

  return (
    <div className="space-y-8">

      {/* ── Summary strip ──────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Portfolio Companies', value: totalCompanies, color: 'text-zinc-900' },
          { label: 'Fully Reconciled', value: `${reconciledCompanies} / ${totalCompanies}`, color: 'text-emerald-700' },
          { label: 'Total Positions', value: totalPositions, color: 'text-foreground' },
          { label: 'Verified Positions', value: `${verifiedPositions} / ${totalPositions}`, color: 'text-primary' },
        ].map(({ label, value, color }) => (
          <Card key={label} className="p-4 space-y-1">
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">{label}</p>
            <p className={`text-2xl font-bold tracking-tight ${color}`}>{value}</p>
          </Card>
        ))}
      </div>

      {/* Overall progress bar */}
      <Card className="p-4 space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="font-medium text-muted-foreground">Overall reconciliation progress</span>
          <span className="font-bold text-foreground">{overallPct}%</span>
        </div>
        <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${overallPct === 100 ? 'bg-emerald-500' : 'bg-primary'}`}
            style={{ width: `${overallPct}%` }}
          />
        </div>
      </Card>

      {/* ── Filter & Search ────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1 bg-zinc-100 p-1 rounded-lg w-fit">
          {(['all', 'unreconciled', 'reconciled'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3.5 py-1.5 text-xs font-medium rounded-md capitalize transition-all ${
                filter === f
                  ? 'bg-white text-zinc-900 shadow-sm font-semibold'
                  : 'text-zinc-500 hover:text-zinc-800'
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        <input
          type="text"
          placeholder="Search by company or holder..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-9 px-3 text-xs text-zinc-900 bg-white border border-zinc-200 rounded-lg w-full sm:w-64 focus:outline-none focus:ring-2 focus:ring-[#1a23bd]/30 focus:border-[#1a23bd]"
        />
      </div>

      {/* ── Company accordions ─────────────────────────────────── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
            Position Verification · {filteredCompanies.length} companies
          </h2>
          <span className="text-[11px] text-zinc-400">
            Positions require a linked source document to reconcile
          </span>
        </div>

        {filteredCompanies.length === 0 ? (
          <div className="py-16 text-center border border-zinc-100 rounded-xl bg-white">
            <p className="text-sm text-zinc-400">No companies match your current filter.</p>
          </div>
        ) : (
          filteredCompanies.map(([companyId, { name, items }]) => (
            <CompanyGroup
              key={companyId}
              companyId={companyId}
              companyName={name}
              positions={items}
              ledgerStatus={ledgerStatuses.find((s) => s.company_id === companyId)}
              onReconcile={handleReconcile}
              activeId={activeId}
              isPending={isPending}
              feedback={feedback}
            />
          ))
        )}
      </div>
    </div>
  )
}
