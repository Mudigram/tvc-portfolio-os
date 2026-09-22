'use client'

import { useState } from 'react'
import { updateFounderAction } from '@/features/founders/actions/updateFounder.action'
import type { Founder, UpdateFounderInput } from '@/features/founders/types'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { FormSelect } from '@/components/ui/form-select'

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
          <Input
            type="text"
            value={form.full_name}
            onChange={(e) => set('full_name', e.target.value)}
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-zinc-500 uppercase tracking-wide">
            Email <span className="text-red-400">*</span>
          </label>
          <Input
            type="email"
            value={form.email}
            onChange={(e) => set('email', e.target.value)}
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-zinc-500 uppercase tracking-wide">Phone</label>
          <Input
            type="text"
            value={form.phone ?? ''}
            onChange={(e) => set('phone', e.target.value || null)}
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-zinc-500 uppercase tracking-wide">Startup name</label>
          <Input
            type="text"
            value={form.startup_name ?? ''}
            onChange={(e) => set('startup_name', e.target.value || null)}
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-zinc-500 uppercase tracking-wide">Industry</label>
          <FormSelect
            value={form.industry ?? ''}
            onChange={(e) => set('industry', e.target.value || null)}
          >
            <option value="">Select industry</option>
            {INDUSTRIES.map((i) => <option key={i}>{i}</option>)}
          </FormSelect>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-zinc-500 uppercase tracking-wide">Stage</label>
          <FormSelect
            value={form.stage ?? ''}
            onChange={(e) => set('stage', e.target.value || null)}
          >
            <option value="">Select stage</option>
            {STAGES.map((s) => <option key={s}>{s}</option>)}
          </FormSelect>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-zinc-500 uppercase tracking-wide">City</label>
          <Input
            type="text"
            value={form.city ?? ''}
            onChange={(e) => set('city', e.target.value || null)}
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-zinc-500 uppercase tracking-wide">Country</label>
          <Input
            type="text"
            value={form.country ?? ''}
            onChange={(e) => set('country', e.target.value || null)}
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-zinc-500 uppercase tracking-wide">DDR status</label>
          <FormSelect
            value={form.ddr_status ?? ''}
            onChange={(e) => set('ddr_status', e.target.value || null)}
          >
            <option value="">Select status</option>
            {DDR_STATUSES.map((s) => <option key={s}>{s}</option>)}
          </FormSelect>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-zinc-500 uppercase tracking-wide">LinkedIn URL</label>
          <Input
            type="url"
            value={form.linkedin_url ?? ''}
            onChange={(e) => set('linkedin_url', e.target.value || null)}
            placeholder="https://linkedin.com/in/..."
          />
        </div>
      </div>

      {/* Notes — full width */}
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-zinc-500 uppercase tracking-wide">Notes</label>
        <Textarea
          rows={4}
          value={form.notes ?? ''}
          onChange={(e) => set('notes', e.target.value || null)}
          placeholder="Internal notes about this founder..."
        />
      </div>

      <div className="flex items-center gap-3">
        <Button onClick={handleSave} disabled={saving || !form.full_name.trim() || !form.email.trim()} size="sm">
          {saving ? 'Saving…' : 'Save changes'}
        </Button>
        <Button variant="ghost" size="sm" onClick={handleCancel} disabled={saving}>
          Cancel
        </Button>
      </div>
    </div>
  )
}