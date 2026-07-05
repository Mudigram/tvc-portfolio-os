// ─────────────────────────────────────────────────────────────
// FundingRoundHistoryCard — read-only, shown inside Exposure tab
// Gives Korede round context without leaving the tab.
// Editing/adding rounds is done on the Funding tab.
// ─────────────────────────────────────────────────────────────

import type { FundingRound } from '@/features/funding/types'

interface Props {
  rounds: FundingRound[]
}

function formatUSD(val: number | null): string {
  if (val === null || isNaN(val)) return '—'
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(val)
}

function formatDate(val: string | null): string {
  if (!val) return '—'
  return new Date(val).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

const ROUND_BADGE: Record<string, string> = {
  'Pre-seed': 'text-zinc-600 bg-zinc-100 border-zinc-200',
  'Seed':     'text-blue-700 bg-blue-50 border-blue-200',
  'Series A': 'text-violet-700 bg-violet-50 border-violet-200',
  'Series B': 'text-indigo-700 bg-indigo-50 border-indigo-200',
  'Series C': 'text-emerald-700 bg-emerald-50 border-emerald-200',
  'Bridge':   'text-amber-700 bg-amber-50 border-amber-200',
  'Debt':     'text-orange-700 bg-orange-50 border-orange-200',
  'Grant':    'text-teal-700 bg-teal-50 border-teal-200',
}

function RoundBadge({ name }: { name: string }) {
  const style = ROUND_BADGE[name] ?? 'text-zinc-600 bg-zinc-100 border-zinc-200'
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded border text-xs font-medium ${style}`}>
      {name}
    </span>
  )
}

export function FundingRoundHistoryCard({ rounds }: Props) {
  // Total raised across all rounds
  const totalRaised = rounds.reduce(
    (sum, r) => sum + (Number(r.amount_raised) || 0), 0,
  )
  const latestRound = rounds.at(0) ?? null

  return (
    <div className="rounded-xl border border-zinc-100 bg-white shadow-sm overflow-hidden">

      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-50">
        <div>
          <h3 className="text-xs font-semibold text-zinc-800">
            Funding round history
          </h3>
          <p className="text-xs text-zinc-400 mt-0.5">
            Read-only — manage rounds on the Funding tab
          </p>
        </div>

        {/* Quick stats */}
        <div className="flex items-center gap-6">
          {latestRound && (
            <div className="text-right">
              <p className="text-[11px] font-medium text-zinc-400 uppercase tracking-wide">
                Latest round
              </p>
              <div className="flex items-center gap-1.5 mt-0.5 justify-end">
                <RoundBadge name={latestRound.round_name} />
                <span className="text-sm font-semibold text-zinc-900">
                  {formatUSD(latestRound.amount_raised)}
                </span>
              </div>
            </div>
          )}
          <div className="text-right border-l border-zinc-100 pl-6">
            <p className="text-[11px] font-medium text-zinc-400 uppercase tracking-wide">
              Total raised
            </p>
            <p className="text-sm font-semibold text-zinc-900 mt-0.5">
              {totalRaised > 0 ? formatUSD(totalRaised) : '—'}
            </p>
          </div>
        </div>
      </div>

      {/* Table or empty state */}
      {rounds.length === 0 ? (
        <div className="px-5 py-8 text-center">
          <p className="text-sm text-zinc-400">No funding rounds recorded yet.</p>
          <p className="text-xs text-zinc-400 mt-1">
            Add rounds on the{' '}
            <span className="text-[#1a23bd]">Funding tab</span>.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-50">
                {['Round', 'Amount raised', 'Post-money valuation', 'Lead investor', 'Closed'].map(
                  (col) => (
                    <th
                      key={col}
                      className="px-5 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wide whitespace-nowrap"
                    >
                      {col}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-50">
              {rounds.map((round) => (
                <tr key={round.id} className="hover:bg-zinc-50/60 transition-colors">
                  <td className="px-5 py-3 whitespace-nowrap">
                    <RoundBadge name={round.round_name} />
                  </td>
                  <td className="px-5 py-3 text-zinc-900 font-medium tabular-nums whitespace-nowrap">
                    {formatUSD(round.amount_raised)}
                  </td>
                  <td className="px-5 py-3 text-zinc-600 tabular-nums whitespace-nowrap">
                    {formatUSD(round.post_money_valuation ?? null)}
                  </td>
                  <td className="px-5 py-3 text-zinc-500 whitespace-nowrap">
                    {round.lead_investor || '—'}
                  </td>
                  <td className="px-5 py-3 text-zinc-400 whitespace-nowrap">
                    {formatDate(round.date_closed)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}