'use client'

import { useState } from 'react'
import { useRole } from '@/hooks/useRole'
import { saveDdrStatusAction } from '../actions/saveDdrStatus.action'
import type { DdrStatusData, DgcDdrStatus } from '../types'
import { useToast } from '@/hooks/use-toast'

interface DdrTabViewProps {
  companyId: string;
  initialData: DdrStatusData | null;
}

const STATUS_OPTS: DgcDdrStatus[] = ['Awaiting Documents', 'In Progress', 'Verified', 'Flagged']

export default function DdrTabView({ companyId, initialData }: DdrTabViewProps) {
  const { role } = useRole()
  const { toast } = useToast()
  const isInternal = role === 'internal'

  // Component local fields states
  const [status, setStatus] = useState<DgcDdrStatus>(initialData?.current_status ?? 'Awaiting Documents')
  const [contact, setContact] = useState(initialData?.dgc_contact_name ?? '')
  const [notes, setNotes] = useState(initialData?.notes ?? '')
  
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)

  const handleUpdateDdr = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setMsg(null)

    const res = await saveDdrStatusAction({
      companyId,
      currentStatus: status,
      dgcContactName: contact,
      notes
    })

    if (res.success) {
      toast({
        title: 'DGC state synced',
        description: 'Due diligence compliance data has been captured.',
        type: 'success',
      })
    } else {
      toast({ title: 'Error syncing DGC state', description: res.error ?? 'Something went wrong.', type: 'error' })
    }
    setMsg(res.success ? '✅ DGC compliance updates captured.' : `❌ ${res.error}`)
    setSaving(false)
  }

  // Map contextual status color indicators
  const getBadgeStyle = (tag: DgcDdrStatus) => {
    switch (tag) {
      case 'Verified':           return 'text-emerald-700 bg-emerald-50 border-emerald-200'
      case 'In Progress':        return 'text-blue-700 bg-blue-50 border-blue-200'
      case 'Flagged':            return 'text-red-700 bg-red-50 border-red-200 font-bold'
      case 'Awaiting Documents': return 'text-amber-700 bg-amber-50 border-amber-200'
    }
  }

  // Institutional Protection Wall Check
  if (!isInternal) {
    return (
      <div className="py-16 border border-dashed border-zinc-200 rounded-lg text-center max-w-2xl">
        <p className="text-sm font-medium text-zinc-900">🔒 Confined Resource Workspace</p>
        <p className="text-xs text-zinc-400 mt-1">Due Diligence Data Rooms run through decentralized institutional processes between TVCLabs and DGC. Access keys restricted.</p>
      </div>
    )
  }

  return (
    <div className="space-y-8 max-w-6xl text-sm text-zinc-600">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* VIEW DATA CONTEXT COLUMN (2 Columns) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* RADAR SUMMARY BANNER STATUS CARD */}
          <div className="p-5 bg-white border border-zinc-100 rounded-lg shadow-sm flex items-center justify-between gap-4">
            <div>
              <span className="text-xs font-medium text-zinc-400 uppercase tracking-wide">DGC Verification Audit Tracker</span>
              <div className="flex items-center gap-3 mt-1">
                <h3 className="text-2xl font-bold text-zinc-900 tracking-tight">Current Status</h3>
                <span className={`px-2.5 py-0.5 border text-xs font-semibold rounded-md ${getBadgeStyle(status)}`}>
                  {status}
                </span>
              </div>
            </div>
            {initialData?.last_updated_at && (
              <p className="text-[11px] text-zinc-400 text-right leading-relaxed">
                Logged by {initialData.updated_by}<br />
                on {new Date(initialData.last_updated_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
              </p>
            )}
          </div>

          {/* LIAISON RECOGNITION PANEL */}
          <div className="p-5 border border-zinc-100 bg-white rounded-lg flex items-center justify-between">
            <div>
              <h4 className="text-xs font-medium text-zinc-400 uppercase tracking-wide">Assigned Shared DGC Liaison</h4>
              <p className="text-base font-semibold text-zinc-900 mt-1">{contact.trim() || 'No liaison bridge coordinate mapped yet.'}</p>
            </div>
            <span className="text-[10px] text-zinc-400 uppercase font-medium border bg-zinc-50 px-2 py-0.5 rounded tracking-wide">Liaison Profile</span>
          </div>

          {/* COMPACT NOTES RECORD VIEW CONTAINER */}
          <div className="p-5 border border-zinc-100 bg-white rounded-lg space-y-2">
            <h4 className="text-xs font-medium text-zinc-400 uppercase tracking-wide">DGC Communications Log & Outcome Threads</h4>
            <div className="p-4 bg-zinc-50/50 rounded border border-zinc-100 min-h-24 text-zinc-700 whitespace-pre-wrap leading-relaxed">
              {notes.trim() || 'No active operational notes logged regarding this data room context.'}
            </div>
          </div>
        </div>

        {/* DATA ROOM MANAGEMENT CONSOLE CONTROLLER (1 Column) */}
        <div className="space-y-4">
          <h2 className="text-xs font-medium text-zinc-400 uppercase tracking-wide">DGC Integration Console</h2>
          <form onSubmit={handleUpdateDdr} className="p-5 bg-white border border-zinc-100 rounded-lg shadow-sm space-y-4">
            {msg && <p className="p-2 bg-zinc-50 border rounded text-xs font-medium text-zinc-700">{msg}</p>}

            <div>
              <label className="text-xs font-medium text-zinc-400 uppercase block mb-1">Update Reported Status</label>
              <select value={status} onChange={(e) => setStatus(e.target.value as DgcDdrStatus)} className="w-full border p-2 bg-white text-sm rounded">
                {STATUS_OPTS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
              </select>
            </div>

            <div>
              <label className="text-xs font-medium text-zinc-400 uppercase block mb-1">Shared Bridge DGC Contact</label>
              <input type="text" placeholder="e.g. John Doe (Shared Team)" value={contact} onChange={(e) => setContact(e.target.value)} className="w-full border p-2 text-sm rounded focus:ring-2 focus:ring-zinc-900 focus:outline-none" />
            </div>

            <div>
              <label className="text-xs font-medium text-zinc-400 uppercase block mb-1">Communications Summary / Notes Thread</label>
              <textarea rows={6} placeholder="Record update logs, milestone gaps, or verification timelines from DGC..." value={notes} onChange={(e) => setNotes(e.target.value)} className="w-full border p-2 text-xs rounded resize-none focus:ring-2 focus:ring-zinc-900 focus:outline-none" />
            </div>

            <button type="submit" disabled={saving} className="w-full h-9 text-xs font-medium text-white bg-[#1a23bd] rounded-md hover:bg-[#151c9a] transition-colors mt-2">
              {saving ? 'Committing log sync…' : 'Sync DGC Data State'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}