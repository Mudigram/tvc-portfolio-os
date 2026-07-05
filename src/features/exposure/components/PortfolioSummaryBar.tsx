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
      <div className="space-y-1">
        <p className="text-xs font-medium text-zinc-400 uppercase tracking-wide">
          {label}
        </p>
        <p className={`text-2xl font-medium tracking-tight ${
          highlight ? 'text-zinc-900' : 'text-zinc-700'
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
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 px-8 py-6 rounded-xl border border-zinc-100 bg-zinc-50">
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