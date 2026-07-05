'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  createFounderAction,
  type CreateFounderInput,
} from '@/features/founders/actions/createFounder.action'
import { useToast } from '@/hooks/use-toast'

const INDUSTRIES = [
  'Fintech', 'Healthtech', 'Developer Tools', 'Logistics',
  'SaaS / Productivity', 'Edtech', 'E-commerce', 'Climate', 'Media', 'Other',
]

const STAGES = ['Pre-Idea', 'Pre-Seed', 'Seed', 'Series A', 'Series B', 'Growth']

interface AddFounderFormProps {
  onClose: () => void
}

export function AddFounderForm({ onClose }: AddFounderFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [form, setForm] = useState<CreateFounderInput>({
    full_name: '',
    email: '',
    startup_name: null,
    phone: null,
    industry: null,
    stage: null,
    city: null,
    country: null,
    linkedin_url: null,
  })

  function set(field: keyof CreateFounderInput, value: string | null) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSubmit() {
    setSaving(true)
    setError(null)
    const result = await createFounderAction(form)
    if (!result.success) {
      const errMsg = result.error ?? 'Something went wrong.'
      setError(errMsg)
      toast({ title: 'Error adding founder', description: errMsg, type: 'error' })
      setSaving(false)
      return
    }
    toast({
      title: 'Founder added',
      description: `${form.full_name} has been added to the CRM.`,
      type: 'success',
    })
    onClose()
    router.push(`/founders/${result.id}`)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20">
      <div className="bg-white rounded-xl border border-zinc-100 shadow-lg w-full max-w-lg mx-4">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-zinc-100">
          <h2 className="text-sm font-medium text-zinc-900">Add founder</h2>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-700 transition-colors text-lg leading-none"
          >
            ×
          </button>
        </div>

        {/* Form */}
        <div className="px-6 py-5 space-y-4 max-h-[70vh] overflow-y-auto">
          {error && <p className="text-xs text-red-600">{error}</p>}

          <div className="grid grid-cols-2 gap-4">

            {/* Full name */}
            <div className="space-y-1.5 col-span-2">
              <label className="text-xs font-medium text-zinc-500 uppercase tracking-wide">
                Full name <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={form.full_name}
                onChange={(e) => set('full_name', e.target.value)}
                placeholder="e.g. Ade Okonkwo"
                className="w-full h-9 px-3 text-sm text-zinc-900 bg-white border border-zinc-200 rounded-md placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent"
              />
            </div>

            {/* Email */}
            <div className="space-y-1.5 col-span-2">
              <label className="text-xs font-medium text-zinc-500 uppercase tracking-wide">
                Email <span className="text-red-400">*</span>
              </label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => set('email', e.target.value)}
                placeholder="e.g. ade@startup.com"
                className="w-full h-9 px-3 text-sm text-zinc-900 bg-white border border-zinc-200 rounded-md placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent"
              />
            </div>

            {/* Startup name */}
            <div className="space-y-1.5 col-span-2">
              <label className="text-xs font-medium text-zinc-500 uppercase tracking-wide">
                Startup name
              </label>
              <input
                type="text"
                value={form.startup_name ?? ''}
                onChange={(e) => set('startup_name', e.target.value || null)}
                placeholder="e.g. Payflux"
                className="w-full h-9 px-3 text-sm text-zinc-900 bg-white border border-zinc-200 rounded-md placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent"
              />
            </div>

            {/* Phone */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-500 uppercase tracking-wide">
                Phone
              </label>
              <input
                type="text"
                value={form.phone ?? ''}
                onChange={(e) => set('phone', e.target.value || null)}
                placeholder="+234 801 234 5678"
                className="w-full h-9 px-3 text-sm text-zinc-900 bg-white border border-zinc-200 rounded-md placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent"
              />
            </div>

            {/* LinkedIn */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-500 uppercase tracking-wide">
                LinkedIn
              </label>
              <input
                type="url"
                value={form.linkedin_url ?? ''}
                onChange={(e) => set('linkedin_url', e.target.value || null)}
                placeholder="https://linkedin.com/in/..."
                className="w-full h-9 px-3 text-sm text-zinc-900 bg-white border border-zinc-200 rounded-md placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent"
              />
            </div>

            {/* Industry */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-500 uppercase tracking-wide">
                Industry
              </label>
              <select
                value={form.industry ?? ''}
                onChange={(e) => set('industry', e.target.value || null)}
                className="w-full h-9 px-3 text-sm text-zinc-600 bg-white border border-zinc-200 rounded-md focus:outline-none focus:ring-2 focus:ring-zinc-900"
              >
                <option value="">Select industry</option>
                {INDUSTRIES.map((i) => <option key={i}>{i}</option>)}
              </select>
            </div>

            {/* Stage */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-500 uppercase tracking-wide">
                Stage
              </label>
              <select
                value={form.stage ?? ''}
                onChange={(e) => set('stage', e.target.value || null)}
                className="w-full h-9 px-3 text-sm text-zinc-600 bg-white border border-zinc-200 rounded-md focus:outline-none focus:ring-2 focus:ring-zinc-900"
              >
                <option value="">Select stage</option>
                {STAGES.map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>

            {/* City */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-500 uppercase tracking-wide">
                City
              </label>
              <input
                type="text"
                value={form.city ?? ''}
                onChange={(e) => set('city', e.target.value || null)}
                placeholder="e.g. Lagos"
                className="w-full h-9 px-3 text-sm text-zinc-900 bg-white border border-zinc-200 rounded-md placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent"
              />
            </div>

            {/* Country */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-500 uppercase tracking-wide">
                Country
              </label>
              <input
                type="text"
                value={form.country ?? ''}
                onChange={(e) => set('country', e.target.value || null)}
                placeholder="e.g. Nigeria"
                className="w-full h-9 px-3 text-sm text-zinc-900 bg-white border border-zinc-200 rounded-md placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent"
              />
            </div>

          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-zinc-100">
          <button
            onClick={onClose}
            className="text-xs text-zinc-400 hover:text-zinc-700 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving || !form.full_name.trim() || !form.email.trim()}
            className="h-8 px-4 text-xs font-medium text-white bg-[#1a23bd] rounded-md hover:bg-[#151c9a] disabled:opacity-40 transition-colors"
          >
            {saving ? 'Creating…' : 'Add founder'}
          </button>
        </div>

      </div>
    </div>
  )
}