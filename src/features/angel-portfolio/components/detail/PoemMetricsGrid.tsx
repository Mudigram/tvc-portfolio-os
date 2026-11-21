'use client'

import { useState } from 'react'
import type { AngelMonthlyUpdateItem } from '@/features/angel-portfolio/types'
import {
  TrendingUp,
  Users,
  DollarSign,
  Flag,
  Calendar,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  ShieldCheck,
} from 'lucide-react'

interface PoemMetricsGridProps {
  updates: AngelMonthlyUpdateItem[]
  companyName: string
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

function formatCurrency(n: number | null | undefined): string {
  if (n == null || isNaN(n)) return '—'
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    notation: n >= 1000000 ? 'compact' : 'standard',
    maximumFractionDigits: 1,
  }).format(n)
}

function formatPct(n: number | null | undefined): string {
  if (n == null || isNaN(n)) return '—'
  return `${n > 0 ? '+' : ''}${n.toFixed(1)}%`
}

function formatNumber(n: number | null | undefined): string {
  if (n == null || isNaN(n)) return '—'
  return new Intl.NumberFormat('en-US').format(n)
}

export function PoemMetricsGrid({ updates, companyName }: PoemMetricsGridProps) {
  // Sort descending
  const sorted = [...updates].sort((a, b) => {
    const yDiff = (b.year || 0) - (a.year || 0)
    if (yDiff !== 0) return yDiff
    return (b.month || 0) - (a.month || 0)
  })

  const [selectedIndex, setSelectedIndex] = useState(0)

  if (sorted.length === 0) {
    return (
      <div className="rounded-2xl border border-zinc-200/80 bg-white p-8 text-center space-y-2 shadow-xs">
        <p className="text-sm font-medium text-zinc-900">No POEM metrics recorded yet</p>
        <p className="text-xs text-zinc-500 max-w-sm mx-auto">
          Operational reporting for {companyName} will appear here once the founder or portfolio manager records monthly KPIs.
        </p>
      </div>
    )
  }

  const current = sorted[selectedIndex] || sorted[0]
  const previous = sorted[selectedIndex + 1] || null

  const periodLabel = current.month && current.year
    ? `${MONTH_NAMES[current.month - 1]} ${current.year}`
    : 'Latest update'

  // MoM deltas
  const revGrowth = current.monthly_revenue && previous?.monthly_revenue
    ? ((current.monthly_revenue - previous.monthly_revenue) / previous.monthly_revenue) * 100
    : current.revenue_growth_pct

  const userGrowth = current.active_customers && previous?.active_customers
    ? ((current.active_customers - previous.active_customers) / previous.active_customers) * 100
    : current.monthly_user_growth_pct

  return (
    <div className="space-y-6">
      {/* Top Bar: Selector & Period Status */}
      <div className="bg-white rounded-2xl border border-zinc-200/80 p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-zinc-100 border border-zinc-200 flex items-center justify-center text-zinc-700 shrink-0">
            <Calendar className="w-4 h-4" />
          </div>
          <div>
            <span className="text-xs font-normal text-zinc-500">
              Operating metrics
            </span>
            <div className="flex items-center gap-2 mt-0.5">
              <h3 className="text-sm sm:text-base font-semibold text-zinc-950">
                POEM KPI matrix — {periodLabel}
              </h3>
              {current.status === 'Verified' && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-emerald-50 text-emerald-800 border border-emerald-200/80">
                  <ShieldCheck className="w-3 h-3 text-emerald-600" />
                  Verified
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Month Dropdown Selector */}
        <div className="flex items-center justify-between sm:justify-start gap-2 w-full sm:w-auto pt-3 sm:pt-0 border-t sm:border-t-0 border-zinc-100">
          <label className="text-xs font-medium text-zinc-500 whitespace-nowrap">Period:</label>
          <select
            value={selectedIndex}
            onChange={(e) => setSelectedIndex(Number(e.target.value))}
            className="h-9 rounded-lg border border-zinc-200 bg-white px-2.5 text-xs font-medium text-zinc-800 focus:outline-none focus:ring-1 focus:ring-zinc-900 cursor-pointer shadow-2xs"
          >
            {sorted.map((u, idx) => {
              const label = u.month && u.year ? `${MONTH_NAMES[u.month - 1]} ${u.year}` : `Update #${idx + 1}`
              return (
                <option key={u.id || idx} value={idx}>
                  {label} {idx === 0 ? '(Latest)' : ''}
                </option>
              )
            })}
          </select>
        </div>
      </div>

      {/* 4-Quadrant POEM Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
        {/* ── 1. PROPOSITION ────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-zinc-200/80 shadow-2xs overflow-hidden flex flex-col">
          <div className="p-4 sm:p-5 border-b border-zinc-100 bg-zinc-50/50 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-zinc-100 border border-zinc-200 flex items-center justify-center text-zinc-700">
                <TrendingUp className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-semibold text-zinc-950">
                  1. Proposition
                </h4>
                <p className="text-xs text-zinc-500 mt-0.5">Market traction and customer dynamics</p>
              </div>
            </div>
            {userGrowth != null && (
              <span className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded text-xs font-mono tabular-nums border ${
                userGrowth >= 0
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200/80'
                  : 'bg-rose-50 text-rose-800 border-rose-200/80'
              }`}>
                {userGrowth >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                {formatPct(userGrowth)} MoM
              </span>
            )}
          </div>

          <div className="p-4 sm:p-5 grid grid-cols-2 gap-3 sm:gap-4 flex-1">
            <div className="bg-zinc-50/50 rounded-xl p-3 border border-zinc-100">
              <span className="text-xs text-zinc-500">Active customers</span>
              <p className="text-base font-semibold text-zinc-950 mt-1 tabular-nums">
                {formatNumber(current.active_customers)}
              </p>
            </div>
            <div className="bg-zinc-50/50 rounded-xl p-3 border border-zinc-100">
              <span className="text-xs text-zinc-500">Paying customers</span>
              <p className="text-base font-semibold text-zinc-950 mt-1 tabular-nums">
                {formatNumber(current.paying_customers)}
              </p>
            </div>
            <div className="bg-zinc-50/50 rounded-xl p-3 border border-zinc-100">
              <span className="text-xs text-zinc-500">User growth (%)</span>
              <p className="text-base font-semibold text-zinc-950 mt-1 tabular-nums">
                {current.monthly_user_growth_pct != null ? `${current.monthly_user_growth_pct}%` : '—'}
              </p>
            </div>
            <div className="bg-zinc-50/50 rounded-xl p-3 border border-zinc-100">
              <span className="text-xs text-zinc-500">Revenue growth (%)</span>
              <p className="text-base font-semibold text-zinc-950 mt-1 tabular-nums">
                {current.revenue_growth_pct != null ? `${current.revenue_growth_pct}%` : '—'}
              </p>
            </div>
            <div className="bg-zinc-50/50 rounded-xl p-3 border border-zinc-100">
              <span className="text-xs text-zinc-500">Churn rate</span>
              <p className="text-base font-semibold text-zinc-950 mt-1 tabular-nums">
                {current.churn_rate_pct != null ? `${current.churn_rate_pct}%` : '—'}
              </p>
            </div>
            <div className="bg-zinc-50/50 rounded-xl p-3 border border-zinc-100">
              <span className="text-xs text-zinc-500">Retention rate</span>
              <p className="text-base font-semibold text-zinc-950 mt-1 tabular-nums">
                {current.retention_rate_pct != null ? `${current.retention_rate_pct}%` : '—'}
              </p>
            </div>
          </div>
        </div>

        {/* ── 2. ORGANIZATION ───────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-zinc-200/80 shadow-2xs overflow-hidden flex flex-col">
          <div className="p-4 sm:p-5 border-b border-zinc-100 bg-zinc-50/50 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-zinc-100 border border-zinc-200 flex items-center justify-center text-zinc-700">
                <Users className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-semibold text-zinc-950">
                  2. Organization
                </h4>
                <p className="text-xs text-zinc-500 mt-0.5">Talent, commitment and governance</p>
              </div>
            </div>
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-mono font-medium bg-zinc-100 text-zinc-800 border border-zinc-200/80">
              {current.team_size ? `${current.team_size} team members` : 'Team profile'}
            </span>
          </div>

          <div className="p-4 sm:p-5 grid grid-cols-2 gap-3 sm:gap-4 flex-1">
            <div className="bg-zinc-50/50 rounded-xl p-3 border border-zinc-100">
              <span className="text-xs text-zinc-500">Team size</span>
              <p className="text-base font-semibold text-zinc-950 mt-1 tabular-nums">
                {current.team_size != null ? `${current.team_size} FTE` : '—'}
              </p>
            </div>
            <div className="bg-zinc-50/50 rounded-xl p-3 border border-zinc-100">
              <span className="text-xs text-zinc-500">Founder commitment</span>
              <p className="text-base font-semibold text-zinc-950 mt-1 truncate">
                {current.founder_commitment || 'Full-time'}
              </p>
            </div>
            <div className="bg-zinc-50/50 rounded-xl p-3 border border-zinc-100">
              <span className="text-xs text-zinc-500">Reporting consistency</span>
              <p className="text-base font-semibold text-zinc-950 mt-1">
                {current.reporting_consistency || 'High'}
              </p>
            </div>
            <div className="bg-zinc-50/50 rounded-xl p-3 border border-zinc-100">
              <span className="text-xs text-zinc-500">Reporting compliance</span>
              <p className="text-base font-semibold text-zinc-950 mt-1">
                {current.reporting_compliance || 'Compliant'}
              </p>
            </div>
          </div>
        </div>

        {/* ── 3. ECONOMICS ──────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-zinc-200/80 shadow-2xs overflow-hidden flex flex-col">
          <div className="p-4 sm:p-5 border-b border-zinc-100 bg-zinc-50/50 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-zinc-100 border border-zinc-200 flex items-center justify-center text-zinc-700">
                <DollarSign className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-semibold text-zinc-950">
                  3. Economics
                </h4>
                <p className="text-xs text-zinc-500 mt-0.5">Revenue run-rate, margins and runway</p>
              </div>
            </div>
            {current.runway_months != null && (
              <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-mono tabular-nums border ${
                current.runway_months >= 12
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200/80'
                  : current.runway_months >= 6
                  ? 'bg-amber-50 text-amber-800 border-amber-200/80'
                  : 'bg-rose-50 text-rose-800 border-rose-200/80'
              }`}>
                {current.runway_months} mos runway
              </span>
            )}
          </div>

          <div className="p-4 sm:p-5 grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-3 flex-1">
            <div className="bg-zinc-50/50 rounded-xl p-3 border border-zinc-100">
              <span className="text-xs text-zinc-500">Monthly revenue</span>
              <p className="text-sm sm:text-base font-semibold text-zinc-950 mt-1 tabular-nums">
                {formatCurrency(current.monthly_revenue)}
              </p>
            </div>
            <div className="bg-zinc-50/50 rounded-xl p-3 border border-zinc-100">
              <span className="text-xs text-zinc-500">ARR</span>
              <p className="text-sm sm:text-base font-semibold text-zinc-950 mt-1 tabular-nums">
                {formatCurrency(current.arr)}
              </p>
            </div>
            <div className="bg-zinc-50/50 rounded-xl p-3 border border-zinc-100">
              <span className="text-xs text-zinc-500">Burn rate</span>
              <p className="text-sm sm:text-base font-semibold text-zinc-950 mt-1 tabular-nums">
                {current.burn_rate ? `${formatCurrency(current.burn_rate)}/mo` : '—'}
              </p>
            </div>
            <div className="bg-zinc-50/50 rounded-xl p-3 border border-zinc-100">
              <span className="text-xs text-zinc-500">Gross margin</span>
              <p className="text-sm sm:text-base font-semibold text-zinc-950 mt-1 tabular-nums">
                {current.gross_margin_pct != null ? `${current.gross_margin_pct}%` : '—'}
              </p>
            </div>
            <div className="bg-zinc-50/50 rounded-xl p-3 border border-zinc-100">
              <span className="text-xs text-zinc-500">Operating margin</span>
              <p className="text-sm sm:text-base font-semibold text-zinc-950 mt-1 tabular-nums">
                {current.operating_margin_pct != null ? `${current.operating_margin_pct}%` : '—'}
              </p>
            </div>
            <div className="bg-zinc-50/50 rounded-xl p-3 border border-zinc-100">
              <span className="text-xs text-zinc-500">LTV / CAC</span>
              <p className="text-sm sm:text-base font-semibold text-zinc-950 mt-1 tabular-nums">
                {current.ltv_cac_ratio != null ? `${current.ltv_cac_ratio}x` : '—'}
              </p>
            </div>
          </div>
        </div>

        {/* ── 4. MILESTONES ─────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-zinc-200/80 shadow-2xs overflow-hidden flex flex-col">
          <div className="p-4 sm:p-5 border-b border-zinc-100 bg-zinc-50/50 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-zinc-100 border border-zinc-200 flex items-center justify-center text-zinc-700">
                <Flag className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-semibold text-zinc-950">
                  4. Milestones
                </h4>
                <p className="text-xs text-zinc-500 mt-0.5">Target completion and achievements</p>
              </div>
            </div>
            {current.targets_completion_rate_pct != null && (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-mono font-medium bg-zinc-100 text-zinc-800 border border-zinc-200/80">
                {current.targets_completion_rate_pct}% Done
              </span>
            )}
          </div>

          <div className="p-4 sm:p-5 space-y-3 sm:space-y-3.5 flex-1 text-xs">
            {current.targets_completion_rate_pct != null && (
              <div>
                <div className="flex items-center justify-between text-xs font-normal text-zinc-500 mb-1.5">
                  <span>Target execution progress</span>
                  <span className="font-medium text-zinc-900 tabular-nums">{current.targets_completion_rate_pct}%</span>
                </div>
                <div className="w-full bg-zinc-100 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-zinc-800 h-1.5 rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(100, Math.max(0, current.targets_completion_rate_pct))}%` }}
                  />
                </div>
              </div>
            )}

            {current.achievements && (
              <div className="bg-zinc-50/50 rounded-xl p-3 border border-zinc-100 space-y-1">
                <span className="text-xs font-medium text-emerald-800 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  Key achievements
                </span>
                <p className="text-zinc-700 leading-relaxed whitespace-pre-line line-clamp-3">
                  {current.achievements}
                </p>
              </div>
            )}

            {current.challenges && (
              <div className="bg-zinc-50/50 rounded-xl p-3 border border-zinc-100 space-y-1">
                <span className="text-xs font-medium text-amber-800 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-amber-600" />
                  Headwinds and challenges
                </span>
                <p className="text-zinc-700 leading-relaxed whitespace-pre-line line-clamp-2">
                  {current.challenges}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
