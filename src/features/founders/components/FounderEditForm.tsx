'use client'

import { useState } from 'react'
import { updateFounderAction } from '@/features/founders/actions/updateFounder.action'
import type { Founder, UpdateFounderInput } from '@/features/founders/types'
import { useToast } from '@/hooks/use-toast'

const INDUSTRIES = [
  'Fintech', 'Healthtech', 'Developer Tools', 'Logistics',
  'SaaS / Productivity', 'Edtech', 'E-commerce', 'Climate', 'Media', 'Other',
]

const STAGES = ['Pre-Idea', 'Pre-Seed', 'Seed', 'Series A', 'Series B', 'Growth']

const DDR_STATUSES = ['Pending', 'In Progress', 'Verified', 'Flagged']

interface FounderEditFormProps {
  founder: Founder
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="space-y-0.5">
      <p className="text-xs font-medium text-zinc-400 uppercase tracking-wide">{label}</p>
      <div className="text-sm text-zinc-800">{value ?? '—'}</div>
    </div>
  )
}

export function FounderEditForm({ founder }: FounderEditFormProps) {
  const { toast } = useToast()
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [form, setForm] = useState<UpdateFounderInput>({
    full_name: founder.full_name,
    email: founder.email,
    startup_name: founder.startup_name,
    phone: founder.phone,
    industry: founder.industry,
    stage: founder.stage,
    city: founder.city,
    country: founder.country,
    ddr_status: founder.ddr_status,
    notes: founder.notes,
    linkedin_url: founder.linkedin_url,
  })

  function set(field: keyof UpdateFounderInput, value: string | null) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSave() {
    setSaving(true)
    setError(null)
    const result = await updateFounderAction(founder.id, form)
    if (!result.success) {
      const errMsg = result.error ?? 'Something went wrong.'
      setError(errMsg)
      toast({ title: 'Error saving founder', description: errMsg, type: 'error' })
    } else {
      toast({
        title: 'Founder updated',
        description: `${form.full_name}'s details have been saved.`,
        type: 'success',
      })
      setEditing(false)
    }
    setSaving(false)
  }

  function handleCancel() {
    setForm({
      full_name: founder.full_name,
      email: founder.email,
      startup_name: founder.startup_name,
      phone: founder.phone,
      industry: founder.industry,
      stage: founder.stage,
      city: founder.city,
      country: founder.country,
      ddr_status: founder.ddr_status,
      notes: founder.notes,
      linkedin_url: founder.linkedin_url,
    })
    setEditing(false)
    setError(null)
  }

  // ── Display mode ──────────────────────────────────────────────────────────
  if (!editing) {
    return (
      <div className="space-y-8">
        <div className="grid grid-cols-2 gap-x-8 gap-y-6">
          <Field label="Full name"    value={founder.full_name} />
          <Field label="Email"        value={
            <a href={`mailto:${founder.email}`}
               className="underline underline-offset-2 hover:text-zinc-600">
              {founder.email}
            </a>
          } />
          <Field label="Phone"        value={founder.phone} />
          <Field label="Startup"      value={founder.startup_name} />
          <Field label="Industry"     value={founder.industry} />
          <Field label="Stage"        value={founder.stage} />
          <Field label="City"         value={founder.city} />
          <Field label="Country"      value={founder.country} />
          <Field label="DDR status"   value={founder.ddr_status} />
          <Field label="LinkedIn"     value={
            founder.linkedin_url ? (
              <a href={founder.linkedin_url} target="_blank" rel="noopener noreferrer"
                 className="underline underline-offset-2 hover:text-zinc-600">
                View profile →
              </a>
            ) : null
          } />
        </div>

        {founder.notes && (
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-zinc-400 uppercase tracking-wide">Notes</p>
            <p className="text-sm text-zinc-700 leading-relaxed whitespace-pre-wrap">
              {founder.notes}
            </p>
          </div>
        )}

        <button
          onClick={() => setEditing(true)}
          className="text-xs text-zinc-400 hover:text-zinc-700 underline underline-offset-2 transition-colors"
        >
          Edit founder
        </button>
      </div>
    )
  }

  // ── Edit mode ─────────────────────────────────────────────────────────────
  return (
    <div className="border border-zinc-100 rounded-lg p-5 space-y-5 bg-zinc-50">

      {error && <p className="text-xs text-red-600">{error}</p>}

      <div className="grid grid-cols-2 gap-4">

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-zinc-500 uppercase tracking-wide">
            Full name <span className="text-red-400">*</span>
          </label>
          <input type="text" value={form.full_name}
            onChange={(e) => set('full_name', e.target.value)}
            className="w-full h-9 px-3 text-sm border border-zinc-200 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-zinc-500 uppercase tracking-wide">
            Email <span className="text-red-400">*</span>
          </label>
          <input type="email" value={form.email}
            onChange={(e) => set('email', e.target.value)}
            className="w-full h-9 px-3 text-sm border border-zinc-200 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-zinc-500 uppercase tracking-wide">Phone</label>
          <input type="text" value={form.phone ?? ''}
            onChange={(e) => set('phone', e.target.value || null)}
            className="w-full h-9 px-3 text-sm border border-zinc-200 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-zinc-500 uppercase tracking-wide">Startup name</label>
          <input type="text" value={form.startup_name ?? ''}
            onChange={(e) => set('startup_name', e.target.value || null)}
            className="w-full h-9 px-3 text-sm border border-zinc-200 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-zinc-500 uppercase tracking-wide">Industry</label>
          <select value={form.industry ?? ''}
            onChange={(e) => set('industry', e.target.value || null)}
            className="w-full h-9 px-3 text-sm border border-zinc-200 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-zinc-900"
          >
            <option value="">Select industry</option>
            {INDUSTRIES.map((i) => <option key={i}>{i}</option>)}
          </select>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-zinc-500 uppercase tracking-wide">Stage</label>
          <select value={form.stage ?? ''}
            onChange={(e) => set('stage', e.target.value || null)}
            className="w-full h-9 px-3 text-sm border border-zinc-200 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-zinc-900"
          >
            <option value="">Select stage</option>
            {STAGES.map((s) => <option key={s}>{s}</option>)}
          </select>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-zinc-500 uppercase tracking-wide">City</label>
          <input type="text" value={form.city ?? ''}
            onChange={(e) => set('city', e.target.value || null)}
            className="w-full h-9 px-3 text-sm border border-zinc-200 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-zinc-500 uppercase tracking-wide">Country</label>
          <input type="text" value={form.country ?? ''}
            onChange={(e) => set('country', e.target.value || null)}
            className="w-full h-9 px-3 text-sm border border-zinc-200 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-zinc-500 uppercase tracking-wide">DDR status</label>
          <select value={form.ddr_status ?? ''}
            onChange={(e) => set('ddr_status', e.target.value || null)}
            className="w-full h-9 px-3 text-sm border border-zinc-200 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-zinc-900"
          >
            <option value="">Select status</option>
            {DDR_STATUSES.map((s) => <option key={s}>{s}</option>)}
          </select>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-zinc-500 uppercase tracking-wide">LinkedIn URL</label>
          <input type="url" value={form.linkedin_url ?? ''}
            onChange={(e) => set('linkedin_url', e.target.value || null)}
            placeholder="https://linkedin.com/in/..."
            className="w-full h-9 px-3 text-sm border border-zinc-200 rounded-md bg-white placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent"
          />
        </div>
      </div>

      {/* Notes — full width */}
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-zinc-500 uppercase tracking-wide">Notes</label>
        <textarea rows={4} value={form.notes ?? ''}
          onChange={(e) => set('notes', e.target.value || null)}
          placeholder="Internal notes about this founder..."
          className="w-full px-3 py-2 text-sm border border-zinc-200 rounded-md bg-white resize-none placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent"
        />
      </div>

      <div className="flex items-center gap-3">
        <button onClick={handleSave} disabled={saving || !form.full_name.trim() || !form.email.trim()}
          className="h-8 px-4 text-xs font-medium text-white bg-[#1a23bd] rounded-md hover:bg-[#151c9a] disabled:opacity-40 transition-colors"
        >
          {saving ? 'Saving…' : 'Save changes'}
        </button>
        <button onClick={handleCancel} disabled={saving}
          className="text-xs text-zinc-400 hover:text-zinc-700 transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}