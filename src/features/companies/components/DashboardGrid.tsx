import DashboardCard from '@/features/companies/components/DashboardCard'
import type { CompanyCardData } from '@/features/companies/types'

interface DashboardGridProps {
  companies: CompanyCardData[]
}

export default function DashboardGrid({ companies }: DashboardGridProps) {
  if (companies.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <p className="text-sm font-medium text-zinc-900">No companies yet</p>
        <p className="text-sm text-zinc-400 mt-1">
          Add a company to start tracking portfolio health.
        </p>
      </div>
    )
  }

  // Sort: Red → Amber → Green → unset
  const order = { Red: 0, Amber: 1, Green: 2 }
  const sorted = [...companies].sort((a, b) => {
    const aOrder = a.portfolio_health ? (order[a.portfolio_health] ?? 3) : 3
    const bOrder = b.portfolio_health ? (order[b.portfolio_health] ?? 3) : 3
    return aOrder - bOrder
  })

  const red   = sorted.filter((c) => c.portfolio_health === 'Red')
  const amber = sorted.filter((c) => c.portfolio_health === 'Amber')
  const green = sorted.filter((c) => c.portfolio_health === 'Green')
  const unset = sorted.filter((c) => !c.portfolio_health)

  return (
    <div className="space-y-10">
      {red.length > 0 && (
        <Section label="Needs attention" count={red.length} companies={red} />
      )}
      {amber.length > 0 && (
        <Section label="Monitor closely" count={amber.length} companies={amber} />
      )}
      {green.length > 0 && (
        <Section label="On track" count={green.length} companies={green} />
      )}
      {unset.length > 0 && (
        <Section label="Not reviewed" count={unset.length} companies={unset} />
      )}
    </div>
  )
}

function Section({
  label,
  count,
  companies,
}: {
  label: string
  count: number
  companies: CompanyCardData[]
}) {
  return (
    <div>
      <div className="flex items-baseline gap-2 mb-4">
        <h2 className="text-xs font-medium uppercase tracking-wide text-zinc-400">
          {label}
        </h2>
        <span className="text-xs text-zinc-300">{count}</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {companies.map((company) => (
          <DashboardCard key={company.id} company={company} />
        ))}
      </div>
    </div>
  )
}