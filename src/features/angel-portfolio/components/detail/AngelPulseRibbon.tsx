import type { AngelActivityEvent } from '@/features/angel-portfolio/types'
import { CheckCircle2, AlertTriangle } from 'lucide-react'

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
    <div className="space-y-2 pb-4 mb-4 border-b border-zinc-100">
      {submittedCount > 0 && (
        <div className="flex items-center gap-2 text-xs text-zinc-600">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          <span>
            <strong className="text-zinc-900 font-semibold">{submittedCount}</strong>{' '}
            {submittedCount === 1 ? 'briefing' : 'briefings'} submitted this cycle
          </span>
        </div>
      )}
      {healthChanges.length > 0 && (
        <div className="flex items-center gap-2 text-xs text-zinc-600">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
          <span>
            <strong className="text-zinc-900 font-semibold">{healthChanges.length}</strong>{' '}
            portfolio health {healthChanges.length === 1 ? 'change' : 'changes'}
          </span>
        </div>
      )}
    </div>
  )
}