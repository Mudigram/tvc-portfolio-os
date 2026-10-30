'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import type { AngelCompanyDetail } from '@/features/angel-portfolio/types'
import { AngelInstrumentBreakdown } from '@/features/angel-portfolio/components/AngelInstrumentBreakdown'
import { AngelCompanyTimeline, type TimelineEvent } from '@/features/angel-portfolio/components/detail/AngelCompanyTimeline'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import {
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  FileText,
  CheckCircle2,
  AlertCircle,
  Zap,
  ShieldCheck,
  Share2,
  Handshake,
  Layers,
} from 'lucide-react'

interface AngelCompanyDetailViewProps {
  detail: AngelCompanyDetail
}

const HEALTH_CONFIG: Record<string, { badge: string; dot: string; label: string }> = {
  Green: { badge: 'text-emerald-800 bg-emerald-50 border-emerald-200', dot: 'bg-emerald-500', label: 'On Track' },
  Amber: { badge: 'text-amber-800 bg-amber-50 border-amber-200', dot: 'bg-amber-500', label: 'Monitor' },
  Red:   { badge: 'text-red-800 bg-red-50 border-red-200', dot: 'bg-red-500', label: 'Attention' },
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
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const fullUrl = `${supabaseUrl}/storage/v1/object/public/company-logos/${logoPath}`
    return (
      <div className="w-12 h-12 rounded-xl overflow-hidden border border-zinc-200 shrink-0 bg-zinc-50 shadow-2xs">
        <Image
          src={fullUrl}
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
    <div className="w-12 h-12 rounded-xl border border-zinc-200 bg-zinc-50 shrink-0 flex items-center justify-center shadow-2xs">
      <span className="text-sm font-bold text-zinc-700 tracking-tight">{initials}</span>
    </div>
  )
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
        {label}
      </p>
      <div className="text-sm font-semibold text-zinc-900">{value ?? '—'}</div>
    </div>
  )
}

export function AngelCompanyDetailView({ detail }: AngelCompanyDetailViewProps) {
  const [expandedUpdateId, setExpandedUpdateId] = useState<string | null>(
    detail.monthly_update_items?.[0]?.id ?? null
  )

  const healthConfig = detail.portfolio_health
    ? HEALTH_CONFIG[detail.portfolio_health]
    : null

  const asOfDate = getMostRecentDate([detail.health_reviewed_at])
  const primaryInstrument = detail.positions[0]?.instrument_name ?? detail.positions[0]?.exposure_type ?? 'Equity'

  // Synthesize unified milestone timeline events
  const timelineEvents: TimelineEvent[] = useMemo(() => {
    const events: TimelineEvent[] = [
      ...detail.health_history.map((h, i) => ({
        id: `health-${i}`,
        date: h.reviewed_at,
        type: 'health' as const,
        title: h.previous_status && h.previous_status !== h.health_status
          ? `Governance rating adjusted to ${h.health_status}`
          : `Governance review: ${h.health_status}`,
        description: h.previous_status && h.previous_status !== h.health_status
          ? `Status transitioned from ${h.previous_status} to ${h.health_status} during periodic TVCLabs review.`
          : `Periodic portfolio review completed by TVCLabs.`,
        status: h.health_status,
      })),
      ...detail.positions.filter(p => p.issue_date).map((p, i) => ({
        id: `pos-${i}`,
        date: p.issue_date!,
        type: 'round' as const,
        title: `Security Issue: ${p.instrument_name ?? p.exposure_type}`,
        description: `Holding registered on ledger with initial cost basis of ${formatCurrency(p.amount_invested)}.`,
        status: p.status,
      })),
      ...(detail.monthly_update_items ?? []).filter(u => u.submitted_at).map((u, i) => ({
        id: `update-${i}`,
        date: u.submitted_at!,
        type: 'briefing' as const,
        title: u.month && u.year ? `Founder Briefing (${MONTH_NAMES[u.month - 1]} ${u.year})` : 'Monthly Founder Briefing',
        description: u.achievements ? u.achievements.slice(0, 160) + (u.achievements.length > 160 ? '...' : '') : 'Operational update submitted by founder.',
        status: u.status,
      }))
    ]
    return events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }, [detail])

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-16">

      {/* Top back navigation & breadcrumb */}
      <div className="flex items-center justify-between">
        <Link
          href="/portfolio"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-700 hover:text-zinc-900 transition-colors py-1.5 px-2.5 rounded-lg -ml-2 hover:bg-zinc-100 min-h-[36px]"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to Portfolio
        </Link>
        {asOfDate && (
          <span className="text-xs text-zinc-500 font-mono hidden sm:inline">
            Reviewed as of {formatDate(asOfDate)}
          </span>
        )}
      </div>

      {/* Hero Header Card */}
      <div className="bg-white rounded-2xl border border-zinc-200/90 p-5 sm:p-6 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5 min-w-0">
            <CompanyAvatar name={detail.company_name} logoPath={detail.logo_path} />
            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl font-bold text-zinc-900 tracking-tight truncate">
                {detail.company_name}
              </h1>
              <p className="text-xs sm:text-sm font-medium text-zinc-600 truncate mt-0.5">
                {[detail.stage, detail.sector, detail.country].filter(Boolean).join(' · ') || 'Portfolio Company'}
              </p>
            </div>
          </div>

          {/* Badges & Actions */}
          <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-semibold text-zinc-800 bg-zinc-50 border-zinc-200">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
              Verified Holding
            </span>

            {detail.is_actively_raising && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border text-xs font-bold text-amber-800 bg-[#FDF9F3] border-amber-200">
                <Zap className="w-3.5 h-3.5 fill-amber-500 text-amber-600" />
                Raising
              </span>
            )}

            {healthConfig ? (
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg border text-xs font-semibold ${healthConfig.badge}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${healthConfig.dot}`} />
                {healthConfig.label}
              </span>
            ) : (
              <span className="inline-flex items-center px-2.5 py-1 rounded-lg border text-xs font-medium text-zinc-600 bg-zinc-50 border-zinc-200">
                Unreviewed
              </span>
            )}
          </div>
        </div>

        {/* 4 Metric Mini-Tiles */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-5 border-t border-zinc-100">
          <div className="bg-zinc-50/70 border border-zinc-200/60 rounded-xl p-3.5">
            <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
              Total Invested
            </p>
            <p className="text-base sm:text-lg font-bold text-zinc-900 mt-1 tabular-nums">
              {formatCurrency(detail.blended.total_invested)}
            </p>
            <p className="text-xs text-zinc-500 mt-0.5">Cost basis</p>
          </div>

          <div className="bg-zinc-50/70 border border-zinc-200/60 rounded-xl p-3.5">
            <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
              Estimated Value
            </p>
            <div className="flex items-baseline gap-1.5 mt-1">
              <p className="text-base sm:text-lg font-bold text-zinc-900 tabular-nums">
                {formatCurrency(detail.blended.total_current_value)}
              </p>
              {detail.blended.overall_moic !== null && (
                <span className={`inline-flex items-center px-1.5 py-0.2 rounded text-[11px] font-bold tabular-nums border ${
                  detail.blended.overall_moic > 1.05
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    : detail.blended.overall_moic < 0.95
                    ? 'bg-red-50 text-red-800 border-red-200'
                    : 'bg-zinc-100 text-zinc-700 border-zinc-200'
                }`}>
                  {detail.blended.overall_moic.toFixed(1)}x
                </span>
              )}
            </div>
            <p className="text-xs text-zinc-500 mt-0.5">Current mark</p>
          </div>

          <div className="bg-zinc-50/70 border border-zinc-200/60 rounded-xl p-3.5">
            <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
              Ownership
            </p>
            <p className="text-base sm:text-lg font-bold text-blue-800 mt-1 tabular-nums">
              {detail.blended.total_ownership_pct > 0
                ? formatPct(detail.blended.total_ownership_pct)
                : '—'}
            </p>
            <p className="text-xs text-zinc-500 mt-0.5">Fully diluted</p>
          </div>

          <div className="bg-zinc-50/70 border border-zinc-200/60 rounded-xl p-3.5">
            <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
              Holding Instrument
            </p>
            <p className="text-sm sm:text-base font-semibold text-zinc-900 mt-1 truncate">
              {detail.positions.length > 1 ? `${detail.positions.length} Instruments` : primaryInstrument}
            </p>
            <p className="text-xs text-zinc-500 mt-0.5">
              {detail.positions.length > 1 ? 'Blended ledger' : 'Primary security'}
            </p>
          </div>
        </div>
      </div>

      {/* Tabs Section */}
      <Tabs defaultValue="position" className="w-full">
        <TabsList className="w-full grid grid-cols-3 bg-zinc-100 p-1 rounded-xl h-11 mb-6">
          <TabsTrigger
            value="position"
            className="text-xs sm:text-sm font-semibold rounded-lg data-[state=active]:bg-white data-[state=active]:text-zinc-900 data-[state=active]:shadow-xs transition-all px-2 sm:px-4 truncate min-h-[36px]"
          >
            <span>Position &amp; Terms</span>
          </TabsTrigger>
          <TabsTrigger
            value="updates"
            className="text-xs sm:text-sm font-semibold rounded-lg data-[state=active]:bg-white data-[state=active]:text-zinc-900 data-[state=active]:shadow-xs transition-all px-2 sm:px-4 truncate min-h-[36px]"
          >
            <span>Founder Briefings ({detail.monthly_update_items?.length ?? 0})</span>
          </TabsTrigger>
          <TabsTrigger
            value="health"
            className="text-xs sm:text-sm font-semibold rounded-lg data-[state=active]:bg-white data-[state=active]:text-zinc-900 data-[state=active]:shadow-xs transition-all px-2 sm:px-4 truncate min-h-[36px]"
          >
            <span>Governance &amp; History</span>
          </TabsTrigger>
        </TabsList>

        {/* ─── TAB 1: Position & Terms ─── */}
        <TabsContent value="position" className="space-y-6">
          <div className="bg-white rounded-2xl border border-zinc-200/90 p-5 sm:p-6 shadow-xs space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
                Personal Holding Terms
              </h2>
              <span className="text-xs text-zinc-600 font-mono">
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
                        <span className={`inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-bold tabular-nums border ${
                          detail.positions[0].moic > 1.05
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : detail.positions[0].moic < 0.95
                            ? 'bg-red-50 text-red-800 border-red-200'
                            : 'bg-zinc-100 text-zinc-700 border-zinc-200'
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
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-blue-50 text-xs font-bold text-blue-800 tabular-nums border border-blue-100">
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

          {/* Co-Investment / Syndicate Callout (Marketing Idea #137) */}
          {detail.is_actively_raising && (
            <div className="bg-[#FDF9F3] border border-amber-200/90 rounded-2xl p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs">
              <div className="space-y-1">
                <span className="text-xs font-bold text-amber-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 fill-amber-500 text-amber-600" />
                  Active Syndicate Round
                </span>
                <p className="text-sm font-semibold text-zinc-900">
                  {detail.company_name} is actively raising follow-on capital
                </p>
                <p className="text-xs text-zinc-600">
                  Existing angels have pro-rata rights and access to syndicate allocation.
                </p>
              </div>

              <a
                href={`mailto:invest@tvclabs.com?subject=Pro-Rata%20%26%20Co-Investment%20Inquiry%20-%20${encodeURIComponent(detail.company_name)}`}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white border border-amber-300 text-xs font-bold text-amber-900 hover:bg-amber-50 transition-colors shadow-2xs shrink-0 self-start sm:self-center"
              >
                <Share2 className="w-3.5 h-3.5 text-amber-700" />
                Exercise Pro-Rata / Refer Angel
              </a>
            </div>
          )}
        </TabsContent>

        {/* ─── TAB 2: Updates & Milestones ─── */}
        <TabsContent value="updates" className="space-y-6">
          {/* Cycle status banner */}
          <div className="bg-white rounded-2xl border border-zinc-200/90 p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
                Founder Reporting Cycle
              </p>
              <h3 className="text-base font-semibold text-zinc-900 mt-1">
                Current Monthly Update Status
              </h3>
            </div>

            <div>
              {detail.update_submitted_this_cycle ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Submitted for current cycle
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-amber-800 bg-amber-50 border border-amber-200">
                  <AlertCircle className="w-4 h-4 text-amber-600" />
                  Pending founder submission
                </span>
              )}
            </div>
          </div>

          {/* Submitted Updates List */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider px-1">
              Monthly Founder Reports ({detail.monthly_update_items?.length ?? 0})
            </h3>

            {detail.monthly_update_items && detail.monthly_update_items.length > 0 ? (
              detail.monthly_update_items.map((u) => {
                const isExpanded = expandedUpdateId === u.id
                const monthTitle = u.month && u.year ? `${MONTH_NAMES[u.month - 1]} ${u.year}` : 'Monthly Update'

                return (
                  <div
                    key={u.id}
                    className="bg-white rounded-2xl border border-zinc-200/90 shadow-2xs overflow-hidden transition-all"
                  >
                    <button
                      type="button"
                      onClick={() => setExpandedUpdateId(isExpanded ? null : u.id)}
                      className="w-full flex items-center justify-between p-5 text-left hover:bg-zinc-50/70 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-700 shrink-0">
                          <FileText className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-zinc-900">
                            {monthTitle}
                          </h4>
                          <p className="text-xs text-zinc-500 mt-0.5">
                            Submitted on {formatDate(u.submitted_at)}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                          {u.status}
                        </span>
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4 text-zinc-500" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-zinc-500" />
                        )}
                      </div>
                    </button>

                    {isExpanded && (
                      <div className="px-5 pb-6 pt-3 border-t border-zinc-100 space-y-5 bg-zinc-50/30">
                        {u.achievements && (
                          <div className="space-y-1.5">
                            <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-emerald-500" />
                              Key Achievements &amp; Milestones
                            </span>
                            <div className="bg-white p-4 rounded-xl border border-zinc-200/80 text-xs text-zinc-800 leading-relaxed whitespace-pre-line shadow-2xs">
                              {u.achievements}
                            </div>
                          </div>
                        )}

                        {u.challenges && (
                          <div className="space-y-1.5">
                            <span className="text-xs font-bold text-amber-800 uppercase tracking-wider flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-amber-500" />
                              Challenges &amp; Headwinds
                            </span>
                            <div className="bg-white p-4 rounded-xl border border-zinc-200/80 text-xs text-zinc-800 leading-relaxed whitespace-pre-line shadow-2xs">
                              {u.challenges}
                            </div>
                          </div>
                        )}

                        {u.targets && (
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-blue-800 uppercase tracking-wider flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-blue-500" />
                                Targets &amp; Founder Asks
                              </span>

                              {/* Marketing Idea #47: Founder Help / Lend a Hand */}
                              <a
                                href={`mailto:invest@tvclabs.com?subject=Founder%20Introduction%20Offer%20-%20${encodeURIComponent(detail.company_name)}&body=I%20can%20assist%20with%20the%20ask%20noted%20in%20the%20${encodeURIComponent(monthTitle)}%20update.`}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-blue-50 border border-blue-200 text-[11px] font-bold text-blue-800 hover:bg-blue-100 transition-colors"
                              >
                                <Handshake className="w-3 h-3 text-blue-700" />
                                <span>Assist with this Ask</span>
                              </a>
                            </div>

                            <div className="bg-white p-4 rounded-xl border border-zinc-200/80 text-xs text-zinc-800 leading-relaxed whitespace-pre-line shadow-2xs">
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
              <div className="bg-white rounded-2xl border border-zinc-200/90 p-8 text-center space-y-2 shadow-xs">
                <FileText className="w-6 h-6 text-zinc-400 mx-auto" />
                <p className="text-sm font-semibold text-zinc-700">No monthly briefings on file yet</p>
                <p className="text-xs text-zinc-500">Updates will appear here once submitted by the founder.</p>
              </div>
            )}
          </div>
        </TabsContent>

        {/* ─── TAB 3: Health & Governance ─── */}
        <TabsContent value="health" className="space-y-6">
          <div className="bg-white rounded-2xl border border-zinc-200/90 p-5 sm:p-6 shadow-xs space-y-6">
            <h2 className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
              Governance &amp; Exit Telemetry
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <Field
                label="Portfolio Health"
                value={
                  healthConfig ? (
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold ${healthConfig.badge}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${healthConfig.dot}`} />
                      {healthConfig.label}
                    </span>
                  ) : (
                    <span className="text-zinc-500 text-xs">Unreviewed</span>
                  )
                }
              />
              <Field
                label="Last Review Date"
                value={asOfDate ? formatDate(asOfDate) : '—'}
              />
              <Field
                label="Exit Readiness Signal"
                value={
                  <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-zinc-100 text-xs font-semibold text-zinc-800">
                    {detail.exit_readiness_signal ?? 'Not assessed'}
                  </span>
                }
              />
            </div>
          </div>

          {/* Interactive Milestone Timeline */}
          <div className="bg-white rounded-2xl border border-zinc-200/90 p-5 sm:p-6 shadow-xs space-y-4">
            <h2 className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
              Milestone &amp; Governance Timeline
            </h2>
            <AngelCompanyTimeline events={timelineEvents} />
          </div>
        </TabsContent>
      </Tabs>

    </div>
  )
}
