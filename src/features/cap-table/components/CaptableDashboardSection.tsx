// ─────────────────────────────────────────────────────────────
// CapTableDashboardSection — server component
// Rendered below DashboardGrid on the internal dashboard.
// Matches the existing metric strip and card visual language.
// ─────────────────────────────────────────────────────────────
"use client"
import Link from 'next/link'
import type { CapTableDashboardData } from '../services/cap-table-dashboard.service'

interface Props {
  data: CapTableDashboardData
}

// ── Shared primitives ─────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block">
      {children}
    </span>
  )
}

function MetricValue({
  value,
  color = 'zinc',
}: {
  value: string | number
  color?: 'zinc' | 'blue' | 'emerald' | 'red' | 'amber'
}) {
  const colorClass = {
    zinc:    'text-zinc-900',
    blue:    'text-[#1a23bd]',
    emerald: 'text-emerald-600',
    red:     'text-red-600',
    amber:   'text-amber-600',
  }[color]

  return (
    <span className={`text-2xl font-semibold tracking-tight ${colorClass}`}>
      {value}
    </span>
  )
}

function DistributionBar({
  segments,
}: {
  segments: { value: number; color: string; label: string }[]
}) {
  const total = segments.reduce((s, seg) => s + seg.value, 0)
  if (total === 0) return <div className="h-2 rounded-full bg-zinc-100 w-full" />

  return (
    <div className="flex h-2 w-full rounded-full overflow-hidden gap-px">
      {segments
        .filter((seg) => seg.value > 0)
        .map((seg) => (
          <div
            key={seg.label}
            title={`${seg.label}: ${seg.value}`}
            className={`${seg.color} transition-all`}
            style={{ width: `${(seg.value / total) * 100}%` }}
          />
        ))}
    </div>
  )
}

function DistributionLegend({
  items,
}: {
  items: { label: string; value: number; dotColor: string }[]
}) {
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
      {items
        .filter((i) => i.value > 0)
        .map((item) => (
          <div key={item.label} className="flex items-center gap-1.5 text-xs text-zinc-500">
            <span className={`w-1.5 h-1.5 rounded-full ${item.dotColor} shrink-0`} />
            <span>{item.value} {item.label}</span>
          </div>
        ))}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────────────────────

export function CapTableDashboardSection({ data }: Props) {
  const {
    total_companies,
    has_current_cap_table,
    missing_cap_table,
    outdated_cap_table,
    compliance_pct,
    status_green,
    status_amber,
    status_red,
    ownership_increased,
    ownership_maintained,
    ownership_diluted_lt5,
    ownership_diluted_5_10,
    ownership_diluted_gt10,
    dilution_0_10,
    dilution_11_25,
    dilution_26_50,
    dilution_gt50,
    avg_founder_dilution,
    avg_tvc_ownership_change,
    alerts,
  } = data

  const complianceColor =
    compliance_pct >= 80 ? 'emerald'
    : compliance_pct >= 50 ? 'amber'
    : 'red'

  return (
    <div className="space-y-8 border-t border-zinc-100 pt-10">

      {/* Section header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-zinc-900 tracking-tight">
            Cap Table & Ownership
          </h2>
          <p className="text-xs text-zinc-400 mt-1 uppercase tracking-wider font-medium">
            Ownership governance across the active portfolio
          </p>
        </div>

        {/* Compliance pill */}
        <div className="flex items-center gap-2 rounded-xl border border-zinc-100 bg-zinc-50 px-5 py-3">
          <SectionLabel>Cap table compliance</SectionLabel>
          <span className={`text-2xl font-semibold tracking-tight ${
            complianceColor === 'emerald' ? 'text-emerald-600'
            : complianceColor === 'amber' ? 'text-amber-600'
            : 'text-red-600'
          }`}>
            {compliance_pct}%
          </span>
          <span className="text-xs text-zinc-400 font-medium">
            {has_current_cap_table} / {total_companies}
          </span>
        </div>
      </div>

      {/* ── Summary metric strip ─────────────────────────── */}
      <div className="flex flex-wrap items-center gap-x-12 gap-y-6 rounded-xl border border-zinc-100 bg-zinc-50 px-8 py-6">

        <div className="space-y-1">
          <SectionLabel>Current cap tables</SectionLabel>
          <div className="flex items-baseline gap-1.5">
            <MetricValue value={has_current_cap_table} color="emerald" />
            <span className="text-xs text-zinc-400 font-medium">/ {total_companies} companies</span>
          </div>
        </div>

        <div className="space-y-1 border-l border-zinc-100 pl-8 xl:pl-12">
          <SectionLabel>Missing cap tables</SectionLabel>
          <div className="flex items-baseline gap-1.5">
            <MetricValue value={missing_cap_table} color={missing_cap_table > 0 ? 'red' : 'zinc'} />
            <span className="text-xs text-zinc-400 font-medium">no document</span>
          </div>
        </div>

        <div className="space-y-1 border-l border-zinc-100 pl-8 xl:pl-12">
          <SectionLabel>Outdated cap tables</SectionLabel>
          <div className="flex items-baseline gap-1.5">
            <MetricValue value={outdated_cap_table} color={outdated_cap_table > 0 ? 'amber' : 'zinc'} />
            <span className="text-xs text-zinc-400 font-medium">&gt; 12 months</span>
          </div>
        </div>

        <div className="space-y-1 border-l border-zinc-100 pl-8 xl:pl-12">
          <SectionLabel>Avg founder dilution</SectionLabel>
          <div className="flex items-baseline gap-1.5">
            <MetricValue
              value={avg_founder_dilution != null ? `${avg_founder_dilution}%` : '—'}
              color={avg_founder_dilution != null && avg_founder_dilution > 25 ? 'red' : 'zinc'}
            />
          </div>
        </div>

        <div className="space-y-1 border-l border-zinc-100 pl-8 xl:pl-12">
          <SectionLabel>Avg TVC ownership change</SectionLabel>
          <div className="flex items-baseline gap-1.5">
            <MetricValue
              value={avg_tvc_ownership_change != null ? `${avg_tvc_ownership_change}%` : '—'}
              color={
                avg_tvc_ownership_change == null ? 'zinc'
                : avg_tvc_ownership_change < 0 ? 'emerald'  // increased
                : avg_tvc_ownership_change > 10 ? 'red'
                : 'zinc'
              }
            />
            {avg_tvc_ownership_change != null && (
              <span className="text-xs text-zinc-400 font-medium">
                {avg_tvc_ownership_change < 0 ? 'avg increase' : 'avg dilution'}
              </span>
            )}
          </div>
        </div>

      </div>

      {/* ── Distribution grid ────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

        {/* Cap Table Status */}
        <div className="rounded-xl border border-zinc-100 bg-white p-5 space-y-4 shadow-sm">
          <div>
            <h3 className="text-xs font-semibold text-zinc-800">Cap table status</h3>
            <p className="text-xs text-zinc-400 mt-0.5">Document freshness across portfolio</p>
          </div>
          <DistributionBar
            segments={[
              { value: status_green, color: 'bg-emerald-400', label: 'Green' },
              { value: status_amber, color: 'bg-amber-400',   label: 'Amber' },
              { value: status_red,   color: 'bg-red-400',     label: 'Red'   },
            ]}
          />
          <DistributionLegend
            items={[
              { label: 'Up to date',  value: status_green, dotColor: 'bg-emerald-400' },
              { label: 'Outdated',    value: status_amber, dotColor: 'bg-amber-400'   },
              { label: 'Missing',     value: status_red,   dotColor: 'bg-red-400'     },
            ]}
          />
        </div>

        {/* Founder Dilution */}
        <div className="rounded-xl border border-zinc-100 bg-white p-5 space-y-4 shadow-sm">
          <div>
            <h3 className="text-xs font-semibold text-zinc-800">Founder dilution</h3>
            <p className="text-xs text-zinc-400 mt-0.5">Distribution across active positions</p>
          </div>
          <DistributionBar
            segments={[
              { value: dilution_0_10,  color: 'bg-emerald-400', label: '0–10%'  },
              { value: dilution_11_25, color: 'bg-amber-300',   label: '11–25%' },
              { value: dilution_26_50, color: 'bg-orange-400',  label: '26–50%' },
              { value: dilution_gt50,  color: 'bg-red-500',     label: '>50%'   },
            ]}
          />
          <DistributionLegend
            items={[
              { label: '0–10%',  value: dilution_0_10,  dotColor: 'bg-emerald-400' },
              { label: '11–25%', value: dilution_11_25, dotColor: 'bg-amber-300'   },
              { label: '26–50%', value: dilution_26_50, dotColor: 'bg-orange-400'  },
              { label: '>50%',   value: dilution_gt50,  dotColor: 'bg-red-500'     },
            ]}
          />
        </div>

        {/* TVC Ownership Movement */}
        <div className="rounded-xl border border-zinc-100 bg-white p-5 space-y-4 shadow-sm">
          <div>
            <h3 className="text-xs font-semibold text-zinc-800">TVC ownership movement</h3>
            <p className="text-xs text-zinc-400 mt-0.5">Change since investment</p>
          </div>
          <DistributionBar
            segments={[
              { value: ownership_increased,    color: 'bg-emerald-400', label: 'Increased'   },
              { value: ownership_maintained,   color: 'bg-zinc-300',    label: 'Maintained'  },
              { value: ownership_diluted_lt5,  color: 'bg-amber-300',   label: 'Diluted <5%' },
              { value: ownership_diluted_5_10, color: 'bg-orange-400',  label: 'Diluted 5–10%' },
              { value: ownership_diluted_gt10, color: 'bg-red-500',     label: 'Diluted >10%' },
            ]}
          />
          <DistributionLegend
            items={[
              { label: 'Increased',    value: ownership_increased,    dotColor: 'bg-emerald-400' },
              { label: 'Maintained',   value: ownership_maintained,   dotColor: 'bg-zinc-300'    },
              { label: 'Diluted <5%',  value: ownership_diluted_lt5,  dotColor: 'bg-amber-300'   },
              { label: 'Diluted 5–10%',value: ownership_diluted_5_10, dotColor: 'bg-orange-400'  },
              { label: 'Diluted >10%', value: ownership_diluted_gt10, dotColor: 'bg-red-500'     },
            ]}
          />
        </div>

      </div>

      {/* ── Alerts ──────────────────────────────────────── */}
      {alerts.length > 0 && (
        <div className="rounded-xl border border-zinc-100 bg-white p-5 shadow-sm space-y-4">
          <div>
            <h3 className="text-xs font-semibold text-zinc-800">Ownership alerts</h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              Companies requiring attention — click to go to their cap table
            </p>
          </div>
          <div className="divide-y divide-zinc-50">
          {alerts.map((alert: CapTableDashboardData['alerts'][number], i: number) => {
              const config = {
                missing_cap_table:  { label: 'Missing cap table',           color: 'text-red-600 bg-red-50 border-red-200'     },
                outdated_cap_table: { label: 'Cap table outdated (>12 mo)', color: 'text-amber-700 bg-amber-50 border-amber-200' },
                founder_dilution:   { label: 'Founder dilution above threshold', color: 'text-orange-700 bg-orange-50 border-orange-200' },
                tvc_dilution:       { label: 'TVC ownership dilution above threshold', color: 'text-red-600 bg-red-50 border-red-200' },
              }[alert.alert_type]

              return (
                <div key={i} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                  <div className="flex items-center gap-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded border text-xs font-medium ${config.color}`}>
                      {config.label}
                    </span>
                    <span className="text-sm text-zinc-700 font-medium">
                      {alert.company_name}
                    </span>
                  </div>
                  <Link
                    href={`/companies/${alert.company_id}?tab=cap-table`}
                    className="text-xs text-[#1a23bd] hover:text-[#1520a8] underline underline-offset-2 transition-colors whitespace-nowrap"
                  >
                    View cap table →
                  </Link>
                </div>
              )
            })}
          </div>
        </div>
      )}

    </div>
  )
}