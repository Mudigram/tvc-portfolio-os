'use client'

import { useState } from 'react'
import { useRole } from '@/hooks/useRole'
import { saveFundingStatusAction } from '../actions/saveFundingStatus.action'
import { createFundingRoundAction } from '../actions/createFundingRound.action'
import type { FundingRound, FundingStatus, CompanyFundingSummary, RoundName } from '../types'
import { useToast } from '@/hooks/use-toast'

interface FundingTabViewProps {
  companyId: string
  initialStatus: FundingStatus | null
  rounds: FundingRound[]
  summary: CompanyFundingSummary
}

const formatUSD = (val: number | null) => {
  if (val === null || isNaN(val)) return '—'
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val)
}

const ROUND_TYPES: RoundName[] = ['Pre-seed', 'Seed', 'Series A', 'Series B', 'Series C', 'Series D', 'Series E+', 'Bridge', 'Debt', 'Grant', 'Other']

export default function FundingTabView({ companyId, initialStatus, rounds, summary }: FundingTabViewProps) {
  const { role } = useRole()
  const { toast } = useToast()
  const isInternal = role === 'internal'

  // 1. Extended Management States
  const [isActivelyRaising, setIsActivelyRaising] = useState(initialStatus?.is_actively_raising ?? false)
  const [runwayMonths, setRunwayMonths] = useState(initialStatus?.runway_months?.toString() ?? '')
  const [raiseTarget, setRaiseTarget] = useState(initialStatus?.current_raise_target?.toString() ?? '')
  const [instrument, setInstrument] = useState(initialStatus?.instrument ?? '')
  const [leadStatus, setLeadStatus] = useState(initialStatus?.lead_investor_status ?? '')
  const [commitments, setCommitments] = useState(initialStatus?.existing_commitments?.toString() ?? '')
  const [followon, setFollowon] = useState(initialStatus?.followon_opportunity ?? false)

  // 2. New Historical Round Form Modal States
  const [showRoundModal, setShowRoundModal] = useState(false)
  const [roundName, setRoundName] = useState<RoundName>('Seed')
  const [roundAmount, setRoundAmount] = useState('')
  const [roundValuation, setRoundValuation] = useState('')
  const [roundLead, setRoundLead] = useState('')

  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setMessage(null)

    const res = await saveFundingStatusAction({
      companyId,
      isActivelyRaising,
      runwayMonths: runwayMonths === '' ? null : parseInt(runwayMonths, 10),
      currentRaiseTarget: raiseTarget === '' ? null : parseFloat(raiseTarget),
      instrument: instrument === '' ? null : instrument,
      leadInvestorStatus: leadStatus === '' ? null : leadStatus,
      existingCommitments: commitments === '' ? null : parseFloat(commitments),
      followonOpportunity: followon
    })

    if (res.success) {
      toast({
        title: 'Funding status saved',
        description: 'Operational fundraising parameters have been updated.',
        type: 'success',
      })
    } else {
      toast({ title: 'Error saving status', description: res.error ?? 'Something went wrong.', type: 'error' })
    }
    setMessage(res.success ? '✅ Operational updates applied.' : `❌ ${res.error}`)
    setSaving(false)
  }

  const handleLogRound = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    const res = await createFundingRoundAction({
      company_id: companyId,
      round_name: roundName,
      amount_raised: roundAmount === '' ? null : parseFloat(roundAmount),
      post_money_valuation: roundValuation === '' ? null : parseFloat(roundValuation),
      lead_investor: roundLead === '' ? null : roundLead,
      date_closed: new Date().toISOString()
    })

    if (res.success) {
      toast({
        title: 'Funding round logged',
        description: `${roundName} round has been committed to the record.`,
        type: 'success',
      })
      setShowRoundModal(false)
      setRoundAmount('')
      setRoundValuation('')
      setRoundLead('')
    } else {
      toast({ title: 'Error logging round', description: res.error ?? 'Something went wrong.', type: 'error' })
    }
    setSaving(false)
  }

  return (
    <div className="space-y-8 max-w-7xl">
      {/* Analytics Summaries */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-5 border border-zinc-100 rounded-lg bg-white">
          <p className="text-xs font-medium text-zinc-400 uppercase tracking-wide">Total Venture Capital Raised</p>
          <p className="text-2xl font-semibold text-zinc-900 mt-2">{formatUSD(summary.total_raised)}</p>
        </div>
        <div className="p-5 border border-zinc-100 rounded-lg bg-white">
          <p className="text-xs font-medium text-zinc-400 uppercase tracking-wide">Latest Round Valuation</p>
          <p className="text-2xl font-semibold text-zinc-900 mt-2">{formatUSD(summary.latest_valuation)}</p>
        </div>
        <div className="p-5 border border-zinc-100 rounded-lg bg-white">
          <p className="text-xs font-medium text-zinc-400 uppercase tracking-wide">Operational Runway</p>
          <p className="text-2xl font-semibold text-zinc-900 mt-2">{summary.runway_months ? `${summary.runway_months} Mos` : '—'}</p>
        </div>
        <div className="p-5 border border-zinc-100 rounded-lg bg-white">
          <p className="text-xs font-medium text-zinc-400 uppercase tracking-wide">Fundraising Status</p>
          <p className="text-2xl font-semibold text-zinc-900 mt-2 text-amber-600">{summary.actively_raising ? 'Actively Raising' : 'Closed'}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 items-start">
        {/* Table View Layout */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-medium text-zinc-400 uppercase tracking-wide">Funding Round History</h2>
            {isInternal && (
              <button 
                onClick={() => setShowRoundModal(true)}
                className="h-7 px-3 text-xs font-medium text-white bg-[#1a23bd] rounded-md hover:bg-[#151c9a] transition-colors"
              >
                + Log Funding Round
              </button>
            )}
          </div>

          {rounds.length === 0 ? (
            <div className="py-12 border border-dashed border-zinc-200 rounded-lg text-center text-sm text-zinc-400 bg-white">
              No formal capital injection histories recorded.
            </div>
          ) : (
            <div className="border border-zinc-100 rounded-lg bg-white overflow-hidden">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-zinc-50 border-b border-zinc-100 text-xs font-medium text-zinc-400 uppercase tracking-wider">
                    <th className="p-4">Round</th>
                    <th className="p-4">Amount Raised</th>
                    <th className="p-4">Post-Money Valuation</th>
                    <th className="p-4">Lead Investor</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-50">
                  {rounds.map((round) => (
                    <tr key={round.id} className="hover:bg-zinc-50/50 transition-colors">
                      <td className="p-4 font-medium text-zinc-900">{round.round_name}</td>
                      <td className="p-4 text-zinc-700">{formatUSD(round.amount_raised)}</td>
                      <td className="p-4 text-zinc-700">{formatUSD(round.post_money_valuation)}</td>
                      <td className="p-4 text-zinc-500">{round.lead_investor || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
      {/* Management Dashboard Inputs (Full Column Form) */}
        
      <div className="space-y-4">
          <h2 className="text-xs font-medium text-zinc-400 uppercase tracking-wide">Manage Fundraising Parameters</h2>
          {!isInternal ? (
            <div className="p-4 border border-zinc-100 rounded-lg bg-zinc-50 text-xs text-zinc-400">
              🔒 Read-Only Access. Data manipulation locks are active.
            </div>
          ) : (
            <form onSubmit={handleUpdateStatus} className="border border-zinc-100 rounded-lg p-5 bg-white space-y-4 shadow-sm text-sm">
              {message && <p className="p-2 bg-zinc-50 border rounded text-xs font-medium text-zinc-700">{message}</p>}

              <div className="flex items-center justify-between pb-2 border-b border-zinc-50">
                <label className="font-medium text-zinc-700">Actively Fundraising</label>
                <input type="checkbox" checked={isActivelyRaising} onChange={(e) => setIsActivelyRaising(e.target.checked)} className="accent-zinc-900" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-zinc-400 uppercase">Runway (Months)</label>
                  <input type="number" value={runwayMonths} onChange={(e) => setRunwayMonths(e.target.value)} className="w-full px-2.5 py-1.5 border rounded mt-1 text-sm" />
                </div>
                <div>
                  <label className="text-xs font-medium text-zinc-400 uppercase">Target (USD)</label>
                  <input type="number" value={raiseTarget} onChange={(e) => setRaiseTarget(e.target.value)} className="w-full px-2.5 py-1.5 border rounded mt-1 text-sm" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-zinc-400 uppercase">Instrument</label>
                  <input type="text" placeholder="e.g. SAFE, Equity" value={instrument} onChange={(e) => setInstrument(e.target.value)} className="w-full px-2.5 py-1.5 border rounded mt-1 text-sm" />
                </div>
                <div>
                  <label className="text-xs font-medium text-zinc-400 uppercase">Commitments (USD)</label>
                  <input type="number" value={commitments} onChange={(e) => setCommitments(e.target.value)} className="w-full px-2.5 py-1.5 border rounded mt-1 text-sm" />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-zinc-400 uppercase">Lead Investor Status</label>
                <input type="text" placeholder="e.g. Term Sheet signed, open" value={leadStatus} onChange={(e) => setLeadStatus(e.target.value)} className="w-full px-2.5 py-1.5 border rounded mt-1 text-sm" />
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-zinc-50">
                <label className="font-medium text-zinc-700">Follow-on Opportunity</label>
                <input type="checkbox" checked={followon} onChange={(e) => setFollowon(e.target.checked)} className="accent-zinc-900" />
              </div>

              <button type="submit" disabled={saving} className="w-full h-9 text-xs font-medium text-white bg-[#1a23bd] rounded-md hover:bg-[#151c9a] transition-colors mt-2">
                {saving ? 'Saving changes…' : 'Save Operational Status'}
              </button>
            </form>
          )}
        </div>
      {/* HISTORICAL CREATION ROUND OVERLAY MODAL */}
      {showRoundModal && (
        <div className="fixed inset-0 bg-zinc-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <form onSubmit={handleLogRound} className="bg-white rounded-lg border border-zinc-100 p-6 max-w-md w-full space-y-4 shadow-xl">
            <h3 className="text-sm font-medium text-zinc-900 border-b pb-2">Log New Funding Injection</h3>
            
            <div>
              <label className="text-xs font-medium text-zinc-400 uppercase">Round Tier Stage</label>
              <select value={roundName} onChange={(e) => setRoundName(e.target.value as RoundName)} className="w-full p-2 border rounded text-sm bg-white mt-1">
                {ROUND_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-zinc-400 uppercase">Amount Raised (USD)</label>
                <input type="number" required value={roundAmount} onChange={(e) => setRoundAmount(e.target.value)} className="w-full p-2 border rounded text-sm mt-1" />
              </div>
              <div>
                <label className="text-xs font-medium text-zinc-400 uppercase">Post-Valuation (USD)</label>
                <input type="number" value={roundValuation} onChange={(e) => setRoundValuation(e.target.value)} className="w-full p-2 border rounded text-sm mt-1" />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-zinc-400 uppercase">Lead Institutional Investor</label>
              <input type="text" placeholder="e.g. Sequoia Capital" value={roundLead} onChange={(e) => setRoundLead(e.target.value)} className="w-full p-2 border rounded text-sm mt-1" />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t">
              <button type="button" onClick={() => setShowRoundModal(false)} className="px-3 py-1.5 text-xs font-medium text-zinc-500 hover:text-zinc-800">Cancel</button>
              <button type="submit" disabled={saving} className="px-3 py-1.5 text-xs font-medium text-white bg-[#1a23bd] rounded hover:bg-[#151c9a]">Commit Record</button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}