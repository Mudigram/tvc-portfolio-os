import type { InstrumentTypeSummary, ExposureType } from '@/features/exposure/types'

interface InstrumentTypeSummaryTableProps {
  data: InstrumentTypeSummary[]
}

const INSTRUMENT_COLOURS: Record<ExposureType, string> = {
  'Equity':          'text-zinc-700 bg-zinc-100 border-zinc-200',
  'SAFE':            'text-blue-700 bg-blue-50 border-blue-200',
  'Convertible Note':'text-violet-700 bg-violet-50 border-violet-200',
  'Option':          'text-amber-700 bg-amber-50 border-amber-200',
  'Warrant':         'text-orange-700 bg-orange-50 border-orange-200',
  'Advisory Equity': 'text-zinc-500 bg-zinc-50 border-zinc-200',
}

function formatCurrency(n: number): string {
  if (n === 0) return '—'
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(n)
}

export function InstrumentTypeSummaryTable({ data }: InstrumentTypeSummaryTableProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-zinc-200/80 bg-white shadow-xs">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-100 bg-zinc-50/70">
              {['Instrument', 'Total invested', 'Companies', 'Instruments'].map((col, idx) => (
                <th
                  key={col}
                  className={`py-3.5 pr-6 text-left text-[11px] font-semibold text-zinc-400 uppercase tracking-wider whitespace-nowrap ${idx === 0 ? 'pl-5' : ''}`}
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {data.map((row) => (
              <tr key={row.exposure_type} className="hover:bg-zinc-50/60 transition-colors">
                <td className="py-3.5 pl-5 pr-6">
                  <span className={`
                    inline-flex items-center px-2 py-0.5 rounded-md border text-[10px] font-semibold tracking-wide uppercase
                    ${INSTRUMENT_COLOURS[row.exposure_type] ?? 'text-zinc-500 bg-zinc-50 border-zinc-200'}
                  `}>
                    {row.exposure_type}
                  </span>
                </td>
                <td className="py-3.5 pr-6 text-zinc-900 tabular-nums font-semibold font-mono text-sm">
                  {formatCurrency(row.total_invested)}
                </td>
                <td className="py-3.5 pr-6 text-zinc-600 tabular-nums font-mono text-xs">
                  {row.company_count}
                </td>
                <td className="py-3.5 pr-6 text-zinc-600 tabular-nums font-mono text-xs">
                  {row.row_count}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}