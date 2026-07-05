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
    <div className="space-y-12 max-w-[1600px] mx-auto py-2 mb-10">

      {/* ── Executive overview header ────────────────────── */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-8 border-b border-zinc-100 pb-8">
        <div>
          <h1 className="text-xl font-semibold text-zinc-900 tracking-tight">
            Ecosystem Control Scorecard
          </h1>
          <p className="text-xs text-zinc-400 mt-1 uppercase tracking-wider font-medium">
            Active Asset Positions & Governance Health
          </p>
        </div>

        {/* Metrics strip */}
        <div className="flex flex-wrap items-center gap-x-12 gap-y-6">

          <div className="space-y-1">
            <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block">
              Cycle Compliance
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-semibold text-zinc-900 tracking-tight">
                {compliantThisMonth}
              </span>
              <span className="text-xs text-zinc-400 font-medium">/ {totalTracked} active</span>
            </div>
          </div>

          <div className="space-y-1 border-l border-zinc-100 pl-8 xl:pl-12">
            <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block">
              Active Fundraises
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-semibold text-[#1a23bd] tracking-tight">
                {activelyRaising}
              </span>
              <span className="text-xs text-zinc-400 font-medium">assets scaling</span>
            </div>
          </div>

          <div className="space-y-1 border-l border-zinc-100 pl-8 xl:pl-12">
            <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block">
              Exit Horizons
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-semibold text-emerald-600 tracking-tight">
                {exitReady}
              </span>
              <span className="text-xs text-zinc-400 font-medium">signals clear</span>
            </div>
          </div>

          {/* Donut + legend */}
          <div className="flex items-center gap-4 border-l border-zinc-100 pl-8 xl:pl-12">
            <HealthDonutChart red={red} amber={amber} green={green} unset={unset} />
            <div className="flex flex-col gap-1 justify-center">
              {red > 0 && (
                <div className="flex items-center gap-1.5 text-xs font-semibold text-red-600">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                  <span>{red} Critical</span>
                </div>
              )}
              {amber > 0 && (
                <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-600">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                  <span>{amber} Pending</span>
                </div>
              )}
              {green > 0 && (
                <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <span>{green} Stable</span>
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
        <CapTableDashboardSection {...capTableData} />

    </div>
  )
}