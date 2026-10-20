'use client'

import Link from 'next/link'
import type { CompanyExposureSummary, ExposureType } from '@/features/exposure/types'

interface ExposureByCompanyTableProps {
  companies: CompanyExposureSummary[]
}

const HEALTH_STYLES: Record<string, string> = {
  Green: 'text-emerald-700 bg-emerald-50 border-emerald-200',
  Amber: 'text-amber-700 bg-amber-50 border-amber-200',
  Red:   'text-red-700 bg-red-50 border-red-200',
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

function formatPct(n: number): string {
  if (n === 0) return '—'
  return `${n.toFixed(2)}%`
}

export function ExposureByCompanyTable({ companies }: ExposureByCompanyTableProps) {
  if (companies.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="text-sm font-medium text-zinc-900">No exposure data</p>
        <p className="text-sm text-zinc-400 mt-1">
          Add economic exposure records to see portfolio positions.
        </p>
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-xl border border-zinc-200/80 bg-white shadow-xs">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-100 bg-zinc-50/70">
              {[
                'Company',
                'Stage · Sector',
                'TVC Invested',
                'TVC Ownership',
                'Instruments',
                'Raising',
                '',
              ].map((col, idx) => (
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
            {companies.map((co) => (
              <tr key={co.company_id} className="group hover:bg-zinc-50/60 transition-colors">

                {/* Company name + health */}
                <td className="py-4 pl-5 pr-6 border-l-2 border-transparent group-hover:border-[#1a23bd] transition-colors">
                  <div className="flex items-center gap-2.5">
                    <span className={`
                      inline-flex items-center px-2 py-0.5 rounded-md border text-[11px] font-semibold shrink-0
                      ${co.portfolio_health
                        ? HEALTH_STYLES[co.portfolio_health]
                        : 'text-zinc-400 bg-zinc-50 border-zinc-200'
                      }
                    `}>
                      {co.portfolio_health ?? '—'}
                    </span>
                    <span className="font-semibold text-zinc-900 group-hover:text-primary transition-colors">{co.company_name}</span>
                  </div>
                </td>

                {/* Stage · Sector */}
                <td className="py-4 pr-6 text-zinc-500 text-xs whitespace-nowrap">
                  {[co.stage, co.sector].filter(Boolean).join(' · ') || '—'}
                </td>

                {/* TVC invested */}
                <td className="py-4 pr-6 text-zinc-900 tabular-nums font-semibold font-mono text-sm">
                  {formatCurrency(co.tvclabs_invested)}
                </td>

                {/* TVC ownership */}
                <td className="py-4 pr-6 text-zinc-700 tabular-nums font-mono text-sm">
                  {formatPct(co.tvclabs_ownership_pct)}
                </td>

                {/* Instrument type pills */}
                <td className="py-4 pr-6">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {co.instrument_types.length === 0 ? (
                      <span className="text-zinc-400 text-xs">—</span>
                    ) : (
                      co.instrument_types.map((type) => (
                        <span
                          key={type}
                          className={`
                            inline-flex items-center px-2 py-0.5 rounded-md border text-[10px] font-semibold tracking-wide uppercase
                            ${INSTRUMENT_COLOURS[type] ?? 'text-zinc-500 bg-zinc-50 border-zinc-200'}
                          `}
                        >
                          {type}
                        </span>
                      ))
                    )}
                  </div>
                </td>

                {/* Raising flag */}
                <td className="py-4 pr-6">
                  {co.is_actively_raising ? (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-md border text-[10px] font-semibold text-amber-700 bg-amber-50 border-amber-200">
                      Raising
                    </span>
                  ) : (
                    <span className="text-xs text-zinc-400">—</span>
                  )}
                </td>

                {/* Link to cap table */}
                <td className="py-4 pr-5 text-right">
                  <Link
                    href={`/companies/${co.company_id}?tab=cap-table`}
                    className="text-xs font-semibold text-primary hover:underline underline-offset-2 transition-colors whitespace-nowrap"
                  >
                    Cap table →
                  </Link>
                </td>

              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}