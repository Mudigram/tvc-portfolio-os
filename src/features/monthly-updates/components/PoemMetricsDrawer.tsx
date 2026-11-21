'use client'

import { useState, useEffect, useTransition, useRef, useMemo } from 'react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Spinner } from '@/components/ui/spinner'
import {
  Upload,
  Download,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  TrendingUp,
  Users,
  DollarSign,
  Flag,
  Sparkles,
  History,
  Copy,
  RotateCcw,
} from 'lucide-react'
import {
  parsePoemCsv,
  generatePoemCsvTemplate,
} from '../utils/csvParser'
import {
  upsertPoemMetricsAction,
  getLatestCompanyUpdateAction,
  type UpsertPoemMetricsInput,
} from '../actions/upsertPoemMetrics.action'
import type { MonthlyUpdate, PoemMetrics } from '../types'

interface PoemMetricsDrawerProps {
  companyId: string
  companyName?: string
  isOpen: boolean
  onClose: () => void
  initialUpdate?: MonthlyUpdate | null
  existingUpdates?: MonthlyUpdate[]
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

const EMPTY_METRICS: PoemMetrics = {
  active_customers: null,
  monthly_user_growth_pct: null,
  paying_customers: null,
  churn_rate_pct: null,
  retention_rate_pct: null,
  revenue_growth_pct: null,
  team_size: null,
  founder_commitment: 'Full-time',
  reporting_consistency: 'High',
  reporting_compliance: 'Compliant',
  monthly_revenue: null,
  burn_rate: null,
  runway_months: null,
  ltv_cac_ratio: null,
  operating_margin_pct: null,
  arr: null,
  gross_margin_pct: null,
  targets_completion_rate_pct: null,
}

function extractMetricsFromUpdate(u?: MonthlyUpdate | null): PoemMetrics {
  if (!u) return { ...EMPTY_METRICS }
  return {
    active_customers: u.active_customers ?? null,
    monthly_user_growth_pct: u.monthly_user_growth_pct ?? null,
    paying_customers: u.paying_customers ?? null,
    churn_rate_pct: u.churn_rate_pct ?? null,
    retention_rate_pct: u.retention_rate_pct ?? null,
    revenue_growth_pct: u.revenue_growth_pct ?? null,
    team_size: u.team_size ?? null,
    founder_commitment: u.founder_commitment ?? 'Full-time',
    reporting_consistency: u.reporting_consistency ?? 'High',
    reporting_compliance: u.reporting_compliance ?? 'Compliant',
    monthly_revenue: u.monthly_revenue ?? null,
    burn_rate: u.burn_rate ?? null,
    runway_months: u.runway_months ?? null,
    ltv_cac_ratio: u.ltv_cac_ratio ?? null,
    operating_margin_pct: u.operating_margin_pct ?? null,
    arr: u.arr ?? null,
    gross_margin_pct: u.gross_margin_pct ?? null,
    targets_completion_rate_pct: u.targets_completion_rate_pct ?? null,
  }
}

export function PoemMetricsDrawer({
  companyId,
  companyName = 'Company',
  isOpen,
  onClose,
  initialUpdate,
  existingUpdates = [],
}: PoemMetricsDrawerProps) {
  const [isPending, startTransition] = useTransition()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const now = new Date()
  const [month, setMonth] = useState<number>(initialUpdate?.month ?? now.getMonth() + 1)
  const [year, setYear] = useState<number>(initialUpdate?.year ?? now.getFullYear())

  // Narrative fields
  const [achievements, setAchievements] = useState(initialUpdate?.achievements ?? '')
  const [challenges, setChallenges] = useState(initialUpdate?.challenges ?? '')
  const [targets, setTargets] = useState(initialUpdate?.targets ?? '')

  // POEM Form state
  const [metrics, setMetrics] = useState<PoemMetrics>(() => extractMetricsFromUpdate(initialUpdate))

  // Prefill tracking
  const [prefilledFrom, setPrefilledFrom] = useState<string | null>(null)
  const [availableUpdates, setAvailableUpdates] = useState<MonthlyUpdate[]>(existingUpdates)
  const [isAutoFetching, setIsAutoFetching] = useState<boolean>(false)

  const [csvStatus, setCsvStatus] = useState<{
    type: 'success' | 'error'
    message: string
  } | null>(null)
  const [saveStatus, setSaveStatus] = useState<{
    type: 'success' | 'error'
    message: string
  } | null>(null)

  // Keep available updates synced with props
  useEffect(() => {
    if (existingUpdates.length > 0) {
      setAvailableUpdates(existingUpdates)
    }
  }, [existingUpdates])

  // Lifecycle & Auto-fetch initialization when drawer opens
  useEffect(() => {
    if (!isOpen) return

    setCsvStatus(null)
    setSaveStatus(null)

    if (initialUpdate) {
      // Direct edit mode: populate existing update data
      setMonth(initialUpdate.month)
      setYear(initialUpdate.year)
      setAchievements(initialUpdate.achievements ?? '')
      setChallenges(initialUpdate.challenges ?? '')
      setTargets(initialUpdate.targets ?? '')
      setMetrics(extractMetricsFromUpdate(initialUpdate))
      setPrefilledFrom(null)
      return
    }

    // New update mode: determine previous monthly data
    async function initializeNewUpdate() {
      let candidateUpdates = existingUpdates.length > 0 ? existingUpdates : availableUpdates

      // If no updates in memory, auto-fetch the latest from server
      if (candidateUpdates.length === 0 && companyId) {
        setIsAutoFetching(true)
        const res = await getLatestCompanyUpdateAction(companyId)
        setIsAutoFetching(false)
        if (res.success && res.update) {
          candidateUpdates = [res.update]
          setAvailableUpdates([res.update])
        }
      }

      if (candidateUpdates.length > 0) {
        // Sort descending to find the most recent
        const sorted = [...candidateUpdates].sort((a, b) => {
          if (b.year !== a.year) return b.year - a.year
          return b.month - a.month
        })
        const latest = sorted[0]

        // Advance to next month automatically
        const nextMonth = latest.month === 12 ? 1 : latest.month + 1
        const nextYear = latest.month === 12 ? latest.year + 1 : latest.year

        setMonth(nextMonth)
        setYear(nextYear)

        // Auto-fill recurring metrics from the previous month
        setMetrics(extractMetricsFromUpdate(latest))
        setAchievements('')
        setChallenges('')
        setTargets(latest.targets ?? '')
        setPrefilledFrom(`${MONTHS[latest.month - 1]} ${latest.year}`)
      } else {
        // First ever update for this company
        setMonth(now.getMonth() + 1)
        setYear(now.getFullYear())
        setAchievements('')
        setChallenges('')
        setTargets('')
        setMetrics({ ...EMPTY_METRICS })
        setPrefilledFrom(null)
      }
    }

    initializeNewUpdate()
  }, [isOpen, initialUpdate, companyId])

  // Check if current selected period already has a saved update
  const existingForSelectedPeriod = useMemo(() => {
    return availableUpdates.find(u => u.month === month && u.year === year) || null
  }, [availableUpdates, month, year])

  function updateMetric<K extends keyof PoemMetrics>(key: K, value: PoemMetrics[K]) {
    setMetrics((prev) => ({ ...prev, [key]: value }))
  }

  // Applies metrics from a specific historical update
  function applyHistoricalUpdate(u: MonthlyUpdate, includeNarratives: boolean = false) {
    setMetrics(extractMetricsFromUpdate(u))
    if (includeNarratives) {
      if (u.achievements) setAchievements(u.achievements)
      if (u.challenges) setChallenges(u.challenges)
      if (u.targets) setTargets(u.targets)
    } else if (u.targets) {
      // Carry forward targets as default goals for this month
      setTargets(u.targets)
    }
    setPrefilledFrom(`${MONTHS[u.month - 1]} ${u.year}`)
  }

  // Clear all metrics back to blank
  function handleClearAllMetrics() {
    setMetrics({ ...EMPTY_METRICS })
    setAchievements('')
    setChallenges('')
    setTargets('')
    setPrefilledFrom(null)
  }

  // Handle CSV Download
  function handleDownloadTemplate() {
    const csvContent = generatePoemCsvTemplate(companyName)
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `${companyName.toLowerCase().replace(/\s+/g, '_')}_poem_template.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Handle CSV File Upload
  function handleCsvFile(file: File) {
    setCsvStatus(null)
    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target?.result as string
      if (!text) {
        setCsvStatus({ type: 'error', message: 'Unable to read CSV file.' })
        return
      }

      const parsed = parsePoemCsv(text)
      if (!parsed.success) {
        setCsvStatus({ type: 'error', message: parsed.error || 'Failed to parse CSV.' })
        return
      }

      if (parsed.month) setMonth(parsed.month)
      if (parsed.year) setYear(parsed.year)
      if (parsed.achievements) setAchievements(parsed.achievements)
      if (parsed.challenges) setChallenges(parsed.challenges)
      if (parsed.targets) setTargets(parsed.targets)

      if (parsed.metrics) {
        setMetrics((prev) => ({
          ...prev,
          ...parsed.metrics,
        }))
      }

      setPrefilledFrom(null)
      setCsvStatus({
        type: 'success',
        message: `Successfully imported CSV for ${parsed.month ? MONTHS[parsed.month - 1] : ''} ${parsed.year || ''}!`,
      })
    }
    reader.readAsText(file)
  }

  // Handle Save
  function handleSave() {
    setSaveStatus(null)
    startTransition(async () => {
      const payload: UpsertPoemMetricsInput = {
        company_id: companyId,
        month,
        year,
        achievements,
        challenges,
        targets,
        ...metrics,
      }

      const res = await upsertPoemMetricsAction(payload)
      if (res.success) {
        setSaveStatus({
          type: 'success',
          message: res.migrationNeeded
            ? 'Metrics saved! (Note: Applied via fallback mode; run the database migration to persist dedicated columns)'
            : 'POEM Metrics successfully saved and verified!',
        })
        setTimeout(() => {
          onClose()
        }, 1500)
      } else {
        setSaveStatus({
          type: 'error',
          message: res.error || 'Failed to save POEM metrics.',
        })
      }
    })
  }

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        side="right"
        className="sm:max-w-xl w-full p-0 flex flex-col bg-white overflow-hidden"
      >
        {/* Header */}
        <SheetHeader className="p-6 border-b border-zinc-100 bg-zinc-50/70">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#1a23bd] uppercase tracking-wider">
              Portfolio Intelligence
            </span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-zinc-100 text-zinc-700">
              {companyName}
            </span>
          </div>
          <SheetTitle className="text-xl font-bold text-zinc-900 mt-1">
            POEM Performance Metrics
          </SheetTitle>
          <SheetDescription className="text-xs text-zinc-500">
            Record, update, or import monthly KPIs across Proposition, Organization, Economics, and Milestones.
          </SheetDescription>
        </SheetHeader>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* CSV Import / Dropzone Strip */}
          <div className="p-4 rounded-xl border border-zinc-200/90 bg-zinc-50/50 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                <h4 className="text-xs font-bold text-zinc-800 uppercase tracking-wide">
                  CSV / Spreadsheet Import
                </h4>
              </div>
              <button
                type="button"
                onClick={handleDownloadTemplate}
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#1a23bd] hover:underline cursor-pointer"
              >
                <Download className="w-3 h-3" />
                Download Template
              </button>
            </div>

            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault()
                const file = e.dataTransfer.files?.[0]
                if (file) handleCsvFile(file)
              }}
              className="border border-dashed border-zinc-300 hover:border-zinc-400 bg-white rounded-lg p-3 text-center cursor-pointer transition-colors"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) handleCsvFile(file)
                }}
              />
              <div className="flex items-center justify-center gap-2 text-xs text-zinc-600">
                <Upload className="w-3.5 h-3.5 text-zinc-500" />
                <span>
                  Drop completed <strong className="font-semibold text-zinc-800">.csv</strong> here or click to browse
                </span>
              </div>
            </div>

            {csvStatus && (
              <div
                className={`p-2.5 rounded-lg text-xs flex items-center gap-2 ${
                  csvStatus.type === 'success'
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'bg-red-50 text-red-800 border border-red-200'
                }`}
              >
                {csvStatus.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                )}
                <span>{csvStatus.message}</span>
              </div>
            )}
          </div>

          {/* ── Auto-Fetch & Previous Month Intelligence Banner ────── */}
          {prefilledFrom && (
            <div className="p-3.5 rounded-xl border border-indigo-100 bg-indigo-50/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#1a23bd] shrink-0" />
                <div className="text-xs">
                  <span className="font-semibold text-zinc-900">Pre-filled from previous update: </span>
                  <span className="font-bold text-[#1a23bd]">{prefilledFrom}</span>
                  <p className="text-[11px] text-zinc-500 mt-0.5">
                    Operational KPIs copied forward. Adjust changed metrics below.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                <button
                  type="button"
                  onClick={handleClearAllMetrics}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-zinc-600 hover:text-zinc-900 px-2 py-1 rounded bg-white/80 border border-zinc-200/80 shadow-2xs hover:bg-white transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3 text-zinc-500" />
                  Clear all
                </button>
              </div>
            </div>
          )}

          {/* Existing update notice if selecting a month that already has saved data */}
          {existingForSelectedPeriod && existingForSelectedPeriod.id !== initialUpdate?.id && (
            <div className="p-3 rounded-xl border border-amber-200 bg-amber-50 text-amber-900 text-xs flex items-center justify-between">
              <div>
                <span className="font-semibold">Update already exists</span> for {MONTHS[month - 1]} {year}.
              </div>
              <button
                type="button"
                onClick={() => applyHistoricalUpdate(existingForSelectedPeriod, true)}
                className="font-bold text-amber-950 underline hover:no-underline text-xs cursor-pointer"
              >
                Load saved update
              </button>
            </div>
          )}

          {/* Reporting Period & Historical Copy Selector */}
          <div className="p-4 rounded-xl border border-zinc-200 bg-white shadow-2xs space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-wide">
                  Reporting Month
                </label>
                <select
                  value={month}
                  onChange={(e) => setMonth(Number(e.target.value))}
                  className="mt-1 w-full h-9 rounded-md border border-zinc-200 bg-white px-3 text-xs font-semibold text-zinc-800 focus:outline-none focus:ring-1 focus:ring-zinc-400"
                >
                  {MONTHS.map((m, idx) => (
                    <option key={m} value={idx + 1}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-wide">
                  Year
                </label>
                <input
                  type="number"
                  value={year}
                  onChange={(e) => setYear(Number(e.target.value))}
                  className="mt-1 w-full h-9 rounded-md border border-zinc-200 bg-white px-3 text-xs font-semibold text-zinc-800 focus:outline-none focus:ring-1 focus:ring-zinc-400"
                />
              </div>
            </div>

            {/* Quick Historical Copy Picker */}
            {availableUpdates.length > 0 && (
              <div className="pt-2 border-t border-zinc-100 flex items-center justify-between text-xs text-zinc-600 gap-2">
                <span className="text-[11px] font-medium text-zinc-500 flex items-center gap-1.5 shrink-0">
                  <History className="w-3.5 h-3.5 text-zinc-400" />
                  Copy from another month:
                </span>
                <select
                  onChange={(e) => {
                    const sel = availableUpdates.find((u) => u.id === e.target.value)
                    if (sel) applyHistoricalUpdate(sel)
                  }}
                  defaultValue=""
                  className="h-7 text-xs rounded border border-zinc-200 bg-white px-2 text-zinc-700 max-w-[190px]"
                >
                  <option value="" disabled>
                    Choose previous month...
                  </option>
                  {availableUpdates.map((u) => (
                    <option key={u.id} value={u.id}>
                      {MONTHS[u.month - 1]} {u.year}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* ── 1. PROPOSITION ────────────────────────────────────── */}
          <div className="border border-blue-100 rounded-xl bg-blue-50/20 p-4 space-y-3">
            <div className="flex items-center gap-2 border-b border-blue-100 pb-2">
              <TrendingUp className="w-4 h-4 text-blue-600" />
              <h3 className="text-xs font-bold text-blue-900 uppercase tracking-wide">
                1. Proposition &amp; Market Traction
              </h3>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <label className="text-[11px] font-medium text-zinc-600">Active Customers</label>
                <Input
                  type="number"
                  placeholder="e.g. 1450"
                  value={metrics.active_customers ?? ''}
                  onChange={(e) => updateMetric('active_customers', e.target.value ? Number(e.target.value) : null)}
                  className="h-8 text-xs bg-white tabular-nums"
                />
              </div>
              <div>
                <label className="text-[11px] font-medium text-zinc-600">Paying Customers</label>
                <Input
                  type="number"
                  placeholder="e.g. 320"
                  value={metrics.paying_customers ?? ''}
                  onChange={(e) => updateMetric('paying_customers', e.target.value ? Number(e.target.value) : null)}
                  className="h-8 text-xs bg-white tabular-nums"
                />
              </div>
              <div>
                <label className="text-[11px] font-medium text-zinc-600">Monthly User Growth (%)</label>
                <Input
                  type="number"
                  step="0.1"
                  placeholder="e.g. 18.5"
                  value={metrics.monthly_user_growth_pct ?? ''}
                  onChange={(e) => updateMetric('monthly_user_growth_pct', e.target.value ? Number(e.target.value) : null)}
                  className="h-8 text-xs bg-white tabular-nums"
                />
              </div>
              <div>
                <label className="text-[11px] font-medium text-zinc-600">Revenue Growth (%)</label>
                <Input
                  type="number"
                  step="0.1"
                  placeholder="e.g. 21.0"
                  value={metrics.revenue_growth_pct ?? ''}
                  onChange={(e) => updateMetric('revenue_growth_pct', e.target.value ? Number(e.target.value) : null)}
                  className="h-8 text-xs bg-white tabular-nums"
                />
              </div>
              <div>
                <label className="text-[11px] font-medium text-zinc-600">Churn Rate (%)</label>
                <Input
                  type="number"
                  step="0.1"
                  placeholder="e.g. 2.4"
                  value={metrics.churn_rate_pct ?? ''}
                  onChange={(e) => updateMetric('churn_rate_pct', e.target.value ? Number(e.target.value) : null)}
                  className="h-8 text-xs bg-white tabular-nums"
                />
              </div>
              <div>
                <label className="text-[11px] font-medium text-zinc-600">Retention Rate (%)</label>
                <Input
                  type="number"
                  step="0.1"
                  placeholder="e.g. 94.2"
                  value={metrics.retention_rate_pct ?? ''}
                  onChange={(e) => updateMetric('retention_rate_pct', e.target.value ? Number(e.target.value) : null)}
                  className="h-8 text-xs bg-white tabular-nums"
                />
              </div>
            </div>
          </div>

          {/* ── 2. ORGANIZATION ───────────────────────────────────── */}
          <div className="border border-indigo-100 rounded-xl bg-indigo-50/20 p-4 space-y-3">
            <div className="flex items-center gap-2 border-b border-indigo-100 pb-2">
              <Users className="w-4 h-4 text-indigo-600" />
              <h3 className="text-xs font-bold text-indigo-900 uppercase tracking-wide">
                2. Organization &amp; Governance
              </h3>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <label className="text-[11px] font-medium text-zinc-600">Team Size (Headcount)</label>
                <Input
                  type="number"
                  placeholder="e.g. 14"
                  value={metrics.team_size ?? ''}
                  onChange={(e) => updateMetric('team_size', e.target.value ? Number(e.target.value) : null)}
                  className="h-8 text-xs bg-white tabular-nums"
                />
              </div>
              <div>
                <label className="text-[11px] font-medium text-zinc-600">Founder Commitment</label>
                <select
                  value={metrics.founder_commitment || 'Full-time'}
                  onChange={(e) => updateMetric('founder_commitment', e.target.value)}
                  className="w-full h-8 rounded-md border border-zinc-200 bg-white px-2 text-xs font-medium text-zinc-800 focus:outline-none"
                >
                  <option value="Full-time">Full-time</option>
                  <option value="Part-time">Part-time</option>
                  <option value="Transitioning">Transitioning</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className="text-[11px] font-medium text-zinc-600">Reporting Consistency</label>
                <select
                  value={metrics.reporting_consistency || 'High'}
                  onChange={(e) => updateMetric('reporting_consistency', e.target.value)}
                  className="w-full h-8 rounded-md border border-zinc-200 bg-white px-2 text-xs font-medium text-zinc-800 focus:outline-none"
                >
                  <option value="High">High (Regular)</option>
                  <option value="Medium">Medium (Occasional gaps)</option>
                  <option value="Low">Low (Infrequent)</option>
                </select>
              </div>
              <div>
                <label className="text-[11px] font-medium text-zinc-600">Reporting Compliance</label>
                <select
                  value={metrics.reporting_compliance || 'Compliant'}
                  onChange={(e) => updateMetric('reporting_compliance', e.target.value)}
                  className="w-full h-8 rounded-md border border-zinc-200 bg-white px-2 text-xs font-medium text-zinc-800 focus:outline-none"
                >
                  <option value="Compliant">Compliant</option>
                  <option value="Needs Review">Needs Review</option>
                  <option value="Non-Compliant">Non-Compliant</option>
                </select>
              </div>
            </div>
          </div>

          {/* ── 3. ECONOMICS ──────────────────────────────────────── */}
          <div className="border border-emerald-100 rounded-xl bg-emerald-50/20 p-4 space-y-3">
            <div className="flex items-center gap-2 border-b border-emerald-100 pb-2">
              <DollarSign className="w-4 h-4 text-emerald-600" />
              <h3 className="text-xs font-bold text-emerald-900 uppercase tracking-wide">
                3. Financial &amp; Unit Economics
              </h3>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <label className="text-[11px] font-medium text-zinc-600">Monthly Revenue ($)</label>
                <Input
                  type="number"
                  placeholder="e.g. 65000"
                  value={metrics.monthly_revenue ?? ''}
                  onChange={(e) => updateMetric('monthly_revenue', e.target.value ? Number(e.target.value) : null)}
                  className="h-8 text-xs bg-white tabular-nums"
                />
              </div>
              <div>
                <label className="text-[11px] font-medium text-zinc-600">ARR ($)</label>
                <Input
                  type="number"
                  placeholder="e.g. 780000"
                  value={metrics.arr ?? ''}
                  onChange={(e) => updateMetric('arr', e.target.value ? Number(e.target.value) : null)}
                  className="h-8 text-xs bg-white tabular-nums"
                />
              </div>
              <div>
                <label className="text-[11px] font-medium text-zinc-600">Gross Margin (%)</label>
                <Input
                  type="number"
                  step="0.1"
                  placeholder="e.g. 74.0"
                  value={metrics.gross_margin_pct ?? ''}
                  onChange={(e) => updateMetric('gross_margin_pct', e.target.value ? Number(e.target.value) : null)}
                  className="h-8 text-xs bg-white tabular-nums"
                />
              </div>
              <div>
                <label className="text-[11px] font-medium text-zinc-600">Operating Margin (%)</label>
                <Input
                  type="number"
                  step="0.1"
                  placeholder="e.g. 22.5"
                  value={metrics.operating_margin_pct ?? ''}
                  onChange={(e) => updateMetric('operating_margin_pct', e.target.value ? Number(e.target.value) : null)}
                  className="h-8 text-xs bg-white tabular-nums"
                />
              </div>
              <div>
                <label className="text-[11px] font-medium text-zinc-600">Burn Rate ($/mo)</label>
                <Input
                  type="number"
                  placeholder="e.g. 28000"
                  value={metrics.burn_rate ?? ''}
                  onChange={(e) => updateMetric('burn_rate', e.target.value ? Number(e.target.value) : null)}
                  className="h-8 text-xs bg-white tabular-nums"
                />
              </div>
              <div>
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-medium text-zinc-600">Runway (Months)</label>
                  {metrics.runway_months != null && metrics.runway_months >= 1000 && (
                    <span className="text-[10px] text-amber-700 font-medium">
                      Enter months, not cash
                    </span>
                  )}
                </div>
                <Input
                  type="number"
                  step="0.5"
                  max="999"
                  placeholder="e.g. 18"
                  value={metrics.runway_months ?? ''}
                  onChange={(e) => updateMetric('runway_months', e.target.value ? Number(e.target.value) : null)}
                  className="h-8 text-xs bg-white tabular-nums"
                />
                {metrics.runway_months != null && metrics.runway_months >= 1000 && metrics.burn_rate && metrics.burn_rate > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      const calculated = Number((metrics.runway_months! / metrics.burn_rate!).toFixed(1))
                      updateMetric('runway_months', calculated)
                    }}
                    className="text-[10px] text-blue-700 hover:underline mt-1 block text-left font-medium cursor-pointer"
                  >
                    Click to convert: ${(metrics.runway_months).toLocaleString()} cash ÷ ${(metrics.burn_rate).toLocaleString()} burn = {(metrics.runway_months / metrics.burn_rate).toFixed(1)} months
                  </button>
                )}
              </div>
              <div className="col-span-2 sm:col-span-1">
                <label className="text-[11px] font-medium text-zinc-600">LTV / CAC Ratio</label>
                <Input
                  type="number"
                  step="0.1"
                  placeholder="e.g. 3.8"
                  value={metrics.ltv_cac_ratio ?? ''}
                  onChange={(e) => updateMetric('ltv_cac_ratio', e.target.value ? Number(e.target.value) : null)}
                  className="h-8 text-xs bg-white tabular-nums"
                />
              </div>
            </div>
          </div>

          {/* ── 4. MILESTONES ─────────────────────────────────────── */}
          <div className="border border-amber-100 rounded-xl bg-amber-50/20 p-4 space-y-3">
            <div className="flex items-center gap-2 border-b border-amber-100 pb-2">
              <Flag className="w-4 h-4 text-amber-600" />
              <h3 className="text-xs font-bold text-amber-900 uppercase tracking-wide">
                4. Milestones &amp; Key Highlights
              </h3>
            </div>

            <div className="space-y-3 pt-1">
              <div>
                <label className="text-[11px] font-medium text-zinc-600">Targets Completion Rate (%)</label>
                <Input
                  type="number"
                  step="0.5"
                  placeholder="e.g. 85.0"
                  value={metrics.targets_completion_rate_pct ?? ''}
                  onChange={(e) => updateMetric('targets_completion_rate_pct', e.target.value ? Number(e.target.value) : null)}
                  className="h-8 text-xs bg-white w-full sm:w-1/2 tabular-nums"
                />
              </div>
              <div>
                <label className="text-[11px] font-medium text-zinc-600">Key Achievements</label>
                <Textarea
                  rows={2}
                  placeholder="What went well this month?"
                  value={achievements}
                  onChange={(e) => setAchievements(e.target.value)}
                  className="text-xs bg-white"
                />
              </div>
              <div>
                <label className="text-[11px] font-medium text-zinc-600">Challenges &amp; Headwinds</label>
                <Textarea
                  rows={2}
                  placeholder="Key roadblocks, regulatory or sales hurdles..."
                  value={challenges}
                  onChange={(e) => setChallenges(e.target.value)}
                  className="text-xs bg-white"
                />
              </div>
              <div>
                <label className="text-[11px] font-medium text-zinc-600">Targets &amp; Founder Asks</label>
                <Textarea
                  rows={2}
                  placeholder="Upcoming goals or areas where investors can help..."
                  value={targets}
                  onChange={(e) => setTargets(e.target.value)}
                  className="text-xs bg-white"
                />
              </div>
            </div>
          </div>

          {saveStatus && (
            <div
              className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                saveStatus.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-red-50 text-red-800 border border-red-200'
              }`}
            >
              {saveStatus.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              )}
              <span>{saveStatus.message}</span>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <SheetFooter className="p-4 border-t border-zinc-100 bg-white flex items-center justify-between sm:justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose} disabled={isPending} className="text-xs">
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            disabled={isPending}
            className="text-xs bg-[#1a23bd] hover:bg-[#161da3] text-white font-semibold cursor-pointer"
          >
            {isPending ? (
              <span className="flex items-center gap-1.5">
                <Spinner className="w-3.5 h-3.5" /> Saving...
              </span>
            ) : (
              'Save & Verify POEM Metrics'
            )}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
