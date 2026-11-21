import Link from 'next/link'
import Image from 'next/image'
import type { AngelCompanySummary } from '@/features/angel-portfolio/types'
import { CheckCircle2, AlertCircle, ArrowUpRight } from 'lucide-react'

interface AngelCompanyCardProps {
  company: AngelCompanySummary
}

const HEALTH_CONFIG: Record<string, { badge: string; dot: string; label: string }> = {
  Green: { badge: 'text-emerald-800 bg-emerald-50/80 border-emerald-200/80', dot: 'bg-emerald-500', label: 'On track' },
  Amber: { badge: 'text-amber-800 bg-amber-50/80 border-amber-200/80', dot: 'bg-amber-500', label: 'Monitor' },
  Red:   { badge: 'text-rose-800 bg-rose-50/80 border-rose-200/80', dot: 'bg-rose-500', label: 'Attention' },
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

function CompanyAvatar({ name, logoPath }: { name: string; logoPath: string | null }) {
  if (logoPath) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const fullUrl = `${supabaseUrl}/storage/v1/object/public/company-logos/${logoPath}`
    return (
      <div className="w-10 h-10 rounded-xl overflow-hidden border border-zinc-200 shrink-0 bg-zinc-50 shadow-2xs">
        <Image
          src={fullUrl}
          alt={`${name} logo`}
          width={40}
          height={40}
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
    <div className="w-10 h-10 rounded-xl border border-zinc-200 bg-zinc-100/70 shrink-0 flex items-center justify-center shadow-2xs">
      <span className="text-xs font-semibold text-zinc-700 tracking-tight">{initials}</span>
    </div>
  )
}

export function AngelCompanyCard({ company }: AngelCompanyCardProps) {
  const health = company.portfolio_health
  const healthStyle = health ? HEALTH_CONFIG[health] : null

  return (
    <Link
      href={`/portfolio/${company.company_id}`}
      className="group flex flex-col justify-between rounded-2xl border border-zinc-200/80 bg-white p-5 sm:p-6 hover:border-zinc-300 hover:shadow-xs transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900"
    >
      <div>
        {/* Top identity block */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-3 min-w-0">
            <CompanyAvatar name={company.company_name} logoPath={company.logo_path} />
            <div className="min-w-0">
              <h2 className="text-sm font-semibold text-zinc-950 group-hover:text-zinc-700 transition-colors truncate tracking-tight">
                {company.company_name}
              </h2>
              <p className="text-xs text-zinc-500 mt-0.5 truncate">
                {[company.stage, company.sector].filter(Boolean).join(' · ') || 'Portfolio company'}
              </p>
            </div>
          </div>

          {/* Badges */}
          <div className="flex flex-col items-end gap-1.5 shrink-0">
            {healthStyle ? (
              <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md border text-xs font-medium ${healthStyle.badge}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${healthStyle.dot}`} />
                {healthStyle.label}
              </span>
            ) : (
              <span className="inline-flex items-center px-2 py-0.5 rounded-md border text-xs font-medium text-zinc-500 bg-zinc-50 border-zinc-200">
                Unreviewed
              </span>
            )}

            {company.is_actively_raising && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-xs font-medium text-amber-800 bg-amber-50/70 border-amber-200/70">
                <ArrowUpRight className="w-3 h-3 text-amber-700" />
                Raising
              </span>
            )}
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-zinc-100 my-4" />

        {/* Financial terms grid */}
        <div className="space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-normal text-zinc-500 text-xs">
              Holding instrument
            </span>
            <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-zinc-100 text-zinc-800 font-medium text-xs truncate max-w-[55%]">
              {company.position.instrument_name ?? company.position.exposure_type}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="font-normal text-zinc-500 text-xs">
              Cost basis
            </span>
            <span className="font-medium text-zinc-950 tabular-nums">
              {formatCurrency(company.position.amount_invested)}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="font-normal text-zinc-500 text-xs">
              Carrying mark
            </span>
            <div className="flex items-center gap-1.5">
              <span className="font-medium text-zinc-950 tabular-nums">
                {formatCurrency(company.position.current_value ?? company.position.amount_invested)}
              </span>
              {company.position.moic !== null && company.position.moic !== undefined && (
                <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-mono tabular-nums border ${
                  company.position.moic > 1.05
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200/80'
                    : company.position.moic < 0.95
                    ? 'bg-rose-50 text-rose-800 border-rose-200/80'
                    : 'bg-zinc-100 text-zinc-700 border-zinc-200/80'
                }`}>
                  {company.position.moic.toFixed(1)}x
                </span>
              )}
            </div>
          </div>

          {company.position.ownership_pct && company.position.ownership_pct > 0 ? (
            <div className="flex items-center justify-between">
              <span className="font-normal text-zinc-500 text-xs">
                Diluted ownership
              </span>
              <span className="font-mono text-xs font-medium text-zinc-900 tabular-nums">
                {formatPct(company.position.ownership_pct)}
              </span>
            </div>
          ) : null}
        </div>
      </div>

      {/* Footer metadata */}
      <div className="border-t border-zinc-100 mt-5 pt-3.5 space-y-1.5 text-xs">
        <div className="flex items-center justify-between">
          <span className="text-zinc-500">Founder briefing</span>
          {company.update_submitted_this_cycle ? (
            <span className="inline-flex items-center gap-1 font-medium text-emerald-700">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              Current cycle submitted
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 font-medium text-amber-700">
              <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
              Pending this cycle
            </span>
          )}
        </div>

        {company.exit_readiness_signal && (
          <div className="flex items-center justify-between text-zinc-500">
            <span>Exit readiness</span>
            <span className="font-medium text-zinc-800">
              {company.exit_readiness_signal}
            </span>
          </div>
        )}
      </div>
    </Link>
  )
}
