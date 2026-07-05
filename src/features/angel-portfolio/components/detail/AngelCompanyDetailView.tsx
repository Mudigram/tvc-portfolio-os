'use client'

import Link from 'next/link'
import type { AngelCompanyDetail } from '@/features/angel-portfolio/types'
import { AngelInstrumentBreakdown } from '@/features/angel-portfolio/components/AngelInstrumentBreakdown'


interface AngelCompanyDetailViewProps {
  detail: AngelCompanyDetail
}

const HEALTH_STYLES: Record<string, string> = {
  Green: 'text-emerald-700 bg-emerald-50 border-emerald-200',
  Amber: 'text-amber-700 bg-amber-50 border-amber-100',
  Red:   'text-red-700 bg-red-50 border-red-200',
}

const HEALTH_DOT: Record<string, string> = {
  Green: 'bg-emerald-400',
  Amber: 'bg-amber-400',
  Red:   'bg-red-400',
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

function getMostRecentDate(dates: (string | null)[]): string | null {
    const valid = dates.filter((d): d is string => d !== null)
    if (valid.length === 0) return null
    return valid.sort((a, b) => b.localeCompare(a))[0]
  }

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="space-y-0.5">
      <p className="text-xs font-medium text-zinc-400 uppercase tracking-wide">
        {label}
      </p>
      <div className="text-sm font-medium text-zinc-800">{value ?? '—'}</div>
    </div>
  )
}

export function AngelCompanyDetailView({ detail }: AngelCompanyDetailViewProps) {
  const healthStyle = detail.portfolio_health
    ? HEALTH_STYLES[detail.portfolio_health]
    : 'text-zinc-400 bg-zinc-50 border-zinc-200'
    const asOfDate = getMostRecentDate([detail.health_reviewed_at])

  return (
    // 🟢 MOBILE FIX: Tailored dynamic global layout padding container blocks
    <div className="space-y-6 lg:space-y-8 max-w-2xl px-1">

      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-[11px] lg:text-xs text-zinc-400 truncate">
        <Link href="/portfolio" className="hover:text-zinc-700 transition-colors">
          My Portfolio
        </Link>
        <span>·</span>
        <span className="text-zinc-600 truncate">{detail.company_name}</span>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-zinc-50 p-4 rounded-xl border border-zinc-100 sm:bg-transparent sm:p-0 sm:border-none">
        <div className="space-y-0.5">
          <h1 className="text-xl lg:text-2xl font-bold text-zinc-900 tracking-tight">
            {detail.company_name}
          </h1>
          <p className="text-xs lg:text-sm text-zinc-400">
            {[detail.stage, detail.sector, detail.country]
              .filter(Boolean)
              .join(' · ')}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1.5 shrink-0">
    <div className="flex items-center gap-2">
      {detail.is_actively_raising && (
        <span className="inline-flex items-center px-2.5 py-1 rounded border text-xs font-medium text-amber-700 bg-amber-50 border-amber-200">
          Actively raising
        </span>
      )}
      <span className={`
        inline-flex items-center px-2.5 py-1 rounded border text-sm font-medium
        ${healthStyle}
      `}>
        {detail.portfolio_health ?? 'Not reviewed'}
      </span>
    </div>
    {asOfDate && (
      <p className="text-xs text-zinc-300">
        Data as of {formatDate(asOfDate)}
      </p>
    )}
  </div>
        
        {/* Mobile horizontal wrap tag metrics container */}
        <div className="flex items-center gap-1.5 shrink-0 pt-1 sm:pt-0">
          {detail.is_actively_raising && (
            <span className="inline-flex items-center px-2 py-0.5 rounded border text-[11px] font-medium text-amber-700 bg-amber-50 border-amber-200">
              Actively raising
            </span>
          )}
          <span className={`
            inline-flex items-center px-2 py-0.5 rounded border text-[11px] font-medium
            ${healthStyle}
          `}>
            {detail.portfolio_health ?? 'Not reviewed'}
          </span>
        </div>
      </div>

      <div className="hidden sm:block border-t border-zinc-100" />

      {/* My position */}
      <section className="space-y-5">
  <h2 className="text-xs font-medium text-zinc-400 uppercase tracking-wide">
    My position
  </h2>

  {detail.positions.length === 1 ? (
    <div className="grid grid-cols-2 gap-x-8 gap-y-6">
      <Field
        label="Instrument"
        value={detail.positions[0].instrument_name ?? detail.positions[0].exposure_type}
      />
      <Field label="Amount invested" value={formatCurrency(detail.blended.total_invested)} />
      <Field label="Ownership" value={formatPct(detail.blended.total_ownership_pct)} />
      <Field label="Issue date" value={formatDate(detail.positions[0].issue_date)} />
    </div>
  ) : (
    <AngelInstrumentBreakdown
      positions={detail.positions}
      blendedInvested={detail.blended.total_invested}
      blendedOwnership={detail.blended.total_ownership_pct}
    />
  )}
</section>

      <div className="border-t border-zinc-100" />

      {/* Company signals */}
      <section className="space-y-4">
        <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">
          Company signals
        </h2>
        {/* 🟢 MOBILE FIX: Swap from 1 to 2 columns responsive layout blocks */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4 bg-white p-4 rounded-xl border border-zinc-100 sm:p-0 sm:border-none">
          <Field
            label="This month&apos;s update"
            value={
              detail.update_submitted_this_cycle ? (
                <span className="text-emerald-600 font-semibold">Submitted</span>
              ) : (
                <span className="text-red-500 font-semibold">Overdue</span>
              )
            }
          />
          <Field
            label="Exit readiness"
            value={detail.exit_readiness_signal ?? 'Not assessed'}
          />
          <Field
            label="Health reviewed"
            value={formatDate(detail.health_reviewed_at)}
          />
        </div>
      </section>

      <div className="border-t border-zinc-100" />

      {/* Health history timeline */}
      {detail.health_history.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">
            Health history
          </h2>
          <div className="bg-white p-4 rounded-xl border border-zinc-100 sm:p-0 sm:border-none space-y-0">
            {detail.health_history.map((h, index) => {
              const isLast = index === detail.health_history.length - 1
              const changed =
                h.previous_status && h.previous_status !== h.health_status

              return (
                <div key={index} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className={`
                      w-2 h-2 rounded-full mt-1.5 shrink-0
                      ${HEALTH_DOT[h.health_status] ?? 'bg-zinc-300'}
                    `} />
                    {!isLast && (
                      <div className="w-px flex-1 bg-zinc-100 mt-1" />
                    )}
                  </div>
                  <div className="pb-4">
                    <p className="text-sm text-zinc-800 font-medium">
                      {changed
                        ? `Status changed to ${h.health_status}`
                        : `Reviewed — ${h.health_status}`
                      }
                    </p>
                    {changed && h.previous_status && (
                      <p className="text-xs text-zinc-500 mt-0.5">
                        {h.previous_status} → {h.health_status}
                      </p>
                    )}
                    <p className="text-xs text-zinc-400 mt-0.5">
                      {formatDate(h.reviewed_at)}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      )}

    </div>
  )
}