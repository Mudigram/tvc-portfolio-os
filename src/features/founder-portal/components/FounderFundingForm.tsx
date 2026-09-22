'use client'

import { useState } from 'react'
import { updateFundingAction } from '@/features/founder-portal/actions/updateFunding.action'
import type { FundingStatus, UpdateFundingInput } from '@/features/founder-portal/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { FormSelect } from '@/components/ui/form-select'

const MATERIALS_STATUSES = ['Not started', 'In progress', 'Ready to share']
const LEAD_STATUSES = ['Not identified', 'In discussion', 'Soft circled', 'Confirmed']

function formatCurrency(n: number | null): string {
  if (!n) return '—'
  return new Intl.NumberFormat('en-US', {
    style: 'currency', currency: 'USD', notation: 'compact', maximumFractionDigits: 1,
  }).format(n)
}

function formatDate(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
  })
}

interface FounderFundingFormProps {
  companyId: string
  current: FundingStatus | null
}

export function FounderFundingForm({ companyId, current }: FounderFundingFormProps) {
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [form, setForm] = useState<UpdateFundingInput>({
    company_id: companyId,
    runway_months: current?.runway_months ?? null,
    current_raise_target: current?.current_raise_target ?? null,
    instrument: current?.instrument ?? null,
    valuation_cap: current?.valuation_cap ?? null,
    lead_investor_status: current?.lead_investor_status ?? null,
    existing_commitments: current?.existing_commitments ?? null,
    followon_opportunity: current?.followon_opportunity ?? false,
    investor_materials_status: current?.investor_materials_status ?? null,
    is_actively_raising: current?.is_actively_raising ?? false,
  })

  function set<K extends keyof UpdateFundingInput>(field: K, value: UpdateFundingInput[K]) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSave() {
    setSaving(true)
    setError(null)
    const result = await updateFundingAction(form)
    if (!result.success) {
      setError(result.error ?? 'Something went wrong.')
    } else {
      setEditing(false)
    }
    setSaving(false)
  }

  function handleCancel() {
    setForm({
      company_id: companyId,
      runway_months: current?.runway_months ?? null,
      current_raise_target: current?.current_raise_target ?? null,
      instrument: current?.instrument ?? null,
      valuation_cap: current?.valuation_cap ?? null,
      lead_investor_status: current?.lead_investor_status ?? null,
      existing_commitments: current?.existing_commitments ?? null,
      followon_opportunity: current?.followon_opportunity ?? false,
      investor_materials_status: current?.investor_materials_status ?? null,
      is_actively_raising: current?.is_actively_raising ?? false,
    })
    setEditing(false)
    setError(null)
  }

  // ── Display mode ──────────────────────────────────────────────────────────
  if (!editing) {
    return (
      <div className="space-y-5">
        <div className="grid grid-cols-2 gap-x-8 gap-y-5">
          <Field label="Actively raising" value={current?.is_actively_raising ? 'Yes' : 'No'} />
          <Field label="Runway" value={current?.runway_months ? `${current.runway_months} months` : '—'} />
          <Field label="Raise target" value={formatCurrency(current?.current_raise_target ?? null)} />
          <Field label="Instrument" value={current?.instrument} />
          <Field label="Valuation cap" value={formatCurrency(current?.valuation_cap ?? null)} />
          <Field label="Lead investor" value={current?.lead_investor_status} />
          <Field label="Existing commitments" value={formatCurrency(current?.existing_commitments ?? null)} />
          <Field label="Follow-on opportunity" value={current?.followon_opportunity ? 'Yes' : 'No'} />
          <Field label="Investor materials" value={current?.investor_materials_status} />
        </div>
        {current?.updated_at && (
          <p className="text-xs text-zinc-300">
            Last updated {formatDate(current.updated_at)}
          </p>
        )}
        <button
          onClick={() => setEditing(true)}
          className="text-xs text-zinc-400 hover:text-zinc-700 underline underline-offset-2 transition-colors"
        >
          Update funding status
        </button>
      </div>
    )
  }

  // ── Edit mode ─────────────────────────────────────────────────────────────
  return (
    <div className="border border-zinc-100 rounded-lg p-5 space-y-5 bg-zinc-50">
      {error && <p className="text-xs text-red-600">{error}</p>}

      {/* Actively raising toggle */}
      <label className="flex items-center gap-2 cursor-pointer w-fit">
        <input
          type="checkbox"
          checked={form.is_actively_raising}
          onChange={(e) => set('is_actively_raising', e.target.checked)}
          className="rounded border-zinc-300"
        />
        <span className="text-sm text-zinc-700">We are currently actively raising</span>
      </label>

      <div className="grid grid-cols-2 gap-4">
        <NumberField label="Runway (months)" value={form.runway_months}
          onChange={(v) => set('runway_months', v)} />
        <NumberField label="Raise target (USD)" value={form.current_raise_target}
          onChange={(v) => set('current_raise_target', v)} />
        <StringField label="Instrument" value={form.instrument}
          onChange={(v) => set('instrument', v)} placeholder="e.g. SAFE, Priced round" />
        <NumberField label="Valuation cap (USD)" value={form.valuation_cap}
          onChange={(v) => set('valuation_cap', v)} />

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-zinc-500 uppercase tracking-wide">
            Lead investor status
          </label>
          <FormSelect
            value={form.lead_investor_status ?? ''}
            onChange={(e) => set('lead_investor_status', e.target.value || null)}
          >
            <option value="">Select status</option>
            {LEAD_STATUSES.map((s) => <option key={s}>{s}</option>)}
          </FormSelect>
        </div>

        <NumberField label="Existing commitments (USD)" value={form.existing_commitments}
          onChange={(v) => set('existing_commitments', v)} />

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-zinc-500 uppercase tracking-wide">
            Investor materials status
          </label>
          <FormSelect
            value={form.investor_materials_status ?? ''}
            onChange={(e) => set('investor_materials_status', e.target.value || null)}
          >
            <option value="">Select status</option>
            {MATERIALS_STATUSES.map((s) => <option key={s}>{s}</option>)}
          </FormSelect>
        </div>
      </div>

      <label className="flex items-center gap-2 cursor-pointer w-fit">
        <input
          type="checkbox"
          checked={form.followon_opportunity}
          onChange={(e) => set('followon_opportunity', e.target.checked)}
          className="rounded border-zinc-300"
        />
        <span className="text-sm text-zinc-700">
          Follow-on opportunity available for TVCLabs or angels
        </span>
      </label>

      <div className="flex items-center gap-3 pt-1">
        <Button
          onClick={handleSave}
          disabled={saving}
          size="sm"
        >
          {saving ? 'Saving…' : 'Save changes'}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleCancel}
          disabled={saving}
        >
          Cancel
        </Button>
      </div>
    </div>
  )
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="space-y-0.5">
      <p className="text-xs font-medium text-zinc-400 uppercase tracking-wide">{label}</p>
      <div className="text-sm text-zinc-800">{value ?? '—'}</div>
    </div>
  )
}

function StringField({ label, value, placeholder, onChange }: {
  label: string; value: string | null; placeholder?: string; onChange: (v: string | null) => void
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-zinc-500 uppercase tracking-wide">{label}</label>
      <Input
        type="text"
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value || null)}
        placeholder={placeholder}
      />
    </div>
  )
}

function NumberField({ label, value, onChange }: {
  label: string; value: number | null; onChange: (v: number | null) => void
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-zinc-500 uppercase tracking-wide">{label}</label>
      <Input
        type="number"
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value ? Number(e.target.value) : null)}
      />
    </div>
  )
}