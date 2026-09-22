// ─────────────────────────────────────────────────────────────
// CampaignHistory — read-only send history
// Server component. Shows last 50 sent campaigns.
// ─────────────────────────────────────────────────────────────

import { EMAIL_TYPE_CONFIG, RECIPIENT_POOL_CONFIG } from '../types'
import type { CampaignHistoryRow, RecipientPool } from '../types'
import { Send } from 'lucide-react'
import { Card } from '@/components/ui/card'

interface Props {
  campaigns: CampaignHistoryRow[]
}

function formatDate(d: string | null): string {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const STATUS_STYLES = {
  sent:   'text-emerald-700 bg-emerald-50 border-emerald-200',
  failed: 'text-red-600 bg-red-50 border-red-200',
  draft:  'text-zinc-500 bg-zinc-50 border-zinc-200',
}

export default function CampaignHistory({ campaigns }: Props) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
        <div>
          <h2 className="text-base font-semibold text-zinc-900">Send history</h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Last {campaigns.length} sent campaign{campaigns.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {campaigns.length === 0 ? (
        <Card className="p-12 flex flex-col items-center justify-center text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-muted/60 border border-border flex items-center justify-center mb-1">
            <Send className="w-5 h-5 text-muted-foreground" />
          </div>
          <h3 className="text-sm font-semibold text-foreground">No campaigns sent yet</h3>
          <p className="text-xs text-muted-foreground max-w-sm">
            Compose and send your first dispatch to angels, founders, or portfolio companies using the console above.
          </p>
        </Card>
      ) : (
        <div className="rounded-xl border border-zinc-100 bg-white shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-50">
                  {[
                    'Title',
                    'Type',
                    'Subject',
                    'Pools',
                    'Recipients',
                    'Sent by',
                    'Sent at',
                    'Status',
                  ].map((col) => (
                    <th
                      key={col}
                      className="px-5 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wide whitespace-nowrap"
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-50">
                {campaigns.map((c) => {
                  const pools = (c.recipient_pools ?? []) as RecipientPool[]
                  return (
                    <tr key={c.id} className="hover:bg-zinc-50/60 transition-colors">
                      <td className="px-5 py-4 font-medium text-zinc-900 whitespace-nowrap max-w-[180px] truncate">
                        {c.title}
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        <span className="text-xs text-zinc-500">
                          {EMAIL_TYPE_CONFIG[c.email_type]?.label ?? c.email_type}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-zinc-600 max-w-[200px] truncate">
                        {c.subject}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex flex-wrap gap-1">
                          {pools.length === 0 ? (
                            <span className="text-xs text-zinc-400">Individual only</span>
                          ) : (
                            pools.map((pool) => (
                              <span
                                key={pool}
                                className="inline-flex items-center px-1.5 py-0.5 rounded border text-xs font-medium text-zinc-600 bg-zinc-50 border-zinc-200 whitespace-nowrap"
                              >
                                {RECIPIENT_POOL_CONFIG[pool]?.label ?? pool}
                              </span>
                            ))
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-4 text-zinc-700 tabular-nums whitespace-nowrap">
                        {c.recipient_count ?? '—'}
                      </td>
                      <td className="px-5 py-4 text-zinc-500 whitespace-nowrap text-xs">
                        {c.sender_email?.split('@')[0] ?? '—'}
                      </td>
                      <td className="px-5 py-4 text-zinc-400 whitespace-nowrap text-xs">
                        {formatDate(c.sent_at)}
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded border text-xs font-medium ${STATUS_STYLES[c.status]}`}>
                          {c.status.charAt(0).toUpperCase() + c.status.slice(1)}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}