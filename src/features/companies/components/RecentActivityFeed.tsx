// ─────────────────────────────────────────────────────────────
// RecentActivityFeed — server component
// Renders the last N portfolio health review entries on the
// internal dashboard. Matches existing dashboard visual language.
// ─────────────────────────────────────────────────────────────

import Link from 'next/link'
import type { ActivityFeedItem } from '../services/activity-feed.service'

interface Props {
  items: ActivityFeedItem[]
}

// ── Health status badge ───────────────────────────────────────
function HealthBadge({ status }: { status: 'Green' | 'Amber' | 'Red' }) {
  const config = {
    Green: { dot: 'bg-emerald-400', text: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200' },
    Amber: { dot: 'bg-amber-400',   text: 'text-amber-700',   bg: 'bg-amber-50',   border: 'border-amber-200'   },
    Red:   { dot: 'bg-red-400',     text: 'text-red-700',     bg: 'bg-red-50',     border: 'border-red-200'     },
  }[status]

  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded border text-xs font-medium ${config.text} ${config.bg} ${config.border}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      {status}
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
    <span className={`text-xs font-medium ${improved ? 'text-emerald-600' : 'text-red-500'}`}>
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

// ─────────────────────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────────────────────

export function RecentActivityFeed({ items }: Props) {
  return (
    <div className="space-y-4">

      {/* Section header — matches dashboard style */}
      <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
        <div>
          <h2 className="text-xl font-semibold text-zinc-900 tracking-tight">
            Recent Portfolio Activity
          </h2>
          <p className="text-xs text-zinc-400 mt-1 uppercase tracking-wider font-medium">
            Latest health reviews across all active assets
          </p>
        </div>
        <Link
          href="/companies"
          className="text-xs bg-blue-800 p-3 rounded-md text-white hover:bg-blue-900 transition-colors"
        >
          View all companies →
        </Link>
      </div>

      {/* Feed */}
      {items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-200 bg-zinc-50 px-8 py-12 text-center">
          <p className="text-sm font-medium text-zinc-500">No health reviews logged yet.</p>
          <p className="text-xs text-zinc-400 mt-1">
            Open any company and update its portfolio health status to start the log.
          </p>
        </div>
      ) : (
        <div className="max-h-96 overflow-y-auto rounded-xl border border-zinc-100 bg-white shadow-sm divide-y divide-zinc-50">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex items-start justify-between gap-4 px-5 py-4 hover:bg-zinc-50/60 transition-colors"
            >
              {/* Left — company + status change */}
              <div className="flex items-start gap-3 min-w-0">

                {/* Status indicator strip */}
                <div className={`
                  mt-0.5 w-1 self-stretch rounded-full shrink-0
                  ${{ Green: 'bg-emerald-400', Amber: 'bg-amber-400', Red: 'bg-red-400' }[item.health_status]}
                `} />

                <div className="min-w-0 space-y-1.5">
                  {/* Company name */}
                  <Link
                    href={`/companies/${item.company_id}`}
                    className="text-sm font-semibold text-zinc-900 hover:text-[#1a23bd] transition-colors truncate block"
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
                      <span className="text-xs text-zinc-400">Initial review</span>
                    )}
                  </div>

                  {/* Notes preview */}
                  {item.notes && (
                    <p className="text-xs text-zinc-500 line-clamp-2 leading-relaxed">
                      {item.notes}
                    </p>
                  )}
                </div>
              </div>

              {/* Right — reviewer + time */}
              <div className="text-right shrink-0 space-y-1">
                <p className="text-xs text-zinc-400">{timeAgo(item.reviewed_at)}</p>
                {item.reviewed_by_email && (
                  <p className="text-xs text-zinc-400 truncate max-w-[140px]">
                    {item.reviewed_by_email.split('@')[0]}
                  </p>
                )}
                <Link
                  href={`/companies/${item.company_id}`}
                  className="text-xs bg-blue-800 p-2 rounded-md text-white hover:bg-blue-900 transition-colors"
                >
                  View →
                </Link>
              </div>

            </div>
          ))}
        </div>
      )}
    </div>
  )
}