'use client'

import { useState } from 'react'
import { updateCompanyAction } from '@/features/companies/actions/updateCompany.action'
import type { CompanyProfile } from '@/features/companies/types'
import type { UpdateCompanyInput } from '@/features/companies/actions/updateCompany.action'
import { useToast } from '@/hooks/use-toast'

const SECTORS = [
  'Fintech', 'Healthtech', 'Developer Tools', 'Logistics',
  'SaaS / Productivity', 'Edtech', 'E-commerce', 'Climate',
  'Media', 'Other',
]

const STAGES = [
  'Pre-Idea', 'Pre-Seed', 'Seed', 'Series A', 'Series B', 'Growth',
]

interface CompanyIdentityEditFormProps {
  company: CompanyProfile
}

export function CompanyIdentityEditForm({ company }: CompanyIdentityEditFormProps) {
  const { toast } = useToast()
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [form, setForm] = useState<UpdateCompanyInput>({
    name: company.name,
    sector: company.sector,
    stage: company.stage,
    country: company.country,
    website: company.website,
    legal_entity: company.legal_entity,
  })

  function set(field: keyof UpdateCompanyInput, value: string | number | null) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSave() {
    setSaving(true)
    setError(null)

    const result = await updateCompanyAction(company.id, form)

    if (!result.success) {
      const errMsg = result.error ?? 'Something went wrong.'
      setError(errMsg)
      toast({
        title: 'Error saving changes',
        description: errMsg,
        type: 'error',
      })
    } else {
      toast({
        title: 'Changes saved',
        description: 'Company identity details have been updated.',
        type: 'success',
      })
      setEditing(false)
    }

    setSaving(false)
  }

  function handleCancel() {
    setForm({
      name: company.name,
      sector: company.sector,
      stage: company.stage,
      country: company.country,
      website: company.website,
      legal_entity: company.legal_entity,
    })
    setEditing(false)
    setError(null)
  }

  // ── Display mode ──────────────────────────────────────────────────────────
  if (!editing) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-x-8 gap-y-6">
          {[
            { label: 'Stage',   value: company.stage },
            { label: 'Sector',  value: company.sector },
            { label: 'Country', value: company.country },
            { label: 'Legal Entity', value: company.legal_entity },
            {
              label: 'Website',
              value: company.website ? (
                <a // 🟢 Fixed the missing opening anchor tag here
                  href={company.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-zinc-800 underline underline-offset-2 hover:text-zinc-600"
                >
                  {company.website.replace(/^https?:\/\//, '')}
                </a>
              ) : null,
            },
          ].map(({ label, value }) => (
            <div key={label} className="space-y-0.5">
              <p className="text-xs font-medium text-zinc-400 uppercase tracking-wide">{label}</p>
              <div className="text-sm text-zinc-800">{value ?? '—'}</div>
            </div>
          ))}
        </div>
        <button
          onClick={() => setEditing(true)}
          className="text-xs text-zinc-400 hover:text-zinc-700 underline underline-offset-2 transition-colors"
        >
          Edit company details
        </button>
      </div>
    )
  }

  // ── Edit mode ─────────────────────────────────────────────────────────────
  return (
    <div className="border border-zinc-100 rounded-lg p-5 space-y-4 bg-zinc-50">

      {error && <p className="text-xs text-red-600">{error}</p>}

      {/* Name */}
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-zinc-500 uppercase tracking-wide">
          Company name <span className="text-red-400">*</span>
        </label>
        <input
          type="text"
          value={form.name}
          onChange={(e) => set('name', e.target.value)}
          className="
            w-full h-9 px-3 text-sm text-zinc-900 bg-white
            border border-zinc-200 rounded-md
            focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent
          "
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Sector */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-zinc-500 uppercase tracking-wide">Sector</label>
          <select
            value={form.sector ?? ''}
            onChange={(e) => set('sector', e.target.value || null)}
            className="w-full h-9 px-3 text-sm text-zinc-600 bg-white border border-zinc-200 rounded-md focus:outline-none focus:ring-2 focus:ring-zinc-900"
          >
            <option value="">Select sector</option>
            {SECTORS.map((s) => <option key={s}>{s}</option>)}
          </select>
        </div>

        {/* Stage */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-zinc-500 uppercase tracking-wide">Stage</label>
          <select
            value={form.stage ?? ''}
            onChange={(e) => set('stage', e.target.value || null)}
            className="w-full h-9 px-3 text-sm text-zinc-600 bg-white border border-zinc-200 rounded-md focus:outline-none focus:ring-2 focus:ring-zinc-900"
          >
            <option value="">Select stage</option>
            {STAGES.map((s) => <option key={s}>{s}</option>)}
          </select>
        </div>

        {/* Country */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-zinc-500 uppercase tracking-wide">Country</label>
          <input
            type="text"
            value={form.country ?? ''}
            onChange={(e) => set('country', e.target.value || null)}
            placeholder="e.g. Nigeria"
            className="
              w-full h-9 px-3 text-sm text-zinc-900 bg-white
              border border-zinc-200 rounded-md placeholder:text-zinc-400
              focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent
            "
          />
        </div>

        {/* Founded year */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-zinc-500 uppercase tracking-wide">Founded year</label>
          <input
            type="number"
            value={form.legal_entity ?? ''}
            onChange={(e) =>
              set('legal_entity', e.target.value ? parseInt(e.target.value) : null)
            }
            placeholder="e.g. 2021"
            min={1900}
            max={new Date().getFullYear()}
            className="
              w-full h-9 px-3 text-sm text-zinc-900 bg-white
              border border-zinc-200 rounded-md placeholder:text-zinc-400
              focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent
            "
          />
        </div>
      </div>

      {/* Website */}
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-zinc-500 uppercase tracking-wide">Website</label>
        <input
          type="url"
          value={form.website ?? ''}
          onChange={(e) => set('website', e.target.value || null)}
          placeholder="https://example.com"
          className="
            w-full h-9 px-3 text-sm text-zinc-900 bg-white
            border border-zinc-200 rounded-md placeholder:text-zinc-400
            focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent
          "
        />
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 pt-1">
        <button
          onClick={handleSave}
          disabled={saving || !form.name.trim()}
          className="
            h-8 px-4 text-xs font-medium text-white bg-[#1a23bd]
            rounded-md hover:bg-[#151c9a] disabled:opacity-40 transition-colors
          "
        >
          {saving ? 'Saving…' : 'Save changes'}
        </button>
        <button
          onClick={handleCancel}
          disabled={saving}
          className="text-xs text-zinc-400 hover:text-zinc-700 transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}