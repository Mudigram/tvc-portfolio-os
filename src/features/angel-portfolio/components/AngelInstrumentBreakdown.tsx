import type { AngelPosition } from '@/features/angel-portfolio/types'

interface AngelInstrumentBreakdownProps {
  positions: AngelPosition[]
  blendedInvested: number
  blendedOwnership: number
  blendedCurrentValue?: number
  blendedMoic?: number | null
}

function formatCurrency(n: number | null): string {
  if (!n) return '—'
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(n)
}

function formatPct(n: number | null): string {
  if (!n || n === 0) return '—'
  return `${n.toFixed(2)}%`
}

function roundLabel(issueDate: string | null): string {
  if (!issueDate) return '—'
  return new Date(issueDate).getFullYear().toString()
}

export function AngelInstrumentBreakdown({
  positions,
  blendedInvested,
  blendedOwnership,
  blendedCurrentValue,
  blendedMoic,
}: AngelInstrumentBreakdownProps) {
  if (positions.length <= 1) return null

  return (
    <div className="w-full overflow-x-auto scrollbar-thin -mx-4 px-4 sm:mx-0 sm:px-0">
      <table className="w-full text-xs min-w-[500px]">
        <thead>
          <tr className="text-zinc-500 border-b border-zinc-200/80">
            <th className="text-left font-medium pb-2.5 text-xs text-zinc-500">Round</th>
            <th className="text-left font-medium pb-2.5 text-xs text-zinc-500">Instrument</th>
            <th className="text-right font-medium pb-2.5 text-xs text-zinc-500">Invested</th>
            <th className="text-right font-medium pb-2.5 text-xs text-zinc-500">Est. value</th>
            <th className="text-right font-medium pb-2.5 text-xs text-zinc-500">Ownership</th>
            <th className="text-right font-medium pb-2.5 text-xs text-zinc-500">Return</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100">
          {positions.map((p) => (
            <tr key={p.exposure_id} className="hover:bg-zinc-50/60 transition-colors">
              <td className="py-2.5 font-normal text-zinc-600">{roundLabel(p.issue_date)}</td>
              <td className="py-2.5 font-medium text-zinc-900">
                <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-zinc-100 text-zinc-800 text-xs">
                  {p.instrument_name ?? p.exposure_type}
                </span>
              </td>
              <td className="py-2.5 text-right font-medium text-zinc-950 tabular-nums">
                {formatCurrency(p.amount_invested)}
              </td>
              <td className="py-2.5 text-right font-medium text-zinc-950 tabular-nums">
                {formatCurrency(p.current_value ?? p.amount_invested)}
              </td>
              <td className="py-2.5 text-right font-normal text-zinc-700 tabular-nums font-mono">
                {formatPct(p.ownership_pct)}
              </td>
              <td className="py-2.5 text-right tabular-nums">
                {p.moic !== null && p.moic !== undefined ? (
                  <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-mono font-medium border ${
                    p.moic > 1.05
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200/80'
                      : p.moic < 0.95
                      ? 'bg-rose-50 text-rose-800 border-rose-200/80'
                      : 'bg-zinc-100 text-zinc-700 border-zinc-200/80'
                  }`}>
                    {p.moic.toFixed(1)}x
                  </span>
                ) : (
                  <span className="text-zinc-400">—</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="border-t border-zinc-200 bg-zinc-50/40">
            <td colSpan={2} className="py-3 pl-2 text-xs font-semibold text-zinc-900">
              Blended total
            </td>
            <td className="py-3 text-right text-xs font-semibold text-zinc-950 tabular-nums">
              {formatCurrency(blendedInvested)}
            </td>
            <td className="py-3 text-right text-xs font-semibold text-zinc-950 tabular-nums">
              {formatCurrency(blendedCurrentValue ?? blendedInvested)}
            </td>
            <td className="py-3 text-right text-xs font-semibold text-zinc-900 tabular-nums font-mono">
              {formatPct(blendedOwnership)}
            </td>
            <td className="py-3 pr-2 text-right text-xs font-semibold tabular-nums">
              {blendedMoic !== null && blendedMoic !== undefined ? (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-mono font-semibold bg-zinc-100 text-zinc-900 border border-zinc-200/80">
                  {blendedMoic.toFixed(1)}x
                </span>
              ) : '—'}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  )
}
