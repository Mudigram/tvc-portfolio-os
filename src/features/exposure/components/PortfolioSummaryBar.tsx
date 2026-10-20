interface PortfolioSummaryBarProps {
    total_deployed: number
    active_instruments: number
    companies_tracked: number
    holders_on_record: number
  }
  
  function formatCurrency(n: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(n)
  }
  
  function Stat({
    label,
    value,
    highlight,
  }: {
    label: string
    value: string | number
    highlight?: boolean
  }) {
    return (
      <div className="space-y-1.5">
        <p className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
          {label}
        </p>
        <p className={`text-2xl sm:text-3xl font-bold tracking-tight tabular-nums ${
          highlight ? 'text-zinc-900' : 'text-zinc-800'
        }`}>
          {value}
        </p>
      </div>
    )
  }
  
  export function PortfolioSummaryBar({
    total_deployed,
    active_instruments,
    companies_tracked,
    holders_on_record,
  }: PortfolioSummaryBarProps) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 p-5 sm:p-6 rounded-2xl border border-zinc-200/80 bg-white shadow-xs">
        <Stat
          label="Total deployed"
          value={formatCurrency(total_deployed)}
          highlight
        />
        <Stat
          label="Companies tracked"
          value={companies_tracked}
        />
        <Stat
          label="Active instruments"
          value={active_instruments}
        />
        <Stat
          label="Holders on record"
          value={holders_on_record}
        />
      </div>
    )
  }