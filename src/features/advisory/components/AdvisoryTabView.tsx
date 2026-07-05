'use client'

import { useEffect, useState } from 'react'
import { useRole } from '@/hooks/useRole'
import { logAdvisoryActivityAction } from '../actions/LogAdvisoryActivity.action'
import type { AdvisoryActivity, AdvisorRosterItem, AdvisorInteractionType } from '../types'
import { useToast } from '@/hooks/use-toast'

interface AdvisoryTabViewProps {
  companyId: string
  activities: AdvisoryActivity[]
  roster: AdvisorRosterItem[]
}

const INTERACTION_TYPES: { value: AdvisorInteractionType; label: string }[] = [
    { value: 'TD', label: 'TD' },
    { value: 'TVCLabs', label: 'TVCLabs Internal' },
    
    { value: 'Angel', label: 'Angel Investor Net' },
    { value: 'External', label: 'External Advisor' }
  ]

  const BADGE_STYLES: Record<AdvisorInteractionType, string> = {
    TVCLabs:  'text-blue-700 bg-blue-50 border-blue-200',
    TD:       'text-emerald-700 bg-emerald-50 border-emerald-200',
    Angel:    'text-amber-700 bg-amber-50 border-amber-200',
    External: 'text-zinc-700 bg-zinc-50 border-zinc-200',
  }
  
export default function AdvisoryTabView({ companyId, activities, roster }: AdvisoryTabViewProps) {
  const { role } = useRole()
  const { toast } = useToast()
  const isInternal = role === 'internal'

  // Form Management States
  const [advisorName, setAdvisorName] = useState('')
  const [advisorType, setAdvisorType] = useState<AdvisorInteractionType>('TVCLabs')
  const [useCustomAdvisor, setUseCustomAdvisor] = useState(false)
  const [topic, setTopic] = useState('')
  const [sessionDate, setSessionDate] = useState(new Date().toISOString().split('T')[0])
  const [nextAction, setNextAction] = useState('')
  const [nextDate, setNextDate] = useState('')

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleLogActivity = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!advisorName) return alert('Select an active advisor.')
    setSaving(true)
    setError(null)

    const res = await logAdvisoryActivityAction({
      company_id: companyId,
      advisor_name: advisorName,
      advisor_type: advisorType,
      topic,
      session_date: sessionDate,
      next_action: nextAction || null,
      next_action_date: nextDate || null
    })

    if (res.success) {
      toast({
        title: 'Interaction logged',
        description: 'Advisory engagement has been committed.',
        type: 'success',
      })
      setTopic('')
      setNextAction('')
      setNextDate('')
    } else {
      const errMsg = res.error || 'Failed to capture action.'
      setError(errMsg)
      toast({ title: 'Error logging interaction', description: errMsg, type: 'error' })
    }
    setSaving(false)
  }
  useEffect(() => {
    if (advisorName === '__custom__') {
      setTimeout(() => {
        setUseCustomAdvisor(true)
        setAdvisorName('')
      }, 0)
    }
  }, [advisorName])
  return (
    <div className="space-y-8 max-w-7xl text-sm text-zinc-600">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* LEFT & CENTER SECTIONS (2 Columns) */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* ROSTER PREVIEW SUMMARY BOX */}
          <div className="space-y-3">
            <h2 className="text-xs font-medium text-zinc-400 uppercase tracking-wide">Cap Table Official Advisors</h2>
            {roster.length === 0 ? (
              <p className="text-zinc-400 italic text-xs bg-zinc-50 p-4 border border-dashed rounded-lg">No advisory equity stakeholders logged on cap table records.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {roster.map(adv => (
                  <div key={adv.id} className="p-3 bg-white border border-zinc-100 rounded-lg flex justify-between items-center">
                    <span className="font-medium text-zinc-900">{adv.advisor_name}</span>
                    <span className="text-xs text-zinc-400 bg-zinc-50 px-2 py-0.5 border rounded">
                      {adv.ownership_pct ? `${adv.ownership_pct}% Equity` : adv.instrument_name || 'Advisor'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* HISTORICAL ACTIVITY ENGAGEMENT TRACKER LIST */}
          <div className="space-y-4">
            <h2 className="text-xs font-medium text-zinc-400 uppercase tracking-wide">Advisor Interaction Activity History Log</h2>
            {activities.length === 0 ? (
              <div className="py-12 border border-dashed text-center text-zinc-400 bg-white rounded-lg">No interactive advisory moments logged yet.</div>
            ) : (
              <div className="space-y-4">
                {activities.map(act => (
                  <div key={act.id} className="p-5 border border-zinc-100 bg-white rounded-lg space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-semibold text-zinc-900 text-base">{act.advisor_name}</span>
                        <p className="text-xs text-zinc-400 mt-0.5">Session held on {new Date(act.session_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                      </div>
                      <span className="px-2 py-0.5 border rounded-full text-xs font-medium text-zinc-700 bg-zinc-50">{act.advisor_type}</span>
                    </div>
                    <p className="text-zinc-700 whitespace-pre-wrap leading-relaxed pt-2 border-t border-zinc-50">{act.topic}</p>
                    {act.next_action && (
                      <div className="mt-2 p-2.5 bg-zinc-50/50 rounded border border-zinc-100/80 text-xs">
                        <strong className="text-zinc-500 uppercase tracking-wider text-[10px] block mb-0.5">Next Targeted Deliverable</strong>
                        <span className="text-zinc-800">{act.next_action}</span> {act.next_action_date && <span className="text-zinc-400">by {act.next_action_date}</span>}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        
      </div>
              
      <div className="space-y-4">
          <h2 className="text-xs font-medium text-zinc-400 uppercase tracking-wide">Log Dynamic Advisor Engagement</h2>
          {!isInternal ? (
            <div className="p-4 border border-zinc-100 bg-zinc-50 rounded-lg text-xs text-zinc-400">
              🔒 Read-Only. Action logs restricted to asset managers.
            </div>
          ) : (
            <form onSubmit={handleLogActivity} className="p-5 border border-zinc-100 bg-white rounded-lg shadow-sm space-y-4">
              {error && <p className="text-xs text-red-600 bg-red-50 p-2 rounded border border-red-100">{error}</p>}
              
              <div className="space-y-2">
  <label className="text-xs font-medium text-zinc-400 uppercase block">
    Select Active Advisor
  </label>

  {!useCustomAdvisor ? (
    <div className="flex items-center gap-2">
      <select
        value={advisorName}
        onChange={(e) => setAdvisorName(e.target.value)}
        className="flex-1 border p-2 rounded bg-white text-sm focus:ring-2 focus:ring-zinc-900"
        required={!useCustomAdvisor}
      >
        <option value="">-- Choose Advisor --</option>
        {roster.map(r => (
          <option key={r.id} value={r.advisor_name}>{r.advisor_name}</option>
        ))}
        <option disabled>──────────</option>
        <option value="__custom__">Someone not on this list…</option>
      </select>
    </div>
  ) : (
    <div className="flex items-center gap-2">
      <input
        type="text"
        value={advisorName}
        onChange={(e) => setAdvisorName(e.target.value)}
        placeholder="Enter advisor name"
        className="flex-1 border p-2 rounded text-sm focus:ring-2 focus:ring-zinc-900"
        required
        autoFocus
      />
      <button
        type="button"
        onClick={() => { setUseCustomAdvisor(false); setAdvisorName('') }}
        className="text-xs text-zinc-400 hover:text-zinc-700 whitespace-nowrap"
      >
        Back to list
      </button>
    </div>
  )}
</div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-zinc-400 uppercase block mb-1">Session Date</label>
                  <input type="date" value={sessionDate} onChange={(e) => setSessionDate(e.target.value)} className="w-full border p-1.5 rounded text-sm" required />
                </div>
                <div>
  <label className="text-xs font-medium text-zinc-400 uppercase block mb-1">
    Advisory Stream / Channel
  </label>
  <select 
    value={advisorType} 
    onChange={(e) => setAdvisorType(e.target.value as AdvisorInteractionType)} 
    className="w-full border p-1.5 rounded text-sm bg-white"
  >
    {INTERACTION_TYPES.map(t => (
      <option key={t.value} value={t.value}>{t.label}</option>
    ))}
  </select>
</div>
              </div>

              <div>
                <label className="text-xs font-medium text-zinc-400 uppercase block mb-1">Interaction Summary / Notes</label>
                <textarea rows={4} placeholder="What issues were evaluated? Note key outputs/intros..." value={topic} onChange={(e) => setTopic(e.target.value)} className="w-full border p-2 rounded text-sm focus:ring-2 focus:ring-zinc-900 resize-none" required />
              </div>

              <div className="border-t border-zinc-50 pt-3 space-y-3">
                <div>
                  <label className="text-xs font-medium text-zinc-400 uppercase block mb-1">Follow-on Action Item (Optional)</label>
                  <input type="text" placeholder="e.g. Schedule review workshop" value={nextAction} onChange={(e) => setNextAction(e.target.value)} className="w-full border p-1.5 rounded text-sm" />
                </div>
                <div>
                  <label className="text-xs font-medium text-zinc-400 uppercase block mb-1">Action Deadline</label>
                  <input type="date" value={nextDate} onChange={(e) => setNextDate(e.target.value)} className="w-full border p-1.5 rounded text-sm" />
                </div>
              </div>
              

              <button type="submit" disabled={saving || !advisorName} className="w-full h-9 text-xs font-medium text-white bg-[#1a23bd] rounded-md hover:bg-[#151c9a] disabled:opacity-40 transition-colors mt-2">
                {saving ? 'Saving engagement log…' : 'Commit Interaction Log'}
              </button>
            </form>
          )}
        </div>
    </div>
  )
}