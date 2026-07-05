import Link from 'next/link'
import type { AngelCompanySummary } from '@/features/angel-portfolio/types'


interface AngelCompanyCardProps {
  company: AngelCompanySummary
}

const HEALTH_STYLES: Record<string, string> = {
  Green: 'text-emerald-700 bg-emerald-50 border-emerald-100',
  Amber: 'text-amber-700 bg-amber-50 border-amber-100',
  Red:   'text-red-700 bg-red-50 border-red-100',
}

function formatCurrency(n: number | null): string {
  if (!n) return '—'
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(n)
}

function formatPct(n: number | null): string {
  if (!n || n === 0) return '—'
  return `${n.toFixed(2)}%`
}

function formatDate(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
  })
}

export function AngelCompanyCard({ company }: AngelCompanyCardProps) {
  const healthStyle = company.portfolio_health
    ? HEALTH_STYLES[company.portfolio_health]
    : 'text-zinc-400 bg-zinc-50 border-zinc-200'

  return (
    <Link
      href={`/portfolio/${company.company_id}`}
      // 🟢 MOBILE FIX: Used tap-friendly padding configurations and eliminated desktop hover scale shifting loops
      className="block rounded-xl border border-zinc-100 bg-white p-4 lg:p-5 hover:border-zinc-200 hover:shadow-sm transition-all active:bg-zinc-50/50"
    >

      {/* Top — name + health + raising badge */}
      <div className="flex items-start justify-between gap-2 mb-4">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-zinc-900 truncate">
            {company.company_name}
          </p>
          <p className="text-xs text-zinc-400 truncate mt-0.5">
            {[company.stage, company.sector].filter(Boolean).join(' · ') || '—'}
          </p>
        </div>

        {/* 🟢 MOBILE FIX: Prevent container clipping via wrap-friendly shrinking styles */}
        <div className="flex items-center gap-1.5 shrink-0 max-w-[50%]">
          {company.is_actively_raising && (
            <span className="inline-flex items-center px-1.5 py-0.5 rounded border text-[10px] font-medium text-amber-700 bg-amber-50 border-amber-200">
              Raising
            </span>
          )}
          <span className={`
            inline-flex items-center px-1.5 py-0.5 rounded border text-[10px] font-medium whitespace-nowrap
            ${healthStyle}
          `}>
            {company.portfolio_health ?? 'Not set'}
          </span>
        </div>
      </div>

      <div className="border-t border-zinc-50 mb-3" />

      {/* Position details */}
      <div className="space-y-2">

        <div className="flex items-center justify-between gap-4">
          <span className="text-xs text-zinc-400 shrink-0">Instrument</span>
          <span className="text-xs font-medium text-zinc-700 truncate max-w-[70%]">
            {company.position.instrument_name ?? company.position.exposure_type}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-xs text-zinc-400">Invested</span>
          <span className="text-xs font-medium text-zinc-900 tabular-nums">
            {formatCurrency(company.position.amount_invested)}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-xs text-zinc-400">Ownership</span>
          <span className="text-xs text-zinc-700 tabular-nums">
            {formatPct(company.position.ownership_pct)}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-xs text-zinc-400">Issue date</span>
          <span className="text-xs text-zinc-500">
            {formatDate(company.position.issue_date)}
          </span>
        </div>

      </div>

      <div className="border-t border-zinc-50 mt-3 pt-3 space-y-1.5">

        {/* Update status */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-zinc-400">This month&apos;s update</span>
          {company.update_submitted_this_cycle ? (
            <span className="text-xs font-medium text-emerald-600">Submitted</span>
          ) : (
            <span className="text-xs font-medium text-red-500">Overdue</span>
          )}
        </div>

        {/* Exit signal */}
        {company.exit_readiness_signal && (
          <div className="flex items-center justify-between">
            <span className="text-xs text-zinc-400">Exit readiness</span>
            <span className="text-xs font-medium text-zinc-500">
              {company.exit_readiness_signal}
            </span>
          </div>
        )}

      </div>

    </Link>
  )
}