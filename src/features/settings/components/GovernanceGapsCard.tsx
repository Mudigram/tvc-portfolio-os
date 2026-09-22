'use client'

import type { GovernanceGap } from '@/features/exposure/services/governance-gaps.service'
import { ShieldAlert, AlertTriangle, FileWarning, CheckCircle2 } from 'lucide-react'
import { Card } from '@/components/ui/card'

interface GovernanceGapsCardProps {
  gaps: GovernanceGap[]
}

export function GovernanceGapsCard({ gaps }: GovernanceGapsCardProps) {
  const unverified = gaps.filter((g) => g.gap_type === 'unverified_position')
  const missingEvidence = gaps.filter((g) => g.gap_type === 'missing_evidence')

  return (
    <Card className="p-6 space-y-6">
      <div className="flex items-center justify-between border-b border-zinc-100 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-rose-50 border border-rose-200 flex items-center justify-center">
            <ShieldAlert className="w-4 h-4 text-rose-600" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-zinc-900">
              Governance Gap Visibility Console
            </h3>
            <p className="text-xs text-zinc-500">
              Admin-tier risk monitoring for unverified positions (&gt;90 days) and missing evidence documents.
            </p>
          </div>
        </div>
        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-zinc-100 text-zinc-700 border border-zinc-200">
          Admin Privilege Active
        </span>
      </div>

      {gaps.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-center bg-emerald-50/50 border border-emerald-100 rounded-lg">
          <CheckCircle2 className="w-8 h-8 text-emerald-600 mb-2" />
          <p className="text-sm font-medium text-emerald-900">Zero Governance Gaps Detected</p>
          <p className="text-xs text-emerald-700 mt-0.5">
            All exposure positions are verified within 90 days and all ledger events have linked source documents.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Unverified Positions Panel */}
          <div className="p-4 rounded-lg bg-amber-50/40 border border-amber-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-amber-900 uppercase tracking-wide flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                Unverified Positions ({unverified.length})
              </span>
            </div>
            {unverified.length === 0 ? (
              <p className="text-xs text-zinc-500 italic">No stale or unverified positions.</p>
            ) : (
              <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                {unverified.map((gap) => (
                  <div
                    key={gap.record_id}
                    className="p-2.5 rounded bg-white border border-amber-200 text-xs flex justify-between items-center"
                  >
                    <div>
                      <p className="font-medium text-zinc-900">Position ID: {gap.record_id.slice(0, 8)}...</p>
                      <p className="text-[11px] text-zinc-500">Company ID: {gap.company_id.slice(0, 8)}...</p>
                    </div>
                    <span className="text-[11px] font-semibold text-amber-700 bg-amber-100 px-2 py-0.5 rounded">
                      {gap.detail_date ? `Stale: ${new Date(gap.detail_date).toLocaleDateString()}` : 'Never Verified'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Missing Evidence Panel */}
          <div className="p-4 rounded-lg bg-rose-50/40 border border-rose-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-rose-900 uppercase tracking-wide flex items-center gap-1.5">
                <FileWarning className="w-3.5 h-3.5 text-rose-600" />
                Missing Source Evidence ({missingEvidence.length})
              </span>
            </div>
            {missingEvidence.length === 0 ? (
              <p className="text-xs text-zinc-500 italic">All events have source documents.</p>
            ) : (
              <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                {missingEvidence.map((gap) => (
                  <div
                    key={gap.record_id}
                    className="p-2.5 rounded bg-white border border-rose-200 text-xs flex justify-between items-center"
                  >
                    <div>
                      <p className="font-medium text-zinc-900">Event: {gap.detail_text ?? 'Ledger Record'}</p>
                      <p className="text-[11px] text-zinc-500">Date: {gap.detail_date ? new Date(gap.detail_date).toLocaleDateString() : '—'}</p>
                    </div>
                    <span className="text-[11px] font-semibold text-rose-700 bg-rose-100 px-2 py-0.5 rounded">
                      No URL
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </Card>
  )
}
