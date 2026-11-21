import Link from 'next/link'
import type { ActivityFeedItem } from '../services/activity-feed.service'
import { ArrowRight, ChevronRight } from 'lucide-react'

interface Props {
  items: ActivityFeedItem[]
}

// ── Health status badge ───────────────────────────────────────
function HealthBadge({ status }: { status: 'Green' | 'Amber' | 'Red' }) {
  const config = {
    Green: { dot: 'bg-emerald-500', text: 'text-emerald-800', bg: 'bg-emerald-50/80', border: 'border-emerald-200/80', label: 'On track' },
    Amber: { dot: 'bg-amber-400',   text: 'text-amber-800',   bg: 'bg-amber-50/80',   border: 'border-amber-200/80', label: 'Monitor'   },
    Red:   { dot: 'bg-rose-500',    text: 'text-rose-800',    bg: 'bg-rose-50/80',    border: 'border-rose-200/80', label: 'Attention' },
  }[status]

  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md border text-xs font-medium ${config.text} ${config.bg} ${config.border}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      {config.label}
    </span>
  )
}

// ── Arrow showing direction of change ────────────────────────
function StatusArrow({
  from,
  to,
}: {
  from: 'Green' | 'Amber' | 'Red' | null
  to: 'Green' | 'Amber' | 'Red'
}) {
  if (!from || from === to) return null

  const RANK = { Red: 0, Amber: 1, Green: 2 }
  const improved = RANK[to] > RANK[from]

  return (
    <span className={`text-xs font-medium ${improved ? 'text-emerald-700' : 'text-rose-700'}`}>
      {improved ? '↑' : '↓'}
    </span>
  )
}

// ── Relative time formatter ───────────────────────────────────
function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins  = Math.floor(diff / 60_000)
  const hours = Math.floor(diff / 3_600_000)
  const days  = Math.floor(diff / 86_400_000)

  if (mins < 1)   return 'Just now'
  if (mins < 60)  return `${mins}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days < 7)   return `${days}d ago`
  return new Date(dateStr).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short',
  })
}

export function RecentActivityFeed({ items }: Props) {
  return (
    <div className="space-y-4">

      {/* Section header */}
      <div className="flex items-center justify-between border-b border-zinc-200/80 pb-3">
        <div>
          <h2 className="text-lg sm:text-xl font-semibold text-zinc-950 tracking-tight">
            Recent portfolio activity
          </h2>
          <p className="text-xs text-zinc-500 mt-0.5">
            Latest health reviews across all active TVCLabs holdings
          </p>
        </div>
        <Link
          href="/companies"
          className="inline-flex items-center gap-1.5 px-3 h-9 rounded-lg border border-zinc-200 bg-white hover:bg-zinc-50 hover:border-zinc-300 text-xs font-medium text-zinc-700 transition-colors shadow-2xs"
        >
          <span>View all companies</span>
          <ArrowRight className="w-3.5 h-3.5 text-zinc-500" />
        </Link>
      </div>

      {/* Feed */}
      {items.length === 0 ? (
        <div className="rounded-2xl border border-zinc-200/80 bg-white px-8 py-12 text-center shadow-xs">
          <p className="text-sm font-medium text-zinc-700">No health reviews logged yet</p>
          <p className="text-xs text-zinc-500 mt-1">
            Open any company and update its portfolio health status to start the audit log.
          </p>
        </div>
      ) : (
        <div className="max-h-96 overflow-y-auto rounded-2xl border border-zinc-200/80 bg-white shadow-xs divide-y divide-zinc-100">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex items-start justify-between gap-4 px-5 py-4 hover:bg-zinc-50/50 transition-colors"
            >
              {/* Left — company + status change */}
              <div className="flex items-start gap-3 min-w-0">

                {/* Status indicator strip */}
                <div className={`
                  mt-0.5 w-1 self-stretch rounded-full shrink-0
                  ${{ Green: 'bg-emerald-500', Amber: 'bg-amber-400', Red: 'bg-rose-500' }[item.health_status]}
                `} />

                <div className="min-w-0 space-y-1.5">
                  {/* Company name */}
                  <Link
                    href={`/companies/${item.company_id}`}
                    className="text-sm font-semibold text-zinc-950 hover:text-zinc-700 transition-colors truncate block"
                  >
                    {item.company_name}
                  </Link>

                  {/* Status change */}
                  <div className="flex items-center gap-2 flex-wrap">
                    {item.previous_status && (
                      <>
                        <HealthBadge status={item.previous_status} />
                        <StatusArrow from={item.previous_status} to={item.health_status} />
                      </>
                    )}
                    <HealthBadge status={item.health_status} />
                    {!item.previous_status && (
                      <span className="text-xs text-zinc-500">Initial review</span>
                    )}
                  </div>

                  {/* Notes preview */}
                  {item.notes && (
                    <p className="text-xs text-zinc-600 line-clamp-2 leading-relaxed">
                      {item.notes}
                    </p>
                  )}
                </div>
              </div>

              {/* Right — reviewer + time */}
              <div className="text-right shrink-0 space-y-1.5">
                <p className="text-xs font-mono text-zinc-500">{timeAgo(item.reviewed_at)}</p>
                {item.reviewed_by_email && (
                  <p className="text-xs text-zinc-400 truncate max-w-[140px]">
                    {item.reviewed_by_email.split('@')[0]}
                  </p>
                )}
                <Link
                  href={`/companies/${item.company_id}`}
                  className="inline-flex items-center gap-1 text-xs font-medium text-zinc-600 hover:text-zinc-950 transition-colors"
                >
                  <span>Dossier</span>
                  <ChevronRight className="w-3 h-3 text-zinc-400" />
                </Link>
              </div>

            </div>
          ))}
        </div>
      )}
    </div>
  )
}
