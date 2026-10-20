'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import type { AngelCompanyDetail } from '@/features/angel-portfolio/types'
import { AngelInstrumentBreakdown } from '@/features/angel-portfolio/components/AngelInstrumentBreakdown'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { createBrowserClient } from '@/lib/supabase/client'
import {
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  Building2,
  DollarSign,
  PieChart,
  FileText,
  Calendar,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react'

interface AngelCompanyDetailViewProps {
  detail: AngelCompanyDetail
}

const HEALTH_STYLES: Record<string, string> = {
  Green: 'text-emerald-700 bg-emerald-50 border-emerald-200',
  Amber: 'text-amber-700 bg-amber-50 border-amber-200',
  Red:   'text-red-700 bg-red-50 border-red-200',
}

const HEALTH_DOT: Record<string, string> = {
  Green: 'bg-emerald-400',
  Amber: 'bg-amber-400',
  Red:   'bg-red-400',
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
]

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
  if (n == null || isNaN(n) || n === 0) return '—'
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

function getMostRecentDate(dates: (string | null)[]): string | null {
  const valid = dates.filter((d): d is string => d !== null)
  if (valid.length === 0) return null
  return valid.sort((a, b) => b.localeCompare(a))[0]
}

function CompanyAvatar({ name, logoPath }: { name: string; logoPath: string | null }) {
  if (logoPath) {
    const supabase = createBrowserClient()
    const { data } = supabase.storage.from('company-logos').getPublicUrl(logoPath)
    return (
      <div className="w-12 h-12 rounded-xl overflow-hidden border border-zinc-100 shrink-0 bg-zinc-50 shadow-xs">
        <Image
          src={data.publicUrl}
          alt={`${name} logo`}
          width={48}
          height={48}
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
    <div className="w-12 h-12 rounded-xl border border-zinc-200/80 bg-zinc-50 shrink-0 flex items-center justify-center shadow-xs">
      <span className="text-sm font-bold text-zinc-600">{initials}</span>
    </div>
  )
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <p className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider">
        {label}
      </p>
      <div className="text-sm font-medium text-zinc-900">{value ?? '—'}</div>
    </div>
  )
}

export function AngelCompanyDetailView({ detail }: AngelCompanyDetailViewProps) {
  const [expandedUpdateId, setExpandedUpdateId] = useState<string | null>(
    detail.monthly_update_items?.[0]?.id ?? null
  )

  const healthStyle = detail.portfolio_health
    ? HEALTH_STYLES[detail.portfolio_health]
    : 'text-zinc-400 bg-zinc-50 border-zinc-200'

  const asOfDate = getMostRecentDate([detail.health_reviewed_at])
  const primaryInstrument = detail.positions[0]?.instrument_name ?? detail.positions[0]?.exposure_type ?? 'Equity'

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">

      {/* Top back navigation & breadcrumb */}
      <div className="flex items-center justify-between">
        <Link
          href="/portfolio"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-600 hover:text-zinc-900 transition-colors py-1 px-2 rounded-lg -ml-2 hover:bg-zinc-100"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to Portfolio
        </Link>
        {asOfDate && (
          <span className="text-[11px] text-zinc-400 font-mono hidden sm:inline">
            Reviewed as of {formatDate(asOfDate)}
          </span>
        )}
      </div>

      {/* Hero Header Card */}
      <div className="bg-white rounded-2xl border border-zinc-200/80 p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5 min-w-0">
            <CompanyAvatar name={detail.company_name} logoPath={detail.logo_path} />
            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl font-bold text-zinc-900 tracking-tight truncate">
                {detail.company_name}
              </h1>
              <p className="text-xs sm:text-sm text-zinc-500 truncate mt-0.5">
                {[detail.stage, detail.sector, detail.country].filter(Boolean).join(' · ') || 'Portfolio Company'}
              </p>
            </div>
          </div>

          {/* Badges */}
          <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
            {detail.is_actively_raising && (
              <span className="inline-flex items-center px-2.5 py-1 rounded-lg border text-xs font-semibold text-amber-700 bg-amber-50 border-amber-200">
                Actively raising
              </span>
            )}
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg border text-xs font-semibold ${healthStyle}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${HEALTH_DOT[detail.portfolio_health ?? ''] ?? 'bg-zinc-400'}`} />
              {detail.portfolio_health ?? 'Not reviewed'}
            </span>
          </div>
        </div>

        {/* 4 Metric Mini-Tiles */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-5 mt-5 border-t border-zinc-100">
          <div className="bg-zinc-50/80 border border-zinc-100 rounded-xl p-3.5">
            <p className="text-[10px] font-medium text-zinc-400 uppercase tracking-wider">
              Total Invested
            </p>
            <p className="text-base sm:text-lg font-bold text-zinc-900 mt-0.5 tabular-nums">
              {formatCurrency(detail.blended.total_invested)}
            </p>
            <p className="text-[10px] text-zinc-400 mt-0.5">Cost basis</p>
          </div>

          <div className="bg-zinc-50/80 border border-zinc-100 rounded-xl p-3.5">
            <p className="text-[10px] font-medium text-zinc-400 uppercase tracking-wider">
              Estimated Value
            </p>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <p className="text-base sm:text-lg font-bold text-zinc-900 tabular-nums">
                {formatCurrency(detail.blended.total_current_value)}
              </p>
              {detail.blended.overall_moic !== null && (
                <span className={`inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-semibold tabular-nums border ${
                  detail.blended.overall_moic > 1.05
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : detail.blended.overall_moic < 0.95
                    ? 'bg-red-50 text-red-700 border-red-200'
                    : 'bg-zinc-50 text-zinc-600 border-zinc-200'
                }`}>
                  {detail.blended.overall_moic.toFixed(1)}x
                </span>
              )}
            </div>
            <p className="text-[10px] text-zinc-400 mt-0.5">Current mark</p>
          </div>

          <div className="bg-zinc-50/80 border border-zinc-100 rounded-xl p-3.5">
            <p className="text-[10px] font-medium text-zinc-400 uppercase tracking-wider">
              Ownership
            </p>
            <p className="text-base sm:text-lg font-bold text-blue-700 mt-0.5 tabular-nums">
              {detail.blended.total_ownership_pct > 0
                ? formatPct(detail.blended.total_ownership_pct)
                : '—'}
            </p>
            <p className="text-[10px] text-zinc-400 mt-0.5">Fully diluted</p>
          </div>

          <div className="bg-zinc-50/80 border border-zinc-100 rounded-xl p-3.5">
            <p className="text-[10px] font-medium text-zinc-400 uppercase tracking-wider">
              Holding Instrument
            </p>
            <p className="text-sm sm:text-base font-semibold text-zinc-800 mt-1 truncate">
              {detail.positions.length > 1 ? `${detail.positions.length} Instruments` : primaryInstrument}
            </p>
          </div>
        </div>
      </div>

      {/* Tabs Section */}
      <Tabs defaultValue="position" className="w-full">
        <TabsList className="w-full grid grid-cols-3 bg-zinc-100 p-1 rounded-xl h-11 mb-6">
          <TabsTrigger
            value="position"
            className="text-xs sm:text-sm font-semibold rounded-lg data-[state=active]:bg-white data-[state=active]:text-zinc-900 data-[state=active]:shadow-xs transition-all px-1 sm:px-3 truncate"
          >
            <span className="sm:hidden">Position</span>
            <span className="hidden sm:inline">Position &amp; Terms</span>
          </TabsTrigger>
          <TabsTrigger
            value="updates"
            className="text-xs sm:text-sm font-semibold rounded-lg data-[state=active]:bg-white data-[state=active]:text-zinc-900 data-[state=active]:shadow-xs transition-all px-1 sm:px-3 truncate"
          >
            <span className="sm:hidden">Updates</span>
            <span className="hidden sm:inline">Updates &amp; Milestones</span>
          </TabsTrigger>
          <TabsTrigger
            value="health"
            className="text-xs sm:text-sm font-semibold rounded-lg data-[state=active]:bg-white data-[state=active]:text-zinc-900 data-[state=active]:shadow-xs transition-all px-1 sm:px-3 truncate"
          >
            <span className="sm:hidden">Health</span>
            <span className="hidden sm:inline">Health &amp; Governance</span>
          </TabsTrigger>
        </TabsList>

        {/* ─── TAB 1: Position & Terms ─── */}
        <TabsContent value="position" className="space-y-6">
          <div className="bg-white rounded-2xl border border-zinc-200/80 p-5 sm:p-6 shadow-xs space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                Personal Holding Terms
              </h2>
              <span className="text-xs text-zinc-500 font-mono">
                {detail.positions.length} position{detail.positions.length !== 1 ? 's' : ''} on ledger
              </span>
            </div>

            {detail.positions.length === 1 ? (
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-6">
                <Field
                  label="Instrument"
                  value={
                    <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-zinc-100 text-xs font-semibold text-zinc-800">
                      {detail.positions[0].instrument_name ?? detail.positions[0].exposure_type}
                    </span>
                  }
                />
                <Field
                  label="Amount Invested"
                  value={
                    <span className="font-bold text-zinc-900 tabular-nums">
                      {formatCurrency(detail.blended.total_invested)}
                    </span>
                  }
                />
                <Field
                  label="Estimated Value"
                  value={
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-zinc-900 tabular-nums">
                        {formatCurrency(detail.positions[0].current_value ?? detail.blended.total_invested)}
                      </span>
                      {detail.positions[0].moic !== null && detail.positions[0].moic !== undefined && (
                        <span className={`inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-semibold tabular-nums border ${
                          detail.positions[0].moic > 1.05
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : detail.positions[0].moic < 0.95
                            ? 'bg-red-50 text-red-700 border-red-200'
                            : 'bg-zinc-50 text-zinc-600 border-zinc-200'
                        }`}>
                          {detail.positions[0].moic.toFixed(1)}x
                        </span>
                      )}
                    </div>
                  }
                />
                <Field
                  label="Ownership"
                  value={
                    detail.blended.total_ownership_pct > 0 ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-blue-50 text-xs font-semibold text-blue-700 tabular-nums">
                        {formatPct(detail.blended.total_ownership_pct)}
                      </span>
                    ) : '—'
                  }
                />
                <Field
                  label="Issue Date"
                  value={formatDate(detail.positions[0].issue_date)}
                />
              </div>
            ) : (
              <AngelInstrumentBreakdown
                positions={detail.positions}
                blendedInvested={detail.blended.total_invested}
                blendedOwnership={detail.blended.total_ownership_pct}
                blendedCurrentValue={detail.blended.total_current_value}
                blendedMoic={detail.blended.overall_moic}
              />
            )}
          </div>
        </TabsContent>

        {/* ─── TAB 2: Updates & Milestones ─── */}
        <TabsContent value="updates" className="space-y-6">
          {/* Cycle status banner */}
          <div className="bg-white rounded-2xl border border-zinc-200/80 p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                Founder Reporting Cycle
              </p>
              <h3 className="text-base font-semibold text-zinc-900 mt-1">
                Current Monthly Update Status
              </h3>
            </div>

            <div>
              {detail.update_submitted_this_cycle ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Submitted for current cycle
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-red-700 bg-red-50 border border-red-200">
                  <AlertCircle className="w-4 h-4 text-red-600" />
                  Overdue for current cycle
                </span>
              )}
            </div>
          </div>

          {/* Submitted Updates List / Feed */}
          <div className="space-y-4">
            <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider px-1">
              Founder Briefings ({detail.monthly_update_items?.length ?? 0})
            </h3>

            {detail.monthly_update_items && detail.monthly_update_items.length > 0 ? (
              detail.monthly_update_items.map((u) => {
                const isExpanded = expandedUpdateId === u.id
                const monthTitle = u.month && u.year ? `${MONTH_NAMES[u.month - 1]} ${u.year}` : 'Monthly Update'

                return (
                  <div
                    key={u.id}
                    className="bg-white rounded-2xl border border-zinc-200/80 shadow-xs overflow-hidden transition-all"
                  >
                    <button
                      type="button"
                      onClick={() => setExpandedUpdateId(isExpanded ? null : u.id)}
                      className="w-full flex items-center justify-between p-5 text-left hover:bg-zinc-50/70 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-700 shrink-0">
                          <FileText className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="text-sm font-semibold text-zinc-900">
                            {monthTitle}
                          </h4>
                          <p className="text-xs text-zinc-400 mt-0.5">
                            Submitted on {formatDate(u.submitted_at)}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {u.status}
                        </span>
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4 text-zinc-400" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-zinc-400" />
                        )}
                      </div>
                    </button>

                    {isExpanded && (
                      <div className="px-5 pb-6 pt-2 border-t border-zinc-100 space-y-5 bg-zinc-50/30">
                        {u.achievements && (
                          <div className="space-y-1.5">
                            <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                              Key Achievements &amp; Milestones
                            </span>
                            <div className="bg-white p-4 rounded-xl border border-zinc-200/80 text-xs text-zinc-700 leading-relaxed whitespace-pre-line shadow-2xs">
                              {u.achievements}
                            </div>
                          </div>
                        )}

                        {u.challenges && (
                          <div className="space-y-1.5">
                            <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wider flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                              Challenges &amp; Headwinds
                            </span>
                            <div className="bg-white p-4 rounded-xl border border-zinc-200/80 text-xs text-zinc-700 leading-relaxed whitespace-pre-line shadow-2xs">
                              {u.challenges}
                            </div>
                          </div>
                        )}

                        {u.targets && (
                          <div className="space-y-1.5">
                            <span className="text-[11px] font-bold text-blue-700 uppercase tracking-wider flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                              Next Month Targets &amp; Ask
                            </span>
                            <div className="bg-white p-4 rounded-xl border border-zinc-200/80 text-xs text-zinc-700 leading-relaxed whitespace-pre-line shadow-2xs">
                              {u.targets}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })
            ) : (
              <div className="bg-white rounded-2xl border border-zinc-200/80 p-8 text-center space-y-2">
                <FileText className="w-6 h-6 text-zinc-300 mx-auto" />
                <p className="text-sm font-medium text-zinc-600">No monthly briefings on file yet</p>
                <p className="text-xs text-zinc-400">Updates will appear here once submitted by the founder.</p>
              </div>
            )}
          </div>
        </TabsContent>

        {/* ─── TAB 3: Health & Governance ─── */}
        <TabsContent value="health" className="space-y-6">
          <div className="bg-white rounded-2xl border border-zinc-200/80 p-5 sm:p-6 shadow-xs space-y-6">
            <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
              Governance &amp; Exit Readiness
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <Field
                label="Portfolio Health"
                value={
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold ${healthStyle}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${HEALTH_DOT[detail.portfolio_health ?? ''] ?? 'bg-zinc-400'}`} />
                    {detail.portfolio_health ?? 'Not reviewed'}
                  </span>
                }
              />
              <Field
                label="Last Review Date"
                value={asOfDate ? formatDate(asOfDate) : '—'}
              />
              <Field
                label="Exit Readiness Signal"
                value={
                  <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-zinc-100 text-xs font-semibold text-zinc-700">
                    {detail.exit_readiness_signal ?? 'Not assessed'}
                  </span>
                }
              />
            </div>
          </div>

          {detail.health_history.length > 0 && (
            <div className="bg-white rounded-2xl border border-zinc-200/80 p-5 sm:p-6 shadow-xs space-y-4">
              <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                Health Status History
              </h2>

              <div className="space-y-0 pt-2">
                {detail.health_history.map((h, index) => {
                  const isLast = index === detail.health_history.length - 1
                  const changed = h.previous_status && h.previous_status !== h.health_status

                  return (
                    <div key={index} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className={`w-2.5 h-2.5 rounded-full mt-1.5 shrink-0 ${HEALTH_DOT[h.health_status] ?? 'bg-zinc-300'}`} />
                        {!isLast && <div className="w-px flex-1 bg-zinc-200 mt-1" />}
                      </div>

                      <div className="pb-5">
                        <p className="text-sm text-zinc-900 font-semibold">
                          {changed
                            ? `Status changed to ${h.health_status}`
                            : `Reviewed — ${h.health_status}`
                          }
                        </p>
                        {changed && h.previous_status && (
                          <p className="text-xs text-zinc-500 mt-0.5">
                            {h.previous_status} &rarr; {h.health_status}
                          </p>
                        )}
                        <p className="text-xs text-zinc-400 mt-0.5 font-mono">
                          {formatDate(h.reviewed_at)}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>

    </div>
  )
}