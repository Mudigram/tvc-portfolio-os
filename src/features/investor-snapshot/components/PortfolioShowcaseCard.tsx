import type { PortfolioShowcaseData, ShowcaseCompanyCard, MonthlyValuePoint } from '../types'
import { CalendarX2, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'

// ─── Helpers ────────────────────────────────────────────────────────────────

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(amount)

const formatCurrencyFull = (amount: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(amount)

const formatDate = (dateStr: string) =>
  new Date(dateStr + 'T00:00:00').toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })

type HealthValue = 'Green' | 'Amber' | 'Red' | null

function HealthDot({ health }: { health: HealthValue }) {
  if (!health) return <span className="w-2 h-2 rounded-full bg-zinc-300 inline-block" />
  const colors: Record<NonNullable<HealthValue>, string> = {
    Green: 'bg-emerald-500',
    Amber: 'bg-amber-400',
    Red: 'bg-red-500',
  }
  return (
    <span
      className={`w-2 h-2 rounded-full inline-block ${colors[health]}`}
      title={health}
    />
  )
}

function StageBadge({ stage }: { stage: string | null }) {
  if (!stage) return null
  return (
    <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-zinc-100 text-zinc-600 border border-zinc-200/80">
      {stage}
    </span>
  )
}

function CompanyLogo({ logoUrl, name }: { logoUrl: string | null; name: string }) {
  if (logoUrl) {
    return (
      <img
        src={logoUrl}
        alt={name}
        className="w-9 h-9 rounded-lg object-cover border border-zinc-200/80"
      />
    )
  }
  return (
    <div className="w-9 h-9 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center font-bold text-xs text-[#1a23bd]">
      {name.charAt(0).toUpperCase()}
    </div>
  )
}

function CompanyCard({ company }: { company: ShowcaseCompanyCard }) {
  return (
    <div className="p-4 rounded-xl bg-zinc-50/50 border border-zinc-200/80 hover:border-zinc-300 hover:shadow-2xs transition-all">
      {/* Header row */}
      <div className="flex items-start gap-3 mb-3">
        <CompanyLogo logoUrl={company.logo_url} name={company.company_name} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5">
            <HealthDot health={company.portfolio_health} />
            <p className="text-sm font-bold text-zinc-900 truncate">
              {company.company_name}
            </p>
          </div>
          {company.sector && (
            <p className="text-[10px] text-zinc-500 truncate">{company.sector}</p>
          )}
        </div>
        {company.stage && <StageBadge stage={company.stage} />}
      </div>

      {/* Divider */}
      <div className="border-t border-zinc-100 mb-3" />

      {/* Metrics */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <p className="text-[9px] font-bold uppercase tracking-wider text-zinc-400 mb-0.5">
            Deployed
          </p>
          <p className="text-sm font-bold font-mono text-zinc-900">
            {formatCurrency(company.tvclabs_invested)}
          </p>
        </div>
        <div>
          <p className="text-[9px] font-bold uppercase tracking-wider text-zinc-400 mb-0.5">
            Ownership
          </p>
          <p className="text-sm font-bold font-mono text-zinc-700">
            {company.tvclabs_ownership_pct > 0
              ? `${company.tvclabs_ownership_pct.toFixed(1)}%`
              : '—'}
          </p>
        </div>
      </div>

      {/* Instrument tags */}
      {company.instrument_types.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2.5">
          {company.instrument_types.map((t) => (
            <span
              key={t}
              className="px-1.5 py-0.5 rounded text-[9px] font-semibold uppercase tracking-wide bg-blue-50 text-[#1a23bd] border border-blue-100"
            >
              {t}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

function MonthlyTrajectorySection({ points }: { points: MonthlyValuePoint[] }) {
  if (!points || points.length === 0) return null

  return (
    <div className="mb-6 pb-6 border-b border-zinc-100">
      <div className="flex items-center justify-between mb-3">
        <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
          Portfolio Capital Trajectory (Past 3 Months)
        </p>
        <span className="text-[10px] font-semibold text-[#1a23bd] bg-blue-50/80 px-2 py-0.5 rounded border border-blue-100">
          Monthly Point-in-Time Aggregate
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {points.map((pt, idx) => (
          <div
            key={pt.cutoff_date}
            className={`p-3.5 rounded-xl border transition-all ${
              idx === points.length - 1
                ? 'bg-blue-50/40 border-blue-200/80 shadow-2xs'
                : 'bg-zinc-50/60 border-zinc-200/70'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold text-zinc-900">{pt.month_label}</span>
              {idx === points.length - 1 && (
                <span className="text-[9px] font-bold text-[#1a23bd] uppercase bg-white px-1.5 py-0.2 rounded border border-blue-100">
                  Selected
                </span>
              )}
            </div>
            <p className="text-base font-bold font-mono text-zinc-900">
              {formatCurrencyFull(pt.total_invested)}
            </p>
            <div className="flex items-center justify-between text-[10px] text-zinc-500 mt-1">
              <span>{pt.active_companies} {pt.active_companies === 1 ? 'Co.' : 'Cos.'}</span>
              {pt.net_change > 0 ? (
                <span className="text-emerald-700 font-semibold font-mono">
                  +{formatCurrency(pt.net_change)}
                </span>
              ) : pt.net_change < 0 ? (
                <span className="text-red-600 font-semibold font-mono">
                  {formatCurrency(pt.net_change)}
                </span>
              ) : (
                <span className="text-zinc-400 font-mono">—</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Main Card ───────────────────────────────────────────────────────────────

interface Props {
  data: PortfolioShowcaseData
  recipientName?: string
  onResetDate?: () => void
}

export default function PortfolioShowcaseCard({ data, recipientName, onResetDate }: Props) {
  const generatedOn = formatDate(new Date().toISOString().split('T')[0])
  const asOfFormatted = formatDate(data.as_of_date)

  return (
    <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden print:border-0 print:shadow-none print:rounded-none">

      {/* ── Document Header ─────────────────────────────────────────── */}
      <div className="border-b border-zinc-100 bg-gradient-to-r from-blue-50/50 via-indigo-50/20 to-white px-8 py-8">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#1a23bd] mb-1.5">
              TVCLabs Capital — Portfolio Overview
            </p>
            <h1 className="text-2xl font-bold text-zinc-900 tracking-tight leading-tight">
              Portfolio Showcase
            </h1>
            {recipientName && (
              <p className="text-xs text-zinc-500 mt-1">
                Prepared for <span className="font-semibold text-zinc-900">{recipientName}</span>
              </p>
            )}
          </div>
          <div className="text-right shrink-0">
            <p className="text-xs text-zinc-400 uppercase tracking-wider font-medium">As of Date</p>
            <p className="text-sm font-bold text-zinc-900">{asOfFormatted}</p>
            <p className="text-[10px] text-zinc-400 mt-0.5">Generated {generatedOn}</p>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-zinc-100">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-0.5">
              Portfolio Companies
            </p>
            <p className="text-2xl font-bold text-zinc-900 font-mono">
              {data.active_company_count}
            </p>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-0.5">
              Total Deployed
            </p>
            <p className="text-2xl font-bold text-zinc-900 font-mono">
              {formatCurrencyFull(data.total_deployed)}
            </p>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-0.5">
              Active Sectors
            </p>
            <p className="text-2xl font-bold text-zinc-900 font-mono">
              {data.sectors.length}
            </p>
            {data.sectors.length > 0 && (
              <p className="text-[10px] text-zinc-500 mt-0.5 truncate">
                {data.sectors.slice(0, 3).join(' · ')}{data.sectors.length > 3 ? ' +more' : ''}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* ── Company Grid & Trajectory ────────────────────────────────── */}
      <div className="px-8 py-6">
        {/* 3-Month Historical Aggregation Trajectory */}
        <MonthlyTrajectorySection points={data.monthly_history} />

        {data.companies.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-14 px-4 text-center bg-zinc-50/50 border border-dashed border-zinc-200 rounded-xl my-2">
            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100/80 flex items-center justify-center mb-3">
              <CalendarX2 className="w-5 h-5 text-[#1a23bd]" />
            </div>
            <h3 className="text-sm font-semibold text-zinc-900 mb-1">
              No portfolio deployments as of {asOfFormatted}
            </h3>
            <p className="text-xs text-zinc-500 max-w-md leading-relaxed mb-4">
              No active portfolio investments were recorded on or prior to this cutoff date.
            </p>
            {onResetDate && (
              <Button
                variant="outline"
                size="xs"
                onClick={onResetDate}
                className="gap-1.5 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                View Current Portfolio
              </Button>
            )}
          </div>
        ) : (
          <>
            <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-4">
              Active Portfolio — {data.active_company_count} {data.active_company_count === 1 ? 'Company' : 'Companies'}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 print:grid-cols-2 print:gap-3">
              {data.companies.map((company) => (
                <CompanyCard key={company.company_id} company={company} />
              ))}
            </div>
          </>
        )}
      </div>

      {/* ── Health Legend ─────────────────────────────────────────────── */}
      <div className="px-8 pb-4">
        <div className="flex items-center gap-4 text-[10px] text-zinc-500">
          <span className="font-bold uppercase tracking-wider text-zinc-400">Health:</span>
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" /> Green — On Track</span>
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-400 inline-block" /> Amber — Monitor</span>
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-red-500 inline-block" /> Red — Attention</span>
        </div>
      </div>

      {/* ── Confidentiality Footer ───────────────────────────────────── */}
      <div className="border-t border-zinc-100 px-8 py-5 bg-zinc-50/50">
        <div className="flex items-start justify-between gap-8">
          <p className="text-[10px] leading-relaxed text-zinc-500 max-w-2xl">
            <span className="font-bold uppercase tracking-wider text-zinc-600">
              Strictly Confidential.{' '}
            </span>
            This document is prepared exclusively for the named recipient and is intended
            for informational purposes only. It does not constitute an offer to sell or a
            solicitation to buy any investment. Past performance of portfolio companies is
            not indicative of future results. TVCLabs Capital reserves all rights.
          </p>
          <p className="text-[10px] text-zinc-400 shrink-0 text-right font-mono">
            TVCLabs Capital Ltd
            <br />
            Portfolio OS v1
          </p>
        </div>
      </div>
    </div>
  )
}
