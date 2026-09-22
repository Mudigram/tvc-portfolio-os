'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createCompanyAction } from '@/features/companies/actions/createCompany.action'
import type { CreateCompanyInput } from '@/features/companies/actions/createCompany.action'
import { FormSelect } from '@/components/ui/form-select'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useToast } from '@/hooks/use-toast'

const SECTORS = [
  'Fintech', 'Healthtech', 'Developer Tools', 'Logistics',
  'SaaS / Productivity', 'Edtech', 'E-commerce', 'Climate',
  'Media', 'Other',
]

const STAGES = [
  'Pre-Idea', 'Pre-Seed', 'Seed', 'Series A', 'Series B', 'Growth',
]

interface AddCompanyFormProps {
  onClose: () => void
}

export function AddCompanyForm({ onClose }: AddCompanyFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [form, setForm] = useState<CreateCompanyInput>({
    name: '',
    sector: '',
    stage: '',
    country: '',
    website: '',
    founded_year: null,
  })

  function set(field: keyof CreateCompanyInput, value: string | number | null) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSubmit() {
    setSaving(true)
    setError(null)

    const result = await createCompanyAction(form)

    if (!result.success) {
      const errMsg = result.error ?? 'Something went wrong.'
      setError(errMsg)
      toast({
        title: 'Error creating company',
        description: errMsg,
        type: 'error',
      })
      setSaving(false)
      return
    }

    toast({
      title: 'Company created successfully',
      description: `${form.name} has been added to the portfolio.`,
      type: 'success',
    })
    onClose()
    router.push(`/companies/${result.id}`)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20">
      <div className="bg-white rounded-xl border border-zinc-100 shadow-lg w-full max-w-lg mx-4">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-zinc-100">
          <h2 className="text-sm font-medium text-zinc-900">Add company</h2>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-700 transition-colors text-lg leading-none"
          >
            ×
          </button>
        </div>

        {/* Form */}
        <div className="px-6 py-5 space-y-4">
          {error && (
            <p className="text-xs text-red-600">{error}</p>
          )}

          {/* Name — required */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-zinc-500 uppercase tracking-wide">
              Company name <span className="text-red-400">*</span>
            </label>
            <Input
              type="text"
              value={form.name}
              onChange={(e) => set('name', e.target.value)}
              placeholder="e.g. Payflux"
            />
          </div>

          {/* Sector + Stage — side by side */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-500 uppercase tracking-wide">
                Sector
              </label>
              <FormSelect
                value={form.sector}
                onChange={(e) => set('sector', e.target.value)}
              >
                <option value="">Select sector</option>
                {SECTORS.map((s) => <option key={s}>{s}</option>)}
              </FormSelect>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-500 uppercase tracking-wide">
                Stage
              </label>
              <FormSelect
                value={form.stage}
                onChange={(e) => set('stage', e.target.value)}
              >
                <option value="">Select stage</option>
                {STAGES.map((s) => <option key={s}>{s}</option>)}
              </FormSelect>
            </div>
          </div>

          {/* Country + Founded year — side by side */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-500 uppercase tracking-wide">
                Country
              </label>
              <Input
                type="text"
                value={form.country}
                onChange={(e) => set('country', e.target.value)}
                placeholder="e.g. Nigeria"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-500 uppercase tracking-wide">
                Founded year
              </label>
              <Input
                type="number"
                value={form.founded_year ?? ''}
                onChange={(e) =>
                  set('founded_year', e.target.value ? parseInt(e.target.value) : null)
                }
                placeholder="e.g. 2021"
                min={1900}
                max={new Date().getFullYear()}
              />
            </div>
          </div>

          {/* Website */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-zinc-500 uppercase tracking-wide">
              Website
            </label>
            <Input
              type="url"
              value={form.website}
              onChange={(e) => set('website', e.target.value)}
              placeholder="https://example.com"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-zinc-100">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={saving || !form.name.trim()}
            size="sm"
          >
            {saving ? 'Creating…' : 'Create company'}
          </Button>
        </div>

      </div>
    </div>
  )
}