import type { AngelPortfolioSummary } from '@/features/angel-portfolio/types'

function formatCurrency(n: number): string {
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
  return (
    // 🟢 MOBILE FIX: Modified grid from grid-cols-2 to grid-cols-2 lg:grid-cols-4 and removed static padding bottlenecks
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 p-4 lg:px-6 lg:py-5 rounded-xl border border-zinc-100 bg-zinc-50">

      <div className="space-y-0.5">
        <p className="text-[10px] lg:text-xs font-medium text-zinc-400 uppercase tracking-wide">
          Total invested
        </p>
        <p className="text-xl lg:text-2xl font-semibold text-zinc-900 tracking-tight">
          {formatCurrency(summary.total_invested)}
        </p>
      </div>

      <div className="space-y-0.5">
        <p className="text-[10px] lg:text-xs font-medium text-zinc-400 uppercase tracking-wide">
          Companies
        </p>
        <p className="text-xl lg:text-2xl font-semibold text-zinc-700 tracking-tight">
          {summary.companies_count}
        </p>
      </div>

      <div className="space-y-0.5">
        <p className="text-[10px] lg:text-xs font-medium text-zinc-400 uppercase tracking-wide">
          Instruments
        </p>
        <p className="text-xl lg:text-2xl font-semibold text-zinc-700 tracking-tight">
          {summary.instruments_count}
        </p>
      </div>

      {/* Health split */}
      <div className="space-y-0.5">
        <p className="text-[10px] lg:text-xs font-medium text-zinc-400 uppercase tracking-wide">
          Portfolio health
        </p>
        <div className="flex items-center gap-2 lg:gap-3 pt-0.5">
          {summary.green_count > 0 && (
            <span className="text-xs lg:text-sm font-semibold text-emerald-600">
              {summary.green_count}G
            </span>
          )}
          {summary.amber_count > 0 && (
            <span className="text-xs lg:text-sm font-semibold text-amber-600">
              {summary.amber_count}A
            </span>
          )}
          {summary.red_count > 0 && (
            <span className="text-xs lg:text-sm font-semibold text-red-500">
              {summary.red_count}R
            </span>
          )}
          {summary.green_count === 0 &&
           summary.amber_count === 0 &&
           summary.red_count === 0 && (
            <span className="text-xs lg:text-sm text-zinc-400">Not reviewed</span>
          )}
        </div>
      </div>

    </div>
  )
}