import type { CompanyCardData } from '@/features/companies/types'
import Link from 'next/link'
import { AlertCircle } from 'lucide-react'

interface DashboardCardProps {
  company: CompanyCardData
}

const HEALTH_CONFIG: Record<string, { badge: string; dot: string; label: string }> = {
  Green: { badge: 'text-emerald-800 bg-emerald-50/80 border-emerald-200/80', dot: 'bg-emerald-500', label: 'On track' },
  Amber: { badge: 'text-amber-800 bg-amber-50/80 border-amber-200/80', dot: 'bg-amber-500', label: 'Monitor' },
  Red:   { badge: 'text-rose-800 bg-rose-50/80 border-rose-200/80', dot: 'bg-rose-500', label: 'Attention' },
}

function formatDate(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export default function DashboardCard({ company }: DashboardCardProps) {
  const health = company.portfolio_health ? HEALTH_CONFIG[company.portfolio_health] : null

  return (
    <Link
      href={`/companies/${company.id}`}
      className="group block rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-xs hover:border-zinc-300 hover:shadow-sm transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900"
    >
      {/* Top row — name + health badge */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-zinc-950 group-hover:text-zinc-700 transition-colors truncate">
            {company.name}
          </p>
          <p className="text-xs text-zinc-500 mt-0.5 truncate">
            {[company.stage, company.sector].filter(Boolean).join(' · ') || '—'}
          </p>
        </div>
        {health ? (
          <span
            className={`
              shrink-0 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md border text-xs font-medium
              ${health.badge}
            `}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${health.dot}`} />
            {health.label}
          </span>
        ) : (
          <span className="shrink-0 inline-flex items-center px-2 py-0.5 rounded-md border text-xs font-medium text-zinc-500 bg-zinc-50 border-zinc-200">
            Unreviewed
          </span>
        )}
      </div>

      {/* Divider */}
      <div className="border-t border-zinc-100 mb-4" />

      {/* Signal rows */}
      <div className="space-y-2 text-xs">

        {/* POEM submission */}
        <div className="flex items-center justify-between">
          <span className="text-zinc-500">Monthly update</span>
          {company.update_submitted_this_cycle ? (
            <span className="font-medium text-emerald-700">Submitted</span>
          ) : (
            <span className="font-medium text-rose-700">Overdue</span>
          )}
        </div>

        {/* Last update date */}
        <div className="flex items-center justify-between">
          <span className="text-zinc-500">Last briefing</span>
          <span className="text-zinc-700 font-mono">
            {formatDate(company.last_update_date)}
          </span>
        </div>

        {/* Funding status */}
        {company.is_actively_raising && (
          <div className="flex items-center justify-between">
            <span className="text-zinc-500">Fundraising</span>
            <span className="font-medium text-amber-800">Actively raising</span>
          </div>
        )}

        {/* Exit readiness */}
        {company.exit_readiness_signal && (
          <div className="flex items-center justify-between">
            <span className="text-zinc-500">Exit readiness</span>
            <span className="text-zinc-800 font-medium">
              {company.exit_readiness_signal}
            </span>
          </div>
        )}

        {/* Stale verification warning */}
        {company.has_stale_verification && (
          <div className="mt-3 pt-3 border-t border-zinc-100 flex items-start gap-1.5 text-xs text-amber-800">
            <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
            <span>Verification overdue — review before setting health status</span>
          </div>
        )}
      </div>

      {/* Health reviewed date */}
      {company.health_reviewed_at && (
        <p className="mt-4 pt-3 border-t border-zinc-50 text-xs text-zinc-400 font-mono">
          Reviewed {formatDate(company.health_reviewed_at)}
        </p>
      )}
    </Link>
  )
}
