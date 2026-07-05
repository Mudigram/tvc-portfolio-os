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
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-zinc-100">
            {['Instrument', 'Total invested', 'Companies', 'Instruments'].map((col) => (
              <th
                key={col}
                className="pb-3 pr-8 text-left text-xs font-medium text-zinc-400 uppercase tracking-wide whitespace-nowrap"
              >
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-50">
          {data.map((row) => (
            <tr key={row.exposure_type}>
              <td className="py-3 pr-8">
                <span className={`
                  inline-flex items-center px-2 py-0.5 rounded border text-xs font-medium
                  ${INSTRUMENT_COLOURS[row.exposure_type] ?? 'text-zinc-500 bg-zinc-50 border-zinc-200'}
                `}>
                  {row.exposure_type}
                </span>
              </td>
              <td className="py-3 pr-8 text-zinc-900 tabular-nums font-medium">
                {formatCurrency(row.total_invested)}
              </td>
              <td className="py-3 pr-8 text-zinc-500 tabular-nums">
                {row.company_count}
              </td>
              <td className="py-3 pr-8 text-zinc-500 tabular-nums">
                {row.row_count}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}