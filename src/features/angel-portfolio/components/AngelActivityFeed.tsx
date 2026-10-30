import Link from 'next/link'
import type { AngelActivityEvent } from '@/features/angel-portfolio/types'
import { FileText, ShieldAlert, Sparkles, TrendingUp, CheckCircle2 } from 'lucide-react'

interface AngelActivityFeedProps {
  events: AngelActivityEvent[]
  onItemClick?: () => void
}

const EVENT_CONFIG: Record<string, { icon: typeof FileText; bg: string; text: string; dot: string }> = {
  health_changed:   { icon: ShieldAlert,  bg: 'bg-amber-50',   text: 'text-amber-800', dot: 'bg-amber-500' },
  health_reviewed:  { icon: CheckCircle2, bg: 'bg-zinc-100',   text: 'text-zinc-700',  dot: 'bg-zinc-400' },
  update_submitted: { icon: FileText,     bg: 'bg-emerald-50', text: 'text-emerald-800', dot: 'bg-emerald-500' },
  raise_started:    { icon: Sparkles,     bg: 'bg-blue-50',    text: 'text-blue-800',  dot: 'bg-blue-500' },
  raise_ended:      { icon: TrendingUp,   bg: 'bg-zinc-100',   text: 'text-zinc-700',  dot: 'bg-zinc-400' },
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  if (days === 0) return 'Today'
  if (days === 1) return 'Yesterday'
  if (days < 7) return `${days}d ago`
  if (days < 30) return `${Math.floor(days / 7)}w ago`
  return `${Math.floor(days / 30)}mo ago`
}

export function AngelActivityFeed({ events, onItemClick }: AngelActivityFeedProps) {
  if (events.length === 0) {
    return (
      <div className="py-12 text-center">
        <p className="text-sm text-zinc-500">No activity recorded in the past 90 days.</p>
        <p className="text-xs text-zinc-600 mt-1">Updates and health reviews will appear here automatically.</p>
      </div>
    )
  }

  return (
    <div className="space-y-0">
      {events.map((event, index) => {
        const config = EVENT_CONFIG[event.event_type] ?? EVENT_CONFIG.health_reviewed
        const Icon = config.icon
        const isLast = index === events.length - 1

        const content = (
          <div className="group flex gap-3.5 p-2 rounded-xl hover:bg-zinc-50 transition-colors">
            {/* Timeline node */}
            <div className="flex flex-col items-center">
              <div className={`w-7 h-7 rounded-lg ${config.bg} flex items-center justify-center shrink-0 border border-zinc-200/60`}>
                <Icon className={`w-3.5 h-3.5 ${config.text}`} />
              </div>
              {!isLast && (
                <div className="w-px flex-1 bg-zinc-200 mt-2" />
              )}
            </div>

            {/* Event detail */}
            <div className="pb-4 min-w-0 flex-1">
              <div className="flex items-start justify-between gap-2">
                <p className="text-xs font-semibold text-zinc-900 group-hover:text-blue-600 transition-colors leading-snug">
                  {event.label}
                </p>
                <span className="text-[11px] font-mono text-zinc-600 shrink-0">
                  {timeAgo(event.occurred_at)}
                </span>
              </div>
              {event.detail && (
                <p className={`text-xs font-medium mt-0.5 ${config.text}`}>
                  {event.detail}
                </p>
              )}
              <span className="inline-flex items-center text-[11px] text-zinc-600 font-medium mt-1">
                {event.company_name}
              </span>
            </div>
          </div>
        )

        return event.company_id ? (
          <Link
            key={event.id}
            href={`/portfolio/${event.company_id}`}
            onClick={onItemClick}
            className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 rounded-xl"
          >
            {content}
          </Link>
        ) : (
          <div key={event.id}>{content}</div>
        )
      })}
    </div>
  )
}