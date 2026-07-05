import type { CompanyCardData } from '@/features/companies/types'
import Link from 'next/link' // Added the missing Link import

interface DashboardCardProps {
  company: CompanyCardData
}

// Added Record<string, string> fallback or explicit indexing compatibility
const HEALTH_STYLES: Record<string, string> = {
  Green: 'text-emerald-700 bg-emerald-50 border-emerald-200',
  Amber: 'text-amber-700 bg-amber-50 border-amber-200',
  Red:   'text-red-700 bg-red-50 border-red-200',
}

const HEALTH_LABEL: Record<string, string> = {
  Green: 'Green',
  Amber: 'Amber',
  Red:   'Red',
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
  // Added a fallback in case portfolio_health doesn't match the keys perfectly
  const healthStyle = company.portfolio_health && HEALTH_STYLES[company.portfolio_health]
    ? HEALTH_STYLES[company.portfolio_health]
    : 'text-zinc-500 bg-zinc-50 border-zinc-200'

  const healthLabel = company.portfolio_health && HEALTH_LABEL[company.portfolio_health]
    ? HEALTH_LABEL[company.portfolio_health]
    : 'Not set'

  return (
    <Link
      href={`/companies/${company.id}`}
      className="block rounded-xl border border-zinc-100 bg-white p-5 shadow-lg hover:shadow-md transition-all"
    >
      {/* Top row — name + health badge */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="min-w-0">
          <p className="text-sm font-medium text-zinc-900 truncate">
            {company.name}
          </p>
          <p className="text-xs text-zinc-400 mt-0.5">
            {[company.stage, company.sector].filter(Boolean).join(' · ') || '—'}
          </p>
        </div>
        <span
          className={`
            shrink-0 inline-flex items-center px-2 py-0.5 rounded border text-xs font-medium
            ${healthStyle}
          `}
        >
          {healthLabel}
        </span>
      </div>

      {/* Divider */}
      <div className="border-t border-zinc-50 mb-4" />

      {/* Signal rows */}
      <div className="space-y-2.5">

        {/* POEM submission */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-zinc-400">This month&apos;s update</span>
          {company.update_submitted_this_cycle ? (
            <span className="text-xs font-medium text-emerald-600">Submitted</span>
          ) : (
            <span className="text-xs font-medium text-red-500">Overdue</span>
          )}
        </div>

        {/* Last update date */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-zinc-400">Last update</span>
          <span className="text-xs text-zinc-600">
            {formatDate(company.last_update_date)}
          </span>
        </div>

        {/* Funding status */}
        {company.is_actively_raising && (
          <div className="flex items-center justify-between">
            <span className="text-xs text-zinc-400">Fundraising</span>
            <span className="text-xs font-medium text-amber-600">Actively raising</span>
          </div>
        )}

        {/* Exit readiness */}
        {company.exit_readiness_signal && (
          <div className="flex items-center justify-between">
            <span className="text-xs text-zinc-400">Exit readiness</span>
            <span className="text-xs text-zinc-600">
              {company.exit_readiness_signal}
            </span>
          </div>
        )}

        {/* Stale verification warning */}
        {company.has_stale_verification && (
          <div className="mt-3 pt-3 border-t border-zinc-50">
            <p className="text-xs text-amber-600 font-medium">
              ⚠ Verification overdue — review before setting health status
            </p>
          </div>
        )}
      </div>

      {/* Health reviewed date — bottom, quiet */}
      {company.health_reviewed_at && (
        <p className="mt-4 text-[10px] text-zinc-300">
          Status reviewed {formatDate(company.health_reviewed_at)}
        </p>
      )}
    </Link>
  )
}