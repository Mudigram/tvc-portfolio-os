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
          <tr className="text-zinc-500 border-b border-zinc-200">
            <th className="text-left font-semibold pb-2 uppercase tracking-wider text-[11px]">Round</th>
            <th className="text-left font-semibold pb-2 uppercase tracking-wider text-[11px]">Instrument</th>
            <th className="text-right font-semibold pb-2 uppercase tracking-wider text-[11px]">Invested</th>
            <th className="text-right font-semibold pb-2 uppercase tracking-wider text-[11px]">Est. Value</th>
            <th className="text-right font-semibold pb-2 uppercase tracking-wider text-[11px]">Ownership</th>
            <th className="text-right font-semibold pb-2 uppercase tracking-wider text-[11px]">Return</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100">
          {positions.map((p) => (
            <tr key={p.exposure_id} className="hover:bg-zinc-50/60 transition-colors">
              <td className="py-2.5 font-medium text-zinc-600">{roundLabel(p.issue_date)}</td>
              <td className="py-2.5 font-semibold text-zinc-900">
                <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-zinc-100 text-zinc-800 text-xs">
                  {p.instrument_name ?? p.exposure_type}
                </span>
              </td>
              <td className="py-2.5 text-right font-semibold text-zinc-900 tabular-nums">
                {formatCurrency(p.amount_invested)}
              </td>
              <td className="py-2.5 text-right font-semibold text-zinc-900 tabular-nums">
                {formatCurrency(p.current_value ?? p.amount_invested)}
              </td>
              <td className="py-2.5 text-right font-medium text-zinc-700 tabular-nums">
                {formatPct(p.ownership_pct)}
              </td>
              <td className="py-2.5 text-right tabular-nums">
                {p.moic !== null && p.moic !== undefined ? (
                  <span className={`inline-flex items-center px-1.5 py-0.2 rounded text-[11px] font-bold ${
                    p.moic > 1.05
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      : p.moic < 0.95
                      ? 'bg-red-50 text-red-800 border border-red-200'
                      : 'bg-zinc-100 text-zinc-700'
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
          <tr className="border-t-2 border-zinc-200 bg-zinc-50/50">
            <td colSpan={2} className="py-3 pl-2 text-xs font-bold text-zinc-900">
              Blended Total
            </td>
            <td className="py-3 text-right text-xs font-bold text-zinc-900 tabular-nums">
              {formatCurrency(blendedInvested)}
            </td>
            <td className="py-3 text-right text-xs font-bold text-zinc-900 tabular-nums">
              {formatCurrency(blendedCurrentValue ?? blendedInvested)}
            </td>
            <td className="py-3 text-right text-xs font-bold text-blue-700 tabular-nums">
              {formatPct(blendedOwnership)}
            </td>
            <td className="py-3 pr-2 text-right text-xs font-bold tabular-nums">
              {blendedMoic !== null && blendedMoic !== undefined ? (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-blue-50 text-blue-800 border border-blue-200">
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