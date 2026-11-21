import { getDashboardCompanies } from '@/features/companies/services/companies.services'
import { getRecentHealthActivity } from '@/features/companies/services/activity-feed.service'
import { getCapTableDashboardData } from '@/features/cap-table/services/cap-table-dashboard.service'
import DashboardGrid from '@/features/companies/components/DashboardGrid'
import { HealthDonutChart } from '@/features/companies/components/HealthDonutChart'
import { CapTableDashboardSection } from '@/features/cap-table/components/CaptableDashboardSection'
import { RecentActivityFeed } from '@/features/companies/components/RecentActivityFeed'

export const metadata = {
  title: 'Dashboard — TVCLabs Portfolio OS',
}

export default async function InternalDashboard() {
  // Run all three fetches in parallel — none depends on the others
  const [companies, capTableData, activityItems] = await Promise.all([
    getDashboardCompanies(),
    getCapTableDashboardData(),
    getRecentHealthActivity(8),
  ])

  // ── Health aggregations ────────────────────────────────────
  const unset  = companies.filter((c) => !c.portfolio_health).length
  const red    = companies.filter((c) => c.portfolio_health === 'Red').length
  const amber  = companies.filter((c) => c.portfolio_health === 'Amber').length
  const green  = companies.filter((c) => c.portfolio_health === 'Green').length

  // ── Vital strategic aggregations ──────────────────────────
  const totalTracked       = companies.length
  const compliantThisMonth = companies.filter((c) => c.update_submitted_this_cycle).length
  const activelyRaising    = companies.filter((c) => c.is_actively_raising).length
  const exitReady          = companies.filter((c) => c.exit_readiness_signal).length

  return (
    <div className="space-y-8 max-w-[1600px] mx-auto pb-12">

      {/* ── Executive overview header ────────────────────── */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-8 border-b border-zinc-200/80 pb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-zinc-950 tracking-tight">
            Ecosystem control scorecard
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 mt-1">
            Active asset positions and governance health across TVCLabs
          </p>
        </div>

        {/* Metrics strip */}
        <div className="flex flex-wrap items-center gap-x-10 gap-y-6">

          <div className="space-y-1">
            <span className="text-xs font-normal text-zinc-500 block">
              Cycle compliance
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl sm:text-3xl font-semibold text-zinc-950 tracking-tight tabular-nums">
                {compliantThisMonth}
              </span>
              <span className="text-xs text-zinc-500 font-mono">/ {totalTracked} active</span>
            </div>
          </div>

          <div className="space-y-1 border-l border-zinc-200/80 pl-8 xl:pl-10">
            <span className="text-xs font-normal text-zinc-500 block">
              Active fundraises
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl sm:text-3xl font-semibold text-zinc-950 tracking-tight tabular-nums">
                {activelyRaising}
              </span>
              <span className="text-xs text-zinc-500">scaling</span>
            </div>
          </div>

          <div className="space-y-1 border-l border-zinc-200/80 pl-8 xl:pl-10">
            <span className="text-xs font-normal text-zinc-500 block">
              Exit horizons
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl sm:text-3xl font-semibold text-emerald-700 tracking-tight tabular-nums">
                {exitReady}
              </span>
              <span className="text-xs text-zinc-500">clear</span>
            </div>
          </div>

          {/* Donut + legend */}
          <div className="flex items-center gap-4 border-l border-zinc-200/80 pl-8 xl:pl-10">
            <HealthDonutChart red={red} amber={amber} green={green} unset={unset} />
            <div className="flex flex-col gap-1.5 justify-center">
              {red > 0 && (
                <div className="flex items-center gap-1.5 text-xs font-medium text-rose-700">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                  <span className="font-mono tabular-nums">{red}</span> Attention
                </div>
              )}
              {amber > 0 && (
                <div className="flex items-center gap-1.5 text-xs font-medium text-amber-700">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                  <span className="font-mono tabular-nums">{amber}</span> Monitor
                </div>
              )}
              {green > 0 && (
                <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-700">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <span className="font-mono tabular-nums">{green}</span> On track
                </div>
              )}
              {unset > 0 && (
                <div className="flex items-center gap-1.5 text-xs font-medium text-zinc-500">
                  <span className="w-1.5 h-1.5 rounded-full bg-zinc-300" />
                  <span className="font-mono tabular-nums">{unset}</span> Unreviewed
                </div>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* ── Company grid ─────────────────────────────────── */}
      <DashboardGrid companies={companies} />

      {/* ── Recent activity feed ─────────────────────────── */}
      <RecentActivityFeed items={activityItems} />

      {/* ── Cap table & ownership section ────────────────── */}
      <CapTableDashboardSection data={capTableData.data} />

    </div>
  )
}
