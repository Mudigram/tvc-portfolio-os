'use client'

import { useState } from 'react'
import { updateCompanyAction } from '@/features/companies/actions/updateCompany.action'
import type { CompanyProfile } from '@/features/companies/types'
import type { UpdateCompanyInput } from '@/features/companies/actions/updateCompany.action'
import { useToast } from '@/hooks/use-toast'
import { FormSelect } from '@/components/ui/form-select'
import { CompanyLogoUpload } from './CompanyLogoUpload'
import { FigureDocumentSection } from './FigureDocumentSection'

const SECTORS = [
  'Fintech', 'Healthtech', 'Developer Tools', 'Logistics',
  'SaaS / Productivity', 'Edtech', 'E-commerce', 'Climate',
  'Media', 'Other',
]

const STAGES = [
  'Pre-Idea', 'Pre-Seed', 'Seed', 'Series A', 'Series B', 'Growth',
]

const INSTRUMENTS = [
  'SAFE', 'Equity', 'Convertible Note', 'Advisory Equity', 'Option', 'Warrant', 'Other'
]

const CURRENCIES = ['USD', 'NGN', 'GBP', 'EUR']

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
    logo_url: company.logo_url,
    bio: company.bio,
    investment_date: company.investment_date,
    instrument_type: company.instrument_type,
    amount_invested: company.amount_invested,
    currency: company.currency || 'USD',
    syndicate_holdings: company.syndicate_holdings,
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
      logo_url: company.logo_url,
      bio: company.bio,
      investment_date: company.investment_date,
      instrument_type: company.instrument_type,
      amount_invested: company.amount_invested,
      currency: company.currency || 'USD',
      syndicate_holdings: company.syndicate_holdings,
    })
    setEditing(false)
    setError(null)
  }

  const docs = company.figure_documents || []

  // ── Display mode ──────────────────────────────────────────────────────────
  if (!editing) {
    return (
      <div className="space-y-8">
        {/* Identity & Legal Attributes Grid */}
        <div className="space-y-3">
          <h4 className="text-xs font-semibold text-zinc-900 uppercase tracking-wide">
            General Identity & Legal
          </h4>
          <div className="grid grid-cols-2 gap-x-8 gap-y-6">
            {[
              { label: 'Stage', value: company.stage },
              { label: 'Sector', value: company.sector },
              { label: 'Country', value: company.country },
              { label: 'Legal Entity / Founded', value: company.legal_entity },
              {
                label: 'Website',
                value: company.website ? (
                  <a
                    href={company.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-zinc-800 underline underline-offset-2 hover:text-[#1a23bd]"
                  >
                    {company.website.replace(/^https?:\/\//, '')}
                  </a>
                ) : null,
              },
            ].map(({ label, value }) => (
              <div key={label} className="space-y-0.5">
                <p className="text-xs font-medium text-zinc-400 uppercase tracking-wide">{label}</p>
                <div className="text-sm text-zinc-800 font-medium">{value ?? '—'}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="border-t border-zinc-100" />

        {/* Core Financial & Economic Exposure Identity */}
        <div className="space-y-6">
          <h4 className="text-xs font-semibold text-zinc-900 uppercase tracking-wide">
            Initial Investment & Deal Identity
          </h4>

          {/* Amount Invested */}
          <div className="p-4 rounded-lg bg-white border border-zinc-100 shadow-sm space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-zinc-400 uppercase tracking-wide">
                Amount Invested
              </span>
              <span className="text-base font-bold text-zinc-900">
                {company.amount_invested != null
                  ? `${company.currency || 'USD'} ${company.amount_invested.toLocaleString()}`
                  : '—'}
              </span>
            </div>
            <FigureDocumentSection
              companyId={company.id}
              figureKey="amount_invested"
              figureLabel="Amount Invested"
              documents={docs}
            />
          </div>

          {/* Instrument Type */}
          <div className="p-4 rounded-lg bg-white border border-zinc-100 shadow-sm space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-zinc-400 uppercase tracking-wide">
                Instrument Type
              </span>
              <span className="text-sm font-semibold text-zinc-800">
                {company.instrument_type || '—'}
              </span>
            </div>
            <FigureDocumentSection
              companyId={company.id}
              figureKey="instrument_type"
              figureLabel="Instrument Type"
              documents={docs}
            />
          </div>

          {/* Investment Date */}
          <div className="p-4 rounded-lg bg-white border border-zinc-100 shadow-sm space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-zinc-400 uppercase tracking-wide">
                Investment Date
              </span>
              <span className="text-sm font-semibold text-zinc-800">
                {company.investment_date
                  ? new Date(company.investment_date).toLocaleDateString('en-GB', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })
                  : '—'}
              </span>
            </div>
            <FigureDocumentSection
              companyId={company.id}
              figureKey="investment_date"
              figureLabel="Investment Date"
              documents={docs}
            />
          </div>

          {/* Syndicate Holdings */}
          <div className="p-4 rounded-lg bg-white border border-zinc-100 shadow-sm space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-zinc-400 uppercase tracking-wide">
                Syndicate Holdings
              </span>
              <span className="text-sm font-medium text-zinc-800">
                {company.syndicate_holdings || '—'}
              </span>
            </div>
            <FigureDocumentSection
              companyId={company.id}
              figureKey="syndicate_holdings"
              figureLabel="Syndicate Holdings"
              documents={docs}
            />
          </div>
        </div>

        <button
          id="company-identity-edit-trigger"
          onClick={() => setEditing(true)}
          className="sr-only"
          aria-hidden="true"
          tabIndex={-1}
        >
          Edit
        </button>
      </div>
    )
  }

  // ── Edit mode ─────────────────────────────────────────────────────────────
  return (
    <div className="border border-zinc-100 rounded-lg p-5 space-y-5 bg-zinc-50">
      {error && <p className="text-xs text-red-600 font-medium">{error}</p>}

      <h3 className="text-xs font-semibold text-zinc-900 uppercase tracking-wide">
        Edit Company Identity Parameters
      </h3>

      {/* Name */}
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-zinc-500 uppercase tracking-wide">
          Company name <span className="text-red-400">*</span>
        </label>
        <input
          type="text"
          value={form.name}
          onChange={(e) => set('name', e.target.value)}
          className="w-full h-9 px-3 text-sm text-zinc-900 bg-white border border-zinc-200 rounded-md focus:outline-none focus:ring-2 focus:ring-zinc-900"
        />
      </div>

      {/* Bio */}
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-zinc-500 uppercase tracking-wide">
          Company Bio / Summary
        </label>
        <textarea
          rows={3}
          value={form.bio ?? ''}
          onChange={(e) => set('bio', e.target.value || null)}
          placeholder="Brief description of business model, vision, and market..."
          className="w-full p-3 text-xs text-zinc-900 bg-white border border-zinc-200 rounded-md focus:outline-none focus:ring-2 focus:ring-zinc-900"
        />
      </div>

      {/* Company Logo Upload */}
      <div className="space-y-1.5 p-4 rounded-lg bg-zinc-50 border border-zinc-200/80">
        <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wide block">
          Company Logo
        </label>
        <div className="flex items-center gap-4">
          <CompanyLogoUpload
            companyId={company.id}
            companyName={company.name}
            currentLogoPath={company.logo_path}
            currentLogoUrl={form.logo_url}
            onUploadSuccess={(newUrl) => {
              set('logo_url', newUrl)
            }}
            size="sm"
          />
          <p className="text-xs text-zinc-400 leading-relaxed">
            Upload or replace official logo. Accepts PNG, JPEG, WebP, or SVG (max 2MB).
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Sector */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-zinc-500 uppercase tracking-wide">Sector</label>
          <FormSelect
            value={form.sector ?? ''}
            onChange={(e) => set('sector', e.target.value || null)}
          >
            <option value="">Select sector</option>
            {SECTORS.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </FormSelect>
        </div>

        {/* Stage */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-zinc-500 uppercase tracking-wide">Stage</label>
          <FormSelect
            value={form.stage ?? ''}
            onChange={(e) => set('stage', e.target.value || null)}
          >
            <option value="">Select stage</option>
            {STAGES.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </FormSelect>
        </div>

        {/* Country */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-zinc-500 uppercase tracking-wide">Country</label>
          <input
            type="text"
            value={form.country ?? ''}
            onChange={(e) => set('country', e.target.value || null)}
            placeholder="e.g. Nigeria"
            className="w-full h-9 px-3 text-sm text-zinc-900 bg-white border border-zinc-200 rounded-md focus:outline-none focus:ring-2 focus:ring-zinc-900"
          />
        </div>

        {/* Legal Entity / Founded */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-zinc-500 uppercase tracking-wide">
            Legal Entity / Year
          </label>
          <input
            type="text"
            value={form.legal_entity ?? ''}
            onChange={(e) => set('legal_entity', e.target.value || null)}
            placeholder="e.g. Crediometer Ltd (2022)"
            className="w-full h-9 px-3 text-sm text-zinc-900 bg-white border border-zinc-200 rounded-md focus:outline-none focus:ring-2 focus:ring-zinc-900"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Amount Invested */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-zinc-500 uppercase tracking-wide">
            Amount Invested
          </label>
          <input
            type="number"
            value={form.amount_invested ?? ''}
            onChange={(e) =>
              set('amount_invested', e.target.value ? parseFloat(e.target.value) : null)
            }
            placeholder="e.g. 50000"
            className="w-full h-9 px-3 text-sm text-zinc-900 bg-white border border-zinc-200 rounded-md focus:outline-none focus:ring-2 focus:ring-zinc-900"
          />
        </div>

        {/* Currency */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-zinc-500 uppercase tracking-wide">Currency</label>
          <FormSelect
            value={form.currency ?? 'USD'}
            onChange={(e) => set('currency', e.target.value || 'USD')}
          >
            {CURRENCIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </FormSelect>
        </div>

        {/* Instrument Type */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-zinc-500 uppercase tracking-wide">
            Instrument Type
          </label>
          <FormSelect
            value={form.instrument_type ?? ''}
            onChange={(e) => set('instrument_type', e.target.value || null)}
          >
            <option value="">Select Instrument</option>
            {INSTRUMENTS.map((inst) => (
              <option key={inst}>{inst}</option>
            ))}
          </FormSelect>
        </div>

        {/* Investment Date */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-zinc-500 uppercase tracking-wide">
            Investment Date
          </label>
          <input
            type="date"
            value={form.investment_date ?? ''}
            onChange={(e) => set('investment_date', e.target.value || null)}
            className="w-full h-9 px-3 text-sm text-zinc-900 bg-white border border-zinc-200 rounded-md focus:outline-none focus:ring-2 focus:ring-zinc-900"
          />
        </div>
      </div>

      {/* Syndicate Holdings */}
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-zinc-500 uppercase tracking-wide">
          Syndicate Holdings & Structure
        </label>
        <input
          type="text"
          value={form.syndicate_holdings ?? ''}
          onChange={(e) => set('syndicate_holdings', e.target.value || null)}
          placeholder="e.g. TVCLabs Syndicate A (15% share)"
          className="w-full h-9 px-3 text-sm text-zinc-900 bg-white border border-zinc-200 rounded-md focus:outline-none focus:ring-2 focus:ring-zinc-900"
        />
      </div>

      {/* Website */}
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-zinc-500 uppercase tracking-wide">Website</label>
        <input
          type="url"
          value={form.website ?? ''}
          onChange={(e) => set('website', e.target.value || null)}
          placeholder="https://example.com"
          className="w-full h-9 px-3 text-sm text-zinc-900 bg-white border border-zinc-200 rounded-md focus:outline-none focus:ring-2 focus:ring-zinc-900"
        />
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 pt-2 border-t border-zinc-200">
        <button
          onClick={handleSave}
          disabled={saving || !form.name.trim()}
          className="h-8 px-4 text-xs font-medium text-white bg-[#1a23bd] rounded-md hover:bg-[#151c9a] disabled:opacity-40 transition-colors"
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