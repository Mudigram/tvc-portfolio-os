'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import {
  MonitorPlay,
  Printer,
  Link2,
  Users2,
  LayoutTemplate,
  ChevronDown,
  Sparkles,
  Calendar,
} from 'lucide-react'
import type { HolderOption } from '@/features/exposure/services/holders.service'
import type { SnapshotMode, HolderSnapshotData, PortfolioShowcaseData } from '../types'
import PositionStatementCard from './PositionStatementCard'
import PortfolioShowcaseCard from './PortfolioShowcaseCard'

interface Props {
  holders: HolderOption[]
  initialMode: SnapshotMode
  initialHolderId?: string
  initialAsOf?: string
  holderSnapshot: HolderSnapshotData | null
  portfolioShowcase: PortfolioShowcaseData | null
}

export default function InvestorSnapshotView({
  holders,
  initialMode,
  initialHolderId,
  initialAsOf,
  holderSnapshot,
  portfolioShowcase,
}: Props) {
  const router = useRouter()
  const today = useMemo(() => new Date().toISOString().split('T')[0], [])

  // ── Draft state ──────────────────────────────────────────────────
  const [mode, setMode] = useState<SnapshotMode>(initialMode)
  const [holderId, setHolderId] = useState(initialHolderId ?? '')
  const [asOf, setAsOf] = useState(initialAsOf ?? today)
  const [customName, setCustomName] = useState('')
  const [copied, setCopied] = useState(false)

  // Sync draft state when server re-renders with new props
  useEffect(() => {
    setMode(initialMode)
    setHolderId(initialHolderId ?? '')
    setAsOf(initialAsOf ?? today)
  }, [initialMode, initialHolderId, initialAsOf, today])

  // Quick month presets (Current + past 6 month-ends)
  const monthOptions = useMemo(() => {
    const opts: { label: string; dateStr: string }[] = []
    const now = new Date()

    opts.push({
      label: 'Current Date',
      dateStr: now.toISOString().split('T')[0],
    })

    for (let i = 0; i < 6; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i + 1, 0)
      const label = d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
      const dateStr = d.toISOString().split('T')[0]
      opts.push({ label: `End of ${label}`, dateStr })
    }

    return opts
  }, [])

  // ── Navigation helper ─────────────────────────────────────────────
  const navigateWithParams = useCallback(
    (targetMode: SnapshotMode, targetHolderId: string, targetAsOf: string) => {
      const params = new URLSearchParams()
      params.set('mode', targetMode === 'portfolio_showcase' ? 'showcase' : 'statement')
      if (targetMode === 'position_statement' && targetHolderId) {
        params.set('holder_id', targetHolderId)
      }
      if (targetAsOf && targetAsOf !== today) {
        params.set('as_of', targetAsOf)
      }
      router.push(`/investor-snapshot?${params.toString()}`)
    },
    [today, router],
  )

  const handleModeChange = (newMode: SnapshotMode) => {
    setMode(newMode)
    navigateWithParams(newMode, holderId, asOf)
  }

  const handleHolderSelect = (newHolderId: string) => {
    setHolderId(newHolderId)
    if (newHolderId) {
      navigateWithParams('position_statement', newHolderId, asOf)
    }
  }

  const handleMonthPresetSelect = (newAsOf: string) => {
    setAsOf(newAsOf)
    if (newAsOf) {
      navigateWithParams(mode, holderId, newAsOf)
    }
  }

  const handleDateChange = (newAsOf: string) => {
    setAsOf(newAsOf)
    navigateWithParams(mode, holderId, newAsOf)
  }

  const handleGenerate = () => {
    navigateWithParams(mode, holderId, asOf)
  }

  const handlePrint = () => window.print()

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(window.location.href)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // ── Derived display state ────────────────────────────────────────
  const hasSnapshot =
    (initialMode === 'position_statement' && !!holderSnapshot) ||
    (initialMode === 'portfolio_showcase' && !!portfolioShowcase)

  const canGenerate =
    mode === 'portfolio_showcase' || (mode === 'position_statement' && !!holderId)

  return (
    <div className="space-y-8 max-w-[1600px] mx-auto py-2">

      {/* ── Print overrides ─────────────────────────────────────────── */}
      <style>{`
        @media print {
          body { background: white !important; color: black !important; }
          #snapshot-controls { display: none !important; }
          #snapshot-empty { display: none !important; }
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          @page { margin: 18mm 22mm; size: A4 portrait; }
        }
      `}</style>

      {/* ── Controls Bar & Page Header ───────────────────────────────── */}
      <div id="snapshot-controls" className="space-y-4">
        <div className="border-b border-zinc-100 pb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0">
                <MonitorPlay className="w-4.5 h-4.5 text-[#1a23bd]" />
              </div>
              <h1 className="text-xl font-semibold text-zinc-900 tracking-tight">
                Investor View & Position Snapshots
              </h1>
            </div>
            <p className="text-xs text-zinc-400 mt-1 uppercase tracking-wider font-medium">
              Presentation-ready position statements and portfolio showcases with monthly value aggregation
            </p>
          </div>

          {/* Action buttons — shown when snapshot exists */}
          {hasSnapshot && (
            <div className="flex items-center gap-2 shrink-0">
              <button
                id="investor-snapshot-copy-link"
                onClick={handleCopyLink}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-zinc-700 bg-white hover:bg-zinc-50 border border-zinc-200 transition-all shadow-2xs"
              >
                <Link2 className="w-3.5 h-3.5 text-zinc-500" />
                {copied ? 'Copied!' : 'Share Link'}
              </button>
              <button
                id="investor-snapshot-print"
                onClick={handlePrint}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold text-white bg-[#1a23bd] hover:bg-[#1520a8] transition-all shadow-xs"
              >
                <Printer className="w-3.5 h-3.5" />
                Print / Save PDF
              </button>
            </div>
          )}
        </div>

        {/* Interactive Controls Strip */}
        <div className="bg-zinc-50/80 p-3 rounded-xl border border-zinc-200/80 flex flex-wrap items-center gap-3">

          {/* Mode Toggle */}
          <div className="flex items-center rounded-lg bg-zinc-200/70 p-0.5 gap-0.5">
            <button
              id="mode-position-statement"
              onClick={() => handleModeChange('position_statement')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                mode === 'position_statement'
                  ? 'bg-white text-zinc-900 shadow-2xs border border-zinc-200/80'
                  : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              <Users2 className="w-3.5 h-3.5" />
              Position Statement
            </button>
            <button
              id="mode-portfolio-showcase"
              onClick={() => handleModeChange('portfolio_showcase')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                mode === 'portfolio_showcase'
                  ? 'bg-white text-zinc-900 shadow-2xs border border-zinc-200/80'
                  : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              <LayoutTemplate className="w-3.5 h-3.5" />
              Portfolio Showcase
            </button>
          </div>

          {/* Mode A: Holder picker */}
          {mode === 'position_statement' && (
            <div className="relative">
              <select
                id="investor-snapshot-holder-select"
                value={holderId}
                onChange={(e) => handleHolderSelect(e.target.value)}
                className="appearance-none pl-3 pr-8 py-1.5 rounded-lg bg-white border border-zinc-200 text-xs font-semibold text-zinc-900 focus:outline-none focus:ring-2 focus:ring-[#1a23bd] transition-all cursor-pointer min-w-[220px]"
              >
                <option value="" className="text-zinc-400 bg-white">
                  Select investor ({holders.length} available)…
                </option>
                {holders.map((h) => (
                  <option key={h.id} value={h.id} className="text-zinc-900 bg-white py-1">
                    {h.name} {h.holder_type ? `(${h.holder_type})` : ''}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400 pointer-events-none" />
            </div>
          )}

          {/* Mode B: Custom recipient name */}
          {mode === 'portfolio_showcase' && (
            <input
              id="investor-snapshot-recipient-name"
              type="text"
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              placeholder="Recipient name (optional)"
              className="px-3 py-1.5 rounded-lg bg-white border border-zinc-200 text-xs text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#1a23bd] transition-all w-52"
            />
          )}

          {/* Month Presets Dropdown */}
          <div className="relative">
            <select
              id="investor-snapshot-month-preset"
              value={monthOptions.some((o) => o.dateStr === asOf) ? asOf : ''}
              onChange={(e) => handleMonthPresetSelect(e.target.value)}
              className="appearance-none pl-8 pr-8 py-1.5 rounded-lg bg-white border border-zinc-200 text-xs font-medium text-zinc-900 focus:outline-none focus:ring-2 focus:ring-[#1a23bd] transition-all cursor-pointer"
            >
              <option value="" className="text-zinc-400 bg-white">Month Presets…</option>
              {monthOptions.map((opt) => (
                <option key={opt.dateStr} value={opt.dateStr} className="text-zinc-900 bg-white">
                  {opt.label} ({opt.dateStr})
                </option>
              ))}
            </select>
            <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400 pointer-events-none" />
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400 pointer-events-none" />
          </div>

          {/* Custom Exact Date picker */}
          <div className="flex items-center gap-1.5 bg-white border border-zinc-200 px-2.5 py-1 rounded-lg">
            <span className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider">Date:</span>
            <input
              id="investor-snapshot-as-of-date"
              type="date"
              value={asOf}
              max={today}
              onChange={(e) => handleDateChange(e.target.value)}
              className="text-xs text-zinc-900 bg-transparent focus:outline-none cursor-pointer font-medium"
            />
          </div>

          {/* Refresh / Generate Button */}
          <button
            id="investor-snapshot-generate"
            onClick={handleGenerate}
            disabled={!canGenerate}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold text-white bg-[#1a23bd] hover:bg-[#1520a8] disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-xs ml-auto"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Generate Snapshot
          </button>
        </div>
      </div>

      {/* ── Snapshot Content ─────────────────────────────────────────── */}
      <div>

        {/* Empty state */}
        {!hasSnapshot && (
          <div id="snapshot-empty" className="flex flex-col items-center justify-center py-28 text-center bg-white border border-zinc-200/80 rounded-xl shadow-2xs">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center mb-4">
              <MonitorPlay className="w-6 h-6 text-[#1a23bd]" />
            </div>
            <h2 className="text-base font-semibold text-zinc-900 mb-1">
              Select an investor to view snapshot
            </h2>
            <p className="text-xs text-zinc-500 max-w-sm leading-relaxed mb-4">
              {mode === 'position_statement'
                ? `Choose from ${holders.length} investors in the dropdown above to load their position statement.`
                : 'Select a month or date and click Generate Snapshot to view the full portfolio showcase.'}
            </p>
            {mode === 'position_statement' && holders.length > 0 && (
              <div className="flex flex-wrap items-center justify-center gap-2 max-w-lg">
                {holders.slice(0, 5).map((h) => (
                  <button
                    key={h.id}
                    onClick={() => handleHolderSelect(h.id)}
                    className="px-3 py-1 rounded-full text-xs font-medium bg-blue-50 text-[#1a23bd] border border-blue-100 hover:bg-blue-100 transition-colors"
                  >
                    {h.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Mode A: Position Statement */}
        {initialMode === 'position_statement' && holderSnapshot && (
          <div id="snapshot-content">
            <PositionStatementCard data={holderSnapshot} />
          </div>
        )}

        {/* Mode B: Portfolio Showcase */}
        {initialMode === 'portfolio_showcase' && portfolioShowcase && (
          <div id="snapshot-content">
            <PortfolioShowcaseCard data={portfolioShowcase} recipientName={customName} />
          </div>
        )}
      </div>
    </div>
  )
}
