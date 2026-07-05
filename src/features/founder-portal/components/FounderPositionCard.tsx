import type { FounderPosition } from '@/features/founder-portal/types'

function formatPct(n: number | null): string {
  if (!n || n === 0) return '—'
  return `${n.toFixed(2)}%`
}

function formatDate(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
  })
}

interface FounderPositionCardProps {
  positions: FounderPosition[]
}

export function FounderPositionCard({ positions }: FounderPositionCardProps) {
  if (positions.length === 0) {
    return (
      <div className="rounded-lg border border-zinc-100 p-5">
        <p className="text-sm text-zinc-400">
          No equity position on record. Contact TVCLabs if this looks incorrect.
        </p>
      </div>
    )
  }

  const totalOwnership = positions.reduce(
    (sum, p) => sum + (p.ownership_pct ?? 0), 0
  )

  return (
    <div className="rounded-lg border border-zinc-100 p-5 space-y-4">
      {positions.map((p) => (
        <div key={p.exposure_id} className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-zinc-900">
              {p.instrument_name ?? p.exposure_type}
            </p>
            <p className="text-xs text-zinc-400">
              Issued {formatDate(p.issue_date)}
            </p>
          </div>
          <p className="text-sm font-medium text-zinc-700 tabular-nums">
            {formatPct(p.ownership_pct)}
          </p>
        </div>
      ))}

      {positions.length > 1 && (
        <div className="flex items-center justify-between pt-3 border-t border-zinc-100">
          <p className="text-xs font-medium text-zinc-900">Total ownership</p>
          <p className="text-sm font-medium text-zinc-900 tabular-nums">
            {formatPct(totalOwnership)}
          </p>
        </div>
      )}
    </div>
  )
}