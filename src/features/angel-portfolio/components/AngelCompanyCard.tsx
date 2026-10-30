import Link from 'next/link'
import Image from 'next/image'
import type { AngelCompanySummary } from '@/features/angel-portfolio/types'
import { CheckCircle2, AlertCircle, Zap, ShieldCheck } from 'lucide-react'

interface AngelCompanyCardProps {
  company: AngelCompanySummary
}

const HEALTH_CONFIG: Record<string, { badge: string; dot: string; label: string }> = {
  Green: { badge: 'text-emerald-800 bg-emerald-50 border-emerald-200', dot: 'bg-emerald-500', label: 'On Track' },
  Amber: { badge: 'text-amber-800 bg-amber-50 border-amber-200', dot: 'bg-amber-500', label: 'Monitor' },
  Red:   { badge: 'text-red-800 bg-red-50 border-red-200', dot: 'bg-red-500', label: 'Attention' },
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
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
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
    <div className="w-10 h-10 rounded-xl border border-zinc-200 bg-zinc-50 shrink-0 flex items-center justify-center shadow-2xs">
      <span className="text-xs font-bold text-zinc-700 tracking-tight">{initials}</span>
    </div>
  )
}

export function AngelCompanyCard({ company }: AngelCompanyCardProps) {
  const health = company.portfolio_health
  const healthStyle = health ? HEALTH_CONFIG[health] : null

  return (
    <Link
      href={`/portfolio/${company.company_id}`}
      className="group flex flex-col justify-between rounded-2xl border border-zinc-200/90 bg-white p-5 sm:p-6 hover:border-zinc-300 hover:shadow-xs transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
    >
      <div>
        {/* Top identity block */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-3 min-w-0">
            <CompanyAvatar name={company.company_name} logoPath={company.logo_path} />
            <div className="min-w-0">
              <h2 className="text-base font-bold text-zinc-900 group-hover:text-blue-600 transition-colors truncate tracking-tight">
                {company.company_name}
              </h2>
              <p className="text-xs font-medium text-zinc-600 mt-0.5 truncate">
                {[company.stage, company.sector].filter(Boolean).join(' · ') || 'Portfolio Company'}
              </p>
            </div>
          </div>

          {/* Badges */}
          <div className="flex flex-col items-end gap-1.5 shrink-0">
            {healthStyle ? (
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md border text-xs font-semibold ${healthStyle.badge}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${healthStyle.dot}`} />
                {healthStyle.label}
              </span>
            ) : (
              <span className="inline-flex items-center px-2 py-0.5 rounded-md border text-xs font-medium text-zinc-600 bg-zinc-50 border-zinc-200">
                Unreviewed
              </span>
            )}

            {company.is_actively_raising && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-[11px] font-bold text-amber-800 bg-[#FDF9F3] border-amber-200">
                <Zap className="w-3 h-3 fill-amber-500 text-amber-600" />
                Raising
              </span>
            )}
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-zinc-100 my-4" />

        {/* Financial terms grid */}
        <div className="space-y-2.5 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-medium text-zinc-500 uppercase tracking-wider text-[11px]">
              Holding Instrument
            </span>
            <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-zinc-100 text-zinc-800 font-semibold text-xs truncate max-w-[55%]">
              {company.position.instrument_name ?? company.position.exposure_type}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="font-medium text-zinc-500 uppercase tracking-wider text-[11px]">
              Cost Basis
            </span>
            <span className="font-bold text-zinc-900 tabular-nums">
              {formatCurrency(company.position.amount_invested)}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="font-medium text-zinc-500 uppercase tracking-wider text-[11px]">
              Carrying Mark
            </span>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-zinc-900 tabular-nums">
                {formatCurrency(company.position.current_value ?? company.position.amount_invested)}
              </span>
              {company.position.moic !== null && company.position.moic !== undefined && (
                <span className={`inline-flex items-center px-1.5 py-0.2 rounded text-[11px] font-bold tabular-nums border ${
                  company.position.moic > 1.05
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    : company.position.moic < 0.95
                    ? 'bg-red-50 text-red-800 border-red-200'
                    : 'bg-zinc-100 text-zinc-700 border-zinc-200'
                }`}>
                  {company.position.moic.toFixed(1)}x
                </span>
              )}
            </div>
          </div>

          {company.position.ownership_pct && company.position.ownership_pct > 0 ? (
            <div className="flex items-center justify-between">
              <span className="font-medium text-zinc-500 uppercase tracking-wider text-[11px]">
                Ownership
              </span>
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-semibold text-blue-800 bg-blue-50 border border-blue-100 tabular-nums">
                {formatPct(company.position.ownership_pct)}
              </span>
            </div>
          ) : null}
        </div>
      </div>

      {/* Footer metadata */}
      <div className="border-t border-zinc-100 mt-5 pt-3.5 space-y-2 text-xs">
        <div className="flex items-center justify-between">
          <span className="text-zinc-500">Founder briefing</span>
          {company.update_submitted_this_cycle ? (
            <span className="inline-flex items-center gap-1 font-semibold text-emerald-700">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              Current cycle submitted
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 font-semibold text-amber-700">
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