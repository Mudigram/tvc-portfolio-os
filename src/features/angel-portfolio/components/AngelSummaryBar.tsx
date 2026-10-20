import type { AngelPortfolioSummary } from '@/features/angel-portfolio/types'

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
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">

      {/* Tile 1 — Invested Capital (Cost Basis) */}
      <div className="bg-white border border-zinc-200/80 rounded-xl p-4 lg:p-5 shadow-xs">
        <p className="text-[10px] lg:text-[11px] font-medium text-zinc-400 uppercase tracking-wider mb-1.5">
          Invested Capital
        </p>
        <p className="text-2xl lg:text-3xl font-semibold text-zinc-900 tracking-tight tabular-nums">
          {formatCurrencyFull(summary.total_invested)}
        </p>
        <p className="text-[11px] text-zinc-400 mt-1">Cost basis deployed</p>
      </div>

      {/* Tile 2 — Estimated Value (Marked-to-Market) */}
      <div className="bg-white border border-zinc-200/80 rounded-xl p-4 lg:p-5 shadow-xs">
        <p className="text-[10px] lg:text-[11px] font-medium text-zinc-400 uppercase tracking-wider mb-1.5">
          Estimated Value
        </p>
        <p className="text-2xl lg:text-3xl font-semibold text-zinc-900 tracking-tight tabular-nums">
          {formatCurrencyFull(summary.total_current_value)}
        </p>
        <p className="text-[11px] mt-1 font-medium">
          {summary.total_unrealized_gain > 0 ? (
            <span className="text-emerald-600">+{formatCurrencyFull(summary.total_unrealized_gain)} unrealized</span>
          ) : summary.total_unrealized_gain < 0 ? (
            <span className="text-red-600">-{formatCurrencyFull(Math.abs(summary.total_unrealized_gain))} unrealized</span>
          ) : (
            <span className="text-zinc-400">Held at cost basis</span>
          )}
        </p>
      </div>

      {/* Tile 3 — Portfolio Return (MOIC) */}
      <div className="bg-white border border-zinc-200/80 rounded-xl p-4 lg:p-5 shadow-xs">
        <p className="text-[10px] lg:text-[11px] font-medium text-zinc-400 uppercase tracking-wider mb-1.5">
          Portfolio Return
        </p>
        <div className="flex items-baseline gap-2">
          <p className="text-2xl lg:text-3xl font-semibold text-zinc-900 tracking-tight tabular-nums">
            {summary.overall_moic !== null ? `${summary.overall_moic.toFixed(2)}x` : '1.00x'}
          </p>
          <span className="text-xs text-zinc-400 font-medium">MOIC</span>
        </div>
        <p className="text-[11px] text-zinc-400 mt-1">
          {summary.companies_count} {summary.companies_count === 1 ? 'company' : 'companies'} · {summary.instruments_count} {summary.instruments_count === 1 ? 'holding' : 'holdings'}
        </p>
      </div>

      {/* Tile 4 — Portfolio Health (visual segment bar) */}
      <div className="bg-white border border-zinc-200/80 rounded-xl p-4 lg:p-5 shadow-xs">
        <p className="text-[10px] lg:text-[11px] font-medium text-zinc-400 uppercase tracking-wider mb-1.5">
          Portfolio health
        </p>

        {healthEmpty ? (
          <p className="text-sm text-zinc-400 mt-2">Not reviewed</p>
        ) : (
          <>
            {/* Segment bar */}
            <div className="flex gap-0.5 h-2.5 rounded-full overflow-hidden mt-2 mb-3">
              {summary.red_count > 0 && (
                <div
                  className="bg-red-400 rounded-l-full"
                  style={{ flex: summary.red_count }}
                />
              )}
              {summary.amber_count > 0 && (
                <div
                  className="bg-amber-400"
                  style={{ flex: summary.amber_count }}
                />
              )}
              {summary.green_count > 0 && (
                <div
                  className="bg-emerald-400 rounded-r-full"
                  style={{ flex: summary.green_count }}
                />
              )}
            </div>

            {/* Legend counts */}
            <div className="flex items-center gap-3">
              {summary.green_count > 0 && (
                <span className="flex items-center gap-1 text-[11px] font-medium text-emerald-700">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  {summary.green_count} On track
                </span>
              )}
              {summary.amber_count > 0 && (
                <span className="flex items-center gap-1 text-[11px] font-medium text-amber-700">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-400" />
                  {summary.amber_count} Monitor
                </span>
              )}
              {summary.red_count > 0 && (
                <span className="flex items-center gap-1 text-[11px] font-medium text-red-600">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-red-400" />
                  {summary.red_count} Attention
                </span>
              )}
            </div>
          </>
        )}
      </div>

    </div>
  )
}