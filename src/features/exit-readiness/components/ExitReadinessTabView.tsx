'use client'

import { useState } from 'react'
import { useRole } from '@/hooks/useRole'
import { saveExitReadinessAction } from '../actions/saveExitReadinessInput.action'
import type { ExitReadinessData, ReadinessSignal } from '../types'
import { useToast } from '@/hooks/use-toast'
import { FormSelect } from '@/components/ui/form-select'

interface ExitReadinessTabViewProps {
  companyId: string;
  initialData: ExitReadinessData | null;
}

export default function ExitReadinessTabView({ companyId, initialData }: ExitReadinessTabViewProps) {
  const { role } = useRole()
  const { toast } = useToast()
  const isInternal = role === 'internal' || role === 'admin'

  // Input states bounded strictly on a 0-5 scale
  const [readiness, setReadiness] = useState<ReadinessSignal>(initialData?.overall_readiness ?? 'Early')
  const [revGrowth, setRevGrowth] = useState(initialData?.revenue_growth ?? 0)
  const [gov, setGov] = useState(initialData?.governance ?? 0)
  const [capTable, setCapTable] = useState(initialData?.cap_table_quality ?? 0)
  const [finRep, setFinRep] = useState(initialData?.financial_reporting ?? 0)
  const [prodMat, setProdMat] = useState(initialData?.product_maturity ?? 0)
  const [teamDepth, setTeamDepth] = useState(initialData?.team_depth ?? 0)
  const [custConc, setCustConc] = useState(initialData?.customer_concentration ?? 0)
  const [fundHist, setFundHist] = useState(initialData?.fundraising_history ?? 0)
  const [poemDdr, setPoemDdr] = useState(initialData?.poemddr_completeness ?? 0)
  const [acqAttr, setAcqAttr] = useState(initialData?.acquirer_attractiveness ?? 0)

  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)

  // Calculate composite readiness framework total (Max 50 points mapped to 100%)
  const totalScorePoints = revGrowth + gov + capTable + finRep + prodMat + teamDepth + custConc + fundHist + poemDdr + acqAttr
  const compositePercentage = Math.round((totalScorePoints / 50) * 100)

  const handleUpdateScores = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setMsg(null)

    const res = await saveExitReadinessAction({
      companyId,
      overallReadiness: readiness,
      revenueGrowth: revGrowth,
      governance: gov,
      capTableQuality: capTable,
      financialReporting: finRep,
      productMaturity: prodMat,
      teamDepth: teamDepth,
      customerConcentration: custConc,
      fundraisingHistory: fundHist,
      poemddrCompleteness: poemDdr,
      acquirerAttractiveness: acqAttr
    })

    if (res.success) {
      toast({
        title: 'Matrix updated',
        description: 'Strategic readiness parameters have been synced.',
        type: 'success',
      })
    } else {
      toast({ title: 'Error syncing matrix', description: res.error ?? 'Something went wrong.', type: 'error' })
    }
    setMsg(res.success ? '✅ Strategic readiness matrix synced successfully.' : `❌ ${res.error}`)
    setSaving(false)
  }

  const scoringDimensions = [
    { key: 'rev', label: 'Revenue Growth Status', score: revGrowth, set: setRevGrowth, info: 'Velocity of top-line scale & recurring consistency.' },
    { key: 'gov', label: 'Corporate Governance', score: gov, set: setGov, info: 'Board structures, transparency compliance records, and controls.' },
    { key: 'cap', label: 'Cap Table Verification Quality', score: capTable, set: setCapTable, info: 'Clean ledger records, verified share allocations, and ownership paths.' },
    { key: 'fin', label: 'Financial Reporting Integrity', score: finRep, set: setFinRep, info: 'Depth of auditable statements, forecasting velocity, P&L tracks.' },
    { key: 'prod', label: 'Product & System Maturity', score: prodMat, set: setProdMat, info: 'Infrastructure health scales, IP defense barriers, code stability.' },
    { key: 'team', label: 'Management Team Depth', score: teamDepth, set: setTeamDepth, info: 'Executive retention, domain mastery layers, execution independence.' },
    { key: 'cust', label: 'Customer Concentration Management', score: custConc, set: setCustConc, info: 'Dependency reduction thresholds across key revenue accounts.' },
    { key: 'fund', label: 'Venture Fundraising History', score: fundHist, set: setFundHist, info: 'Historical track record of execution against prior cap rounds.' },
    { key: 'ddr', label: 'POEM DDR Data Room Completeness', score: poemDdr, set: setPoemDdr, info: 'Filing structure audit readiness inside core data parameters.' },
    { key: 'acq', label: 'M&A Acquirer Attractiveness', score: acqAttr, set: setAcqAttr, info: 'Strategic value validation relative to buying ecosystems.' }
  ]

  return (
    <div className="space-y-8 max-w-7xl text-sm text-zinc-600">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* VIEW DETAILS GRID PANELS (2 Columns) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* STATS ANALYTICS KPI HEADER */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-5 bg-white border border-zinc-100 rounded-lg flex justify-between items-center shadow-sm">
              <div>
                <h3 className="text-xs font-medium text-zinc-400 uppercase tracking-wide">Liquidity Path Stage</h3>
                <p className="text-xl font-bold text-zinc-900 mt-1">{readiness}</p>
              </div>
              <span className={`w-3.5 h-3.5 rounded-full border ${readiness === 'Ready' ? 'bg-emerald-500 border-emerald-600' : readiness === 'Progressing' ? 'bg-amber-500 border-amber-600' : 'bg-zinc-300 border-zinc-400'}`} />
            </div>

            <div className="p-5 bg-white border border-zinc-100 rounded-lg flex justify-between items-center shadow-sm">
              <div>
                <h3 className="text-xs font-medium text-zinc-400 uppercase tracking-wide">Composite Maturity Index</h3>
                <p className="text-xl font-bold text-zinc-900 mt-1">{compositePercentage}%</p>
              </div>
              <span className="text-xs font-semibold text-zinc-400 bg-zinc-50 border px-2 py-1 rounded">
                {totalScorePoints}/50 pts
              </span>
            </div>
          </div>

          {/* RENDER PROGRESS ANALYSIS METRICS DISPLAY */}
          <div className="p-6 bg-white border border-zinc-100 rounded-lg space-y-4">
            <h2 className="text-xs font-medium text-zinc-400 uppercase tracking-wide">Strategic Verification Matrix</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
              {scoringDimensions.map(dim => {
                const stepPercentage = (dim.score / 5) * 100
                return (
                  <div key={dim.key} className="space-y-1">
                    <div className="flex justify-between items-baseline text-xs">
                      <span className="font-semibold text-zinc-800 truncate pr-2">{dim.label}</span>
                      <span className="font-bold text-zinc-900 shrink-0">{dim.score}/5</span>
                    </div>
                    <div className="w-full h-1.5 bg-zinc-100 rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-300 ${dim.score >= 4 ? 'bg-emerald-500' : dim.score >= 2.5 ? 'bg-amber-500' : 'bg-zinc-400'}`}
                        style={{ width: `${stepPercentage}%` }}
                      />
                    </div>
                    <p className="text-[10px] text-zinc-400 leading-tight">{dim.info}</p>
                  </div>
                )
              })}
            </div>
          </div>

          {initialData?.last_verified_date && (
            <p className="text-[11px] text-zinc-400 italic">
              Audit matrix updated by {initialData.verified_by?.split('@')[0]} on {new Date(initialData.last_verified_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
            </p>
          )}
        </div>

        
      </div>
      {/* INPUT PANEL CONSOLE COLUMN (1 Column) */}
      <div className="space-y-4">
          <h2 className="text-xs font-medium text-zinc-400 uppercase tracking-wide">Audit Parameters Console</h2>
          {!isInternal ? (
            <div className="p-4 bg-zinc-50 border border-zinc-100 text-xs text-zinc-400 rounded-lg">
              🔒 Read-Only Access. Operational parameters are restricted to portfolio review managers.
            </div>
          ) : (
            <form onSubmit={handleUpdateScores} className="p-5 bg-white border border-zinc-100 rounded-lg shadow-sm space-y-4">
              {msg && <p className="p-2 bg-zinc-50 text-xs font-medium border rounded text-zinc-700">{msg}</p>}

              <div>
                <label className="text-xs font-medium text-zinc-400 uppercase block mb-1">M&A Liquidity Tier</label>
                <FormSelect value={readiness} onChange={(e) => setReadiness(e.target.value as ReadinessSignal)}>
                  <option value="Early">Early Stage Framework</option>
                  <option value="Progressing">Progressing Tracks</option>
                  <option value="Ready">Ready for Exit Liquidity</option>
                </FormSelect>
              </div>

              {/* Dynamic Sliders mapped to check boundaries [0-5] */}
              <div className="space-y-3 pt-2 border-t border-zinc-50 max-h-[400px] overflow-y-auto pr-1">
                {scoringDimensions.map(slider => (
                  <div key={slider.key} className="space-y-1">
                    <div className="flex justify-between items-baseline text-xs">
                      <label className="font-medium text-zinc-500">{slider.label}</label>
                      <span className="font-bold text-zinc-900">{slider.score} / 5</span>
                    </div>
                    <input 
                      type="range" min="0" max="5" step="1"
                      value={slider.score} 
                      onChange={(e) => slider.set(Number(e.target.value))} 
                      className="w-full h-1 bg-zinc-200 accent-zinc-900 cursor-pointer"
                    />
                  </div>
                ))}
              </div>

              <button type="submit" disabled={saving} className="w-full flex items-center justify-center gap-2 h-9 text-xs font-medium text-white bg-[#1a23bd] rounded-md hover:bg-[#151c9a] disabled:opacity-70 transition-colors mt-2">
                {saving ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Syncing audit parameters…
                  </>
                ) : 'Commit Matrix Updates'}
              </button>
            </form>
          )}
        </div>
    </div>
  )
}