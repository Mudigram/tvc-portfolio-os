import type { DDRStatusSummary } from '@/features/founder-portal/types'

function formatDate(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
  })
}

interface FounderDDRStatusProps {
  ddr: DDRStatusSummary | null
}

// Deliberately minimal — this is a status read only.
// DDR will become a separate platform; this component is a future seam.
// No upload UI, no document tracking, no review workflow lives here.
export function FounderDDRStatus({ ddr }: FounderDDRStatusProps) {
  return (
    <div className="flex items-center justify-between px-4 py-3 rounded-lg border border-zinc-100 bg-zinc-50">
      <div>
        <p className="text-xs font-medium text-zinc-400 uppercase tracking-wide">
          DDR status
        </p>
        <p className="text-sm text-zinc-700 mt-0.5">
          {ddr?.status ?? 'Not yet started'}
        </p>
      </div>
      {ddr?.updated_at && (
        <p className="text-xs text-zinc-400">
          Updated {formatDate(ddr.updated_at)}
        </p>
      )}
    </div>
  )
}