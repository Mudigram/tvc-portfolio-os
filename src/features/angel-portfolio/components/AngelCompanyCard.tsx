import Link from 'next/link'
import Image from 'next/image'
import type { AngelCompanySummary } from '@/features/angel-portfolio/types'
import { createBrowserClient } from '@/lib/supabase/client'

interface AngelCompanyCardProps {
  company: AngelCompanySummary
}

const HEALTH_STYLES: Record<string, { badge: string; dot: string }> = {
  Green: { badge: 'text-emerald-700 bg-emerald-50 border-emerald-100', dot: 'bg-emerald-400' },
  Amber: { badge: 'text-amber-700 bg-amber-50 border-amber-100', dot: 'bg-amber-400' },
  Red:   { badge: 'text-red-700 bg-red-50 border-red-100', dot: 'bg-red-400' },
}

function formatCurrency(n: number | null): string {
  if (n == null || isNaN(n) || n === 0) return '—'
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

function CompanyAvatar({ name, logoPath }: { name: string; logoPath: string | null }) {
  if (logoPath) {
    const supabase = createBrowserClient()
    const { data } = supabase.storage.from('company-logos').getPublicUrl(logoPath)
    return (
      <div className="w-9 h-9 rounded-lg overflow-hidden border border-zinc-100 shrink-0 bg-zinc-50">
        <Image
          src={data.publicUrl}
          alt={`${name} logo`}
          width={36}
          height={36}
          className="object-cover w-full h-full"
        />
      </div>
    )
  }

  const initials = name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('')

  return (
    <div className="w-9 h-9 rounded-lg border border-zinc-100 bg-zinc-50 shrink-0 flex items-center justify-center">
      <span className="text-[11px] font-semibold text-zinc-500">{initials}</span>
    </div>
  )
}

export function AngelCompanyCard({ company }: AngelCompanyCardProps) {
  const health = company.portfolio_health
  const healthStyle = health ? HEALTH_STYLES[health] : null

  return (
    <Link
      href={`/portfolio/${company.company_id}`}
      className="group block rounded-2xl border border-zinc-200/80 bg-white p-4 lg:p-5 hover:border-zinc-300 hover:shadow-[0_8px_20px_-4px_rgba(15,23,42,0.06)] hover:-translate-y-0.5 transition-all duration-200 active:bg-zinc-50/50 shadow-xs"
    >

      {/* Top row — avatar + name + health badge */}
      <div className="flex items-start gap-3 mb-4">
        <div className="group-hover:scale-105 transition-transform duration-200">
          <CompanyAvatar name={company.company_name} logoPath={company.logo_path} />
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-zinc-900 group-hover:text-primary transition-colors truncate leading-snug">
            {company.company_name}
          </p>
          <p className="text-[11px] text-zinc-400 mt-0.5 truncate">
            {[company.stage, company.sector].filter(Boolean).join(' · ') || '—'}
          </p>
        </div>

        {/* Badges — health + raising */}
        <div className="flex flex-col items-end gap-1 shrink-0">
          <span className={`
            inline-flex items-center gap-1 px-1.5 py-0.5 rounded border text-[10px] font-medium whitespace-nowrap
            ${healthStyle?.badge ?? 'text-zinc-400 bg-zinc-50 border-zinc-200'}
          `}>
            {healthStyle && (
              <span className={`inline-block w-1.5 h-1.5 rounded-full ${healthStyle.dot}`} />
            )}
            {health ?? 'Unset'}
          </span>
          {company.is_actively_raising && (
            <span className="inline-flex items-center px-1.5 py-0.5 rounded border text-[10px] font-medium text-amber-700 bg-amber-50 border-amber-200 whitespace-nowrap">
              Raising
            </span>
          )}
        </div>
      </div>

      <div className="border-t border-zinc-50 mb-3" />

      {/* Position details */}
      <div className="space-y-2">

        {/* Instrument type badge */}
        <div className="flex items-center justify-between gap-4">
          <span className="text-[11px] text-zinc-400 shrink-0">Instrument</span>
          <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-zinc-100 text-[11px] font-medium text-zinc-700 truncate max-w-[60%]">
            {company.position.instrument_name ?? company.position.exposure_type}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-[11px] text-zinc-400">Invested</span>
          <span className="text-[11px] font-semibold text-zinc-900 tabular-nums">
            {formatCurrency(company.position.amount_invested)}
          </span>
        </div>

        {/* Est. Value / Carrying Value & MOIC */}
        <div className="flex items-center justify-between">
          <span className="text-[11px] text-zinc-400">Est. Value</span>
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-semibold text-zinc-900 tabular-nums">
              {formatCurrency(company.position.current_value ?? company.position.amount_invested)}
            </span>
            {company.position.moic !== null && company.position.moic !== undefined && (
              <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold tabular-nums border ${
                company.position.moic > 1.05
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : company.position.moic < 0.95
                  ? 'bg-red-50 text-red-700 border-red-200'
                  : 'bg-zinc-50 text-zinc-600 border-zinc-200'
              }`}>
                {company.position.moic.toFixed(1)}x
              </span>
            )}
          </div>
        </div>

        {/* Ownership pill - only when recorded */}
        {company.position.ownership_pct && company.position.ownership_pct > 0 ? (
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-zinc-400">Ownership</span>
            <span className="inline-flex items-center px-1.5 py-0.5 rounded-md bg-blue-50 text-[11px] font-medium text-blue-700 tabular-nums">
              {formatPct(company.position.ownership_pct)}
            </span>
          </div>
        ) : null}

        <div className="flex items-center justify-between">
          <span className="text-[11px] text-zinc-400">Issue date</span>
          <span className="text-[11px] text-zinc-500">
            {formatDate(company.position.issue_date)}
          </span>
        </div>

      </div>

      <div className="border-t border-zinc-50 mt-3 pt-3 space-y-1.5">

        {/* Update status */}
        <div className="flex items-center justify-between">
          <span className="text-[11px] text-zinc-400">Monthly update</span>
          {company.update_submitted_this_cycle ? (
            <span className="text-[11px] font-medium text-emerald-600">✓ Submitted</span>
          ) : (
            <span className="text-[11px] font-medium text-red-500">Overdue</span>
          )}
        </div>

        {/* Last health review */}
        {company.health_reviewed_at && (
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-zinc-400">Last reviewed</span>
            <span className="text-[11px] text-zinc-400">
              {formatDate(company.health_reviewed_at)}
            </span>
          </div>
        )}

        {/* Exit signal */}
        {company.exit_readiness_signal && (
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-zinc-400">Exit readiness</span>
            <span className="text-[11px] font-medium text-zinc-500">
              {company.exit_readiness_signal}
            </span>
          </div>
        )}

      </div>

    </Link>
  )
}