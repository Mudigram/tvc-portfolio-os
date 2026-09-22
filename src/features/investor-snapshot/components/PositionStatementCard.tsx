import type { HolderSnapshotData, MonthlyValuePoint } from '../types'
import { CalendarX2, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'

// ─── Helpers ────────────────────────────────────────────────────────────────

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(amount)

const formatDate = (dateStr: string) =>
  new Date(dateStr + 'T00:00:00').toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })

const formatPct = (pct: number | null) =>
  pct != null ? `${pct.toFixed(2)}%` : '—'

type HealthValue = 'Green' | 'Amber' | 'Red' | null

function HealthBadge({ health }: { health: HealthValue }) {
  if (!health) return <span className="text-zinc-400 text-xs">—</span>
  const cfg: Record<NonNullable<HealthValue>, string> = {
    Green: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    Amber: 'bg-amber-50 text-amber-700 border-amber-200',
    Red: 'bg-red-50 text-red-700 border-red-200',
  }
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider border ${cfg[health]}`}
    >
      {health}
    </span>
  )
}

function CompanyLogo({
  logoUrl,
  name,
}: {
  logoUrl: string | null
  name: string
}) {
  if (logoUrl) {
    return (
      <img
        src={logoUrl}
        alt={name}
        className="w-7 h-7 rounded object-cover shrink-0 border border-zinc-200/60"
      />
    )
  }
  return (
    <div className="w-7 h-7 rounded bg-zinc-100 border border-zinc-200/80 flex items-center justify-center shrink-0 font-bold text-[11px] text-zinc-600">
      {name.charAt(0).toUpperCase()}
    </div>
  )
}

function MonthlyTrajectorySection({ points }: { points: MonthlyValuePoint[] }) {
  if (!points || points.length === 0) return null

  return (
    <div className="mb-6 pb-6 border-b border-zinc-100">
      <div className="flex items-center justify-between mb-3">
        <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
          Monthly Portfolio Value Trajectory (Past 3 Months)
        </p>
        <span className="text-[10px] font-semibold text-[#1a23bd] bg-blue-50/80 px-2 py-0.5 rounded border border-blue-100">
          Monthly Point-in-Time Aggregate
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {points.map((pt, idx) => (
          <div
            key={pt.cutoff_date}
            className={`p-3.5 rounded-xl border transition-all ${
              idx === points.length - 1
                ? 'bg-blue-50/40 border-blue-200/80 shadow-2xs'
                : 'bg-zinc-50/60 border-zinc-200/70'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold text-zinc-900">{pt.month_label}</span>
              {idx === points.length - 1 && (
                <span className="text-[9px] font-bold text-[#1a23bd] uppercase bg-white px-1.5 py-0.2 rounded border border-blue-100">
                  Selected
                </span>
              )}
            </div>
            <p className="text-base font-bold font-mono text-zinc-900">
              {formatCurrency(pt.total_invested)}
            </p>
            <div className="flex items-center justify-between text-[10px] text-zinc-500 mt-1">
              <span>{pt.active_companies} {pt.active_companies === 1 ? 'Co.' : 'Cos.'}</span>
              {pt.net_change > 0 ? (
                <span className="text-emerald-700 font-semibold font-mono">
                  +{formatCurrency(pt.net_change)}
                </span>
              ) : pt.net_change < 0 ? (
                <span className="text-red-600 font-semibold font-mono">
                  {formatCurrency(pt.net_change)}
                </span>
              ) : (
                <span className="text-zinc-400 font-mono">—</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Main Card ───────────────────────────────────────────────────────────────

interface Props {
  data: HolderSnapshotData
  customName?: string
  onResetDate?: () => void
}

export default function PositionStatementCard({ data, onResetDate }: Props) {
  const generatedOn = formatDate(new Date().toISOString().split('T')[0])
  const asOfFormatted = formatDate(data.as_of_date)

  return (
    <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden print:border-0 print:shadow-none print:rounded-none">

      {/* ── Document Header ─────────────────────────────────────────── */}
      <div className="border-b border-zinc-100 bg-gradient-to-r from-blue-50/40 via-white to-white px-8 py-6">
        <div className="flex items-start justify-between">
          {/* Branding */}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#1a23bd] mb-1">
              TVCLabs Capital
            </p>
            <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">
              Position Statement
            </h1>
          </div>

          {/* Date info */}
          <div className="text-right">
            <p className="text-xs text-zinc-400 uppercase tracking-wider font-medium">As of Date</p>
            <p className="text-sm font-bold text-zinc-900">{asOfFormatted}</p>
            <p className="text-[10px] text-zinc-400 mt-0.5">Generated {generatedOn}</p>
          </div>
        </div>

        {/* Investor info row */}
        <div className="mt-5 pt-5 border-t border-zinc-100 flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0 shadow-2xs">
            <span className="text-sm font-bold text-[#1a23bd]">
              {data.holder_name.charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <p className="text-[10px] text-zinc-400 uppercase tracking-wider font-bold">Prepared for</p>
            <p className="text-base font-bold text-zinc-900">{data.holder_name}</p>
            {data.holder_email && (
              <p className="text-xs text-zinc-500 font-mono">{data.holder_email}</p>
            )}
          </div>
        </div>
      </div>

      {/* ── Positions Content & Trajectory ──────────────────────────────── */}
      <div className="px-8 py-6">
        {/* 3-Month Historical Aggregation Trajectory */}
        <MonthlyTrajectorySection points={data.monthly_history} />

        {data.positions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-14 px-4 text-center bg-zinc-50/50 border border-dashed border-zinc-200 rounded-xl my-2">
            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100/80 flex items-center justify-center mb-3">
              <CalendarX2 className="w-5 h-5 text-[#1a23bd]" />
            </div>
            <h3 className="text-sm font-semibold text-zinc-900 mb-1">
              No active positions as of {asOfFormatted}
            </h3>
            <p className="text-xs text-zinc-500 max-w-md leading-relaxed mb-4">
              No active investments or equity holdings were on record for {data.holder_name} on or prior to this cutoff date.
            </p>
            {onResetDate && (
              <Button
                variant="outline"
                size="xs"
                onClick={onResetDate}
                className="gap-1.5 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                View Current Statement
              </Button>
            )}
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-200">
                <th className="text-left py-3 pr-4 text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                  Company
                </th>
                <th className="text-left py-3 pr-4 text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                  Instrument
                </th>
                <th className="text-right py-3 pr-4 text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                  Amount Invested
                </th>
                <th className="text-right py-3 pr-4 text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                  Ownership
                </th>
                <th className="text-center py-3 text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                  Health
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {data.positions.map((pos) => (
                <tr key={pos.position_id} className="group hover:bg-zinc-50/60 transition-colors">
                  {/* Company */}
                  <td className="py-3.5 pr-4">
                    <div className="flex items-center gap-2.5">
                      <CompanyLogo logoUrl={pos.logo_url} name={pos.company_name} />
                      <div>
                        <p className="text-sm font-semibold text-zinc-900">
                          {pos.company_name}
                        </p>
                        {(pos.company_sector || pos.company_stage) && (
                          <p className="text-[10px] text-zinc-400">
                            {[pos.company_sector, pos.company_stage].filter(Boolean).join(' · ')}
                          </p>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Instrument */}
                  <td className="py-3.5 pr-4">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wide bg-zinc-100 text-zinc-700 border border-zinc-200/80">
                      {pos.exposure_type}
                    </span>
                  </td>

                  {/* Amount */}
                  <td className="py-3.5 pr-4 text-right">
                    <span className="font-mono text-sm font-semibold text-zinc-900">
                      {formatCurrency(pos.amount_invested)}
                    </span>
                  </td>

                  {/* Ownership */}
                  <td className="py-3.5 pr-4 text-right">
                    <span className="font-mono text-sm text-zinc-600">
                      {formatPct(pos.ownership_pct)}
                    </span>
                  </td>

                  {/* Health */}
                  <td className="py-3.5 text-center">
                    <HealthBadge health={pos.portfolio_health} />
                  </td>
                </tr>
              ))}
            </tbody>

            {/* Total row */}
            <tfoot>
              <tr className="border-t-2 border-zinc-200">
                <td colSpan={2} className="pt-4 pb-2 pr-4">
                  <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                    Total Position Value
                  </span>
                </td>
                <td className="pt-4 pb-2 pr-4 text-right">
                  <span className="font-mono text-base font-bold text-zinc-900">
                    {formatCurrency(data.total_invested)}
                  </span>
                </td>
                <td colSpan={2} />
              </tr>
            </tfoot>
          </table>
        )}
      </div>

      {/* ── Confidentiality Footer ───────────────────────────────────── */}
      <div className="border-t border-zinc-100 px-8 py-5 bg-zinc-50/50">
        <div className="flex items-start justify-between gap-8">
          <p className="text-[10px] leading-relaxed text-zinc-500 max-w-2xl">
            <span className="font-bold uppercase tracking-wider text-zinc-600">
              Strictly Confidential.{' '}
            </span>
            This document is prepared exclusively for the named recipient and is intended
            for informational purposes only. It does not constitute an offer to sell or a
            solicitation to buy any investment. TVCLabs Capital reserves all rights.
          </p>
          <p className="text-[10px] text-zinc-400 shrink-0 text-right font-mono">
            TVCLabs Capital Ltd
            <br />
            Portfolio OS v1
          </p>
        </div>
      </div>
    </div>
  )
}
