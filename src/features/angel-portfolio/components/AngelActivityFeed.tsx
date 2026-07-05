import type { AngelActivityEvent } from '@/features/angel-portfolio/types'

interface AngelActivityFeedProps {
  events: AngelActivityEvent[]
}

const EVENT_STYLES: Record<string, { dot: string; label: string }> = {
  health_changed:  { dot: 'bg-amber-400',   label: 'text-amber-700' },
  health_reviewed: { dot: 'bg-zinc-300',    label: 'text-zinc-500' },
  update_submitted:{ dot: 'bg-emerald-400', label: 'text-emerald-700' },
  raise_started:   { dot: 'bg-blue-400',    label: 'text-blue-700' },
  raise_ended:     { dot: 'bg-zinc-400',    label: 'text-zinc-600' },
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  if (days === 0) return 'Today'
  if (days === 1) return 'Yesterday'
  if (days < 7) return `${days} days ago`
  if (days < 30) return `${Math.floor(days / 7)}w ago`
  return `${Math.floor(days / 30)}mo ago`
}

export function AngelActivityFeed({ events }: AngelActivityFeedProps) {
  if (events.length === 0) {
    return (
      <div className="py-8 text-center">
        <p className="text-sm text-zinc-400">No recent activity.</p>
      </div>
    )
  }

  return (
    <div className="space-y-0">
      {events.map((event, index) => {
        const style = EVENT_STYLES[event.event_type] ?? EVENT_STYLES.health_reviewed
        const isLast = index === events.length - 1

        return (
          <div key={event.id} className="flex gap-4">

            {/* Timeline spine */}
            <div className="flex flex-col items-center">
              <div className={`
                w-2 h-2 rounded-full mt-1.5 shrink-0 ${style.dot}
              `} />
              {!isLast && (
                <div className="w-px flex-1 bg-zinc-100 mt-1" />
              )}
            </div>

            {/* Event content */}
            <div className={`pb-5 min-w-0 ${isLast ? '' : ''}`}>
              <p className="text-sm text-zinc-800 leading-snug">
                {event.label}
              </p>
              {event.detail && (
                <p className={`text-xs font-medium mt-0.5 ${style.label}`}>
                  {event.detail}
                </p>
              )}
              <p className="text-xs text-zinc-400 mt-1">
                {timeAgo(event.occurred_at)}
              </p>
            </div>

          </div>
        )
      })}
    </div>
  )
}