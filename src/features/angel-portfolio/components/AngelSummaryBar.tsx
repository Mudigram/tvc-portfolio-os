import type { AngelPortfolioSummary } from '@/features/angel-portfolio/types'
import { TrendingUp, TrendingDown } from 'lucide-react'

function formatCurrencyFull(n: number): string {
  if (n === 0) return '$0'
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(n)
}

interface AngelSummaryBarProps {
  summary: AngelPortfolioSummary
}

export function AngelSummaryBar({ summary }: AngelSummaryBarProps) {
  const total = summary.green_count + summary.amber_count + summary.red_count
  const healthEmpty = total === 0

  return (
    <div className="bg-white border border-zinc-200/80 rounded-2xl shadow-xs overflow-hidden">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-zinc-100">
        
        {/* Metric 1 — Invested Capital */}
        <div className="p-4 lg:p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                Invested Capital
              </span>
              <span className="text-[11px] font-mono text-zinc-600 bg-zinc-100 px-1.5 py-0.5 rounded">
                Cost Basis
              </span>
            </div>
            <p className="text-2xl lg:text-3xl font-bold text-zinc-900 tracking-tight tabular-nums mt-1">
              {formatCurrencyFull(summary.total_invested)}
            </p>
          </div>
          <p className="text-xs text-zinc-600 mt-2">
            Deployed across {summary.instruments_count} active {summary.instruments_count === 1 ? 'holding' : 'holdings'}
          </p>
        </div>

        {/* Metric 2 — Estimated Portfolio Value */}
        <div className="p-4 lg:p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                Estimated Value
              </span>
              <span className="text-[11px] font-mono text-zinc-600 bg-zinc-100 px-1.5 py-0.5 rounded">
                Mark-to-Market
              </span>
            </div>
            <p className="text-2xl lg:text-3xl font-bold text-zinc-900 tracking-tight tabular-nums mt-1">
              {formatCurrencyFull(summary.total_current_value)}
            </p>
          </div>
          <div className="flex items-center gap-1.5 mt-2">
            {summary.total_unrealized_gain > 0 ? (
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                +{formatCurrencyFull(summary.total_unrealized_gain)} unrealized
              </span>
            ) : summary.total_unrealized_gain < 0 ? (
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-800 bg-red-50 border border-red-200 px-2 py-0.5 rounded-md">
                <TrendingDown className="w-3.5 h-3.5 text-red-600" />
                -{formatCurrencyFull(Math.abs(summary.total_unrealized_gain))} unrealized
              </span>
            ) : (
              <span className="text-xs font-medium text-zinc-600">
                Marked at original cost basis
              </span>
            )}
          </div>
        </div>

        {/* Metric 3 — Portfolio Return (MOIC) */}
        <div className="p-4 lg:p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                Portfolio Return
              </span>
              <span className="text-[11px] font-mono text-blue-800 bg-blue-50 border border-blue-100 px-1.5 py-0.5 rounded font-semibold">
                Multiple
              </span>
            </div>
            <div className="flex items-baseline gap-2 mt-1">
              <p className="text-2xl lg:text-3xl font-bold text-zinc-900 tracking-tight tabular-nums">
                {summary.overall_moic !== null ? `${summary.overall_moic.toFixed(2)}x` : '1.00x'}
              </p>
              <span className="text-xs font-semibold text-zinc-600">MOIC</span>
            </div>
          </div>
          <p className="text-xs text-zinc-600 mt-2">
            Across {summary.companies_count} {summary.companies_count === 1 ? 'company' : 'companies'} ({summary.sectors_count} {summary.sectors_count === 1 ? 'sector' : 'sectors'})
          </p>
        </div>

        {/* Metric 4 — Portfolio Health */}
        <div className="p-4 lg:p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                Portfolio Health
              </span>
              <span className="text-[11px] font-mono text-zinc-600 bg-zinc-100 px-1.5 py-0.5 rounded">
                TVC Review
              </span>
            </div>

            {healthEmpty ? (
              <p className="text-sm text-zinc-500 mt-3">Pending initial review</p>
            ) : (
              <>
                {/* Accessible Progress / Segment Bar */}
                <div
                  className="flex gap-1 h-2 rounded-full overflow-hidden mt-3 mb-2 bg-zinc-100"
                  role="meter"
                  aria-label="Portfolio health distribution"
                  aria-valuenow={summary.green_count}
                  aria-valuemin={0}
                  aria-valuemax={total}
                >
                  {summary.green_count > 0 && (
                    <div
                      className="bg-emerald-500 rounded-sm transition-all"
                      style={{ flex: summary.green_count }}
                      title={`${summary.green_count} On track`}
                    />
                  )}
                  {summary.amber_count > 0 && (
                    <div
                      className="bg-amber-400 rounded-sm transition-all"
                      style={{ flex: summary.amber_count }}
                      title={`${summary.amber_count} Monitor`}
                    />
                  )}
                  {summary.red_count > 0 && (
                    <div
                      className="bg-red-500 rounded-sm transition-all"
                      style={{ flex: summary.red_count }}
                      title={`${summary.red_count} Attention`}
                    />
                  )}
                </div>

                {/* Accessible Legend */}
                <div className="flex items-center justify-between text-xs font-medium text-zinc-600 pt-1">
                  <span className="inline-flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span className="font-semibold text-zinc-800">{summary.green_count}</span> On track
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-400" />
                    <span className="font-semibold text-zinc-800">{summary.amber_count}</span> Monitor
                  </span>
                  {summary.red_count > 0 && (
                    <span className="inline-flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-red-500" />
                      <span className="font-semibold text-zinc-800">{summary.red_count}</span> Attention
                    </span>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

      </div>
    </div>
  )
}