import type { AngelActivityEvent } from '@/features/angel-portfolio/types'

interface AngelPulseRibbonProps {
  events: AngelActivityEvent[]
}

export function AngelPulseRibbon({ events }: AngelPulseRibbonProps) {
  const submittedCount = events.filter(
    (e) => e.event_type === 'update_submitted'
  ).length

  const healthChanges = events.filter(
    (e) => e.event_type === 'health_changed'
  )

  if (submittedCount === 0 && healthChanges.length === 0) return null

  return (
    <div className="space-y-1.5 pb-4 mb-4 border-b border-zinc-100">
      {submittedCount > 0 && (
        <p className="text-xs text-zinc-500">
          <span className="text-emerald-600 font-medium">✓ {submittedCount}</span>{' '}
          {submittedCount === 1 ? 'update' : 'updates'} submitted this cycle
        </p>
      )}
      {healthChanges.length > 0 && (
        <p className="text-xs text-zinc-500">
          <span className="text-amber-600 font-medium">
            ⚠ {healthChanges.length}
          </span>{' '}
          health status {healthChanges.length === 1 ? 'change' : 'changes'}
        </p>
      )}
    </div>
  )
}