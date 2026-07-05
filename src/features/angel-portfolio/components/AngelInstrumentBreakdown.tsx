import type { AngelPosition } from '@/features/angel-portfolio/types'

interface AngelInstrumentBreakdownProps {
  positions: AngelPosition[]
  blendedInvested: number
  blendedOwnership: number
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
}: AngelInstrumentBreakdownProps) {
  // Single instrument — no breakdown needed, render nothing here
  // (the card already shows the single position inline)
  if (positions.length <= 1) return null

  return (
    <div className="space-y-2">
      <table className="w-full text-xs">
        <thead>
          <tr className="text-zinc-400 border-b border-zinc-50">
            <th className="text-left font-medium pb-1.5">Round</th>
            <th className="text-left font-medium pb-1.5">Instrument</th>
            <th className="text-right font-medium pb-1.5">Invested</th>
            <th className="text-right font-medium pb-1.5">Ownership</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-50">
          {positions.map((p) => (
            <tr key={p.exposure_id}>
              <td className="py-1.5 text-zinc-500">{roundLabel(p.issue_date)}</td>
              <td className="py-1.5 text-zinc-700">
                {p.instrument_name ?? p.exposure_type}
              </td>
              <td className="py-1.5 text-right text-zinc-900 tabular-nums">
                {formatCurrency(p.amount_invested)}
              </td>
              <td className="py-1.5 text-right text-zinc-700 tabular-nums">
                {formatPct(p.ownership_pct)}
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="border-t border-zinc-100">
            <td colSpan={2} className="pt-2 text-xs font-medium text-zinc-900">
              Blended total
            </td>
            <td className="pt-2 text-right text-xs font-medium text-zinc-900 tabular-nums">
              {formatCurrency(blendedInvested)}
            </td>
            <td className="pt-2 text-right text-xs font-medium text-zinc-900 tabular-nums">
              {formatPct(blendedOwnership)}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  )
}