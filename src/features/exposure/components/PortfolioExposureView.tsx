'use client'

import { useRouter, usePathname } from 'next/navigation'
import { Calendar, RotateCcw } from 'lucide-react'
import { PortfolioSummaryBar } from '@/features/exposure/components/PortfolioSummaryBar'
import { ExposureByCompanyTable } from '@/features/exposure/components/ExposureByCompanyTable'
import { InstrumentTypeSummaryTable } from '@/features/exposure/components/InstrumentTypeSummaryTable'
import { ExposureStackedBarChart } from '@/features/exposure/components/ExposureStackedBarChart'
import type { PortfolioExposureData } from '@/features/exposure/types'

interface PortfolioExposureViewProps {
  data: PortfolioExposureData
  asOfDate?: string
}

export function PortfolioExposureView({ data, asOfDate }: PortfolioExposureViewProps) {
  const router = useRouter()
  const pathname = usePathname()

  function handleDateChange(dateStr: string) {
    if (!dateStr) {
      router.push(pathname)
    } else {
      router.push(`${pathname}?as_of=${encodeURIComponent(dateStr)}`)
    }
  }

  function handleReset() {
    router.push(pathname)
  }

  return (
    <div className="space-y-14 max-w-[1600px] mx-auto py-2">

      {/* Main Section Header */}
      <div className="border-b border-zinc-100 pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-semibold text-zinc-900 tracking-tight">
              Consolidated Economic Exposure
            </h1>
            {asOfDate && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                Historical View: As of {new Date(asOfDate).toLocaleDateString('en-GB')}
              </span>
            )}
          </div>
          <p className="text-xs text-zinc-400 mt-1 uppercase tracking-wider font-medium">
            {asOfDate
              ? `Point-in-Time Position View (As of ${new Date(asOfDate).toLocaleDateString('en-GB')}) — Reconstructing active instruments & pre-conversion positions as of date`
              : 'Active Positions Only — Converted, Terminated, or Exited Instruments Excluded'}
          </p>
        </div>

        {/* Point-in-time Date Picker Control */}
        <div className="flex items-center gap-2 bg-zinc-50 p-2 rounded-lg border border-zinc-200/80 shrink-0">
          <Calendar className="w-4 h-4 text-zinc-400 ml-1 shrink-0" />
          <span className="text-xs font-medium text-zinc-600 shrink-0">As of Date:</span>
          <input
            type="date"
            value={asOfDate ?? ''}
            onChange={(e) => handleDateChange(e.target.value)}
            className="h-8 px-2.5 text-xs text-zinc-900 bg-white border border-zinc-200 rounded-md focus:outline-none focus:ring-2 focus:ring-[#1a23bd]"
          />
          {asOfDate && (
            <button
              onClick={handleReset}
              className="h-8 px-2.5 text-xs font-medium text-zinc-600 bg-white border border-zinc-200 rounded-md hover:bg-zinc-100 transition-colors inline-flex items-center gap-1"
              title="Reset to current state"
            >
              <RotateCcw className="w-3 h-3" />
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Consolidated Capital Ledger Strip */}
      <div className="pb-4 border-b border-zinc-100">
        <PortfolioSummaryBar {...data.summary} />
      </div>

      {/* Breakdown Segment: By Company Asset */}
      <section className="space-y-4">
        <div className="flex items-center justify-between border-b border-zinc-100/80 pb-3">
          <div className="flex items-baseline gap-2.5">
            <h2 className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
              Asset Exposure Matrix
            </h2>
            <span className="text-xs font-mono font-bold text-[#1a23bd] bg-blue-50/60 px-1.5 py-0.2 rounded border border-blue-100/50">
              {data.byCompany.length} Assets Tracked
            </span>
          </div>
          <span className="text-xs text-zinc-400 font-medium hidden sm:inline">
            Reflecting combined TD, TVCLabs, and Angels@TVCLabs positions
          </span>
        </div>
        <p className="text-xs text-zinc-400 max-w-3xl leading-relaxed">
          The table below displays positions belonging strictly to our immediate internal ecosystem. 
          Co-investors, external syndicates, and unmanaged tranches can be reviewed inside each asset&apos;s standalone cap table view.
        </p>
        <div className="pt-2">
          <ExposureByCompanyTable companies={data.byCompany} />
        </div>
      </section>

      {/* Breakdown Segment: Structural Distribution */}
      <section className="space-y-6 pt-2">
        <div className="border-b border-zinc-100 pb-3">
          <h2 className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
            Allocation Dynamics & Instrument Breakdown
          </h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">

          {/* Allocation Column: Stacked Bar Chart */}
          <div className="space-y-4 lg:col-span-5 min-w-0">
            <div className="space-y-1">
              <h3 className="text-xs font-semibold text-zinc-800">Deployment Concentration</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Visualizing capital allocations across active portfolio companies, color-segmented by their respective funding instrument types.
              </p>
            </div>
            <div className="pt-2">
              <ExposureStackedBarChart data={data.chartData} />
            </div>
          </div>

          {/* Allocation Column: Summary Ledger Table */}
          <div className="space-y-4 lg:col-span-5">
            <div className="space-y-1">
              <h3 className="text-xs font-semibold text-zinc-800">Aggregate Class Balance</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Consolidated capital and row instance summary tracking asset deployment types across the ecosystem.
              </p>
            </div>
            <div className="pt-2">
              <InstrumentTypeSummaryTable data={data.byInstrument} />
            </div>
          </div>

        </div>
      </section>

    </div>
  )
}