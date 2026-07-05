'use client'
// ─────────────────────────────────────────────────────────────
// ExposureCreateForm — "Add exposure" panel
// ─────────────────────────────────────────────────────────────

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation' // 👈 1. Import the Next.js router
import { createExposureRow } from '../actions/exposure.actions'
import { HolderPicker } from './HolderPicker'
import type { HolderOption } from '../services/holders.service'
import type { ExposureType, ExposureStatus } from '../types'

const EXPOSURE_TYPES: ExposureType[] = [
  'Equity',
  'SAFE',
  'Convertible Note',
  'Option',
  'Warrant',
  'Advisory Equity',
]

const EXPOSURE_STATUSES: ExposureStatus[] = [
  'Active',
  'Converted',
  'Exited',
  'Cancelled',
]

const inputClass =
  'w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 ' +
  'placeholder:text-zinc-400 focus:border-[#1a23bd] focus:outline-none ' +
  'focus:ring-2 focus:ring-[#1a23bd]/20 disabled:bg-zinc-50 disabled:text-zinc-400'

const selectClass =
  'w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 ' +
  'focus:border-[#1a23bd] focus:outline-none focus:ring-2 focus:ring-[#1a23bd]/20'

function Field({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-medium text-zinc-500 uppercase tracking-wide">
        {label}
      </label>
      {children}
    </div>
  )
}

interface Props {
  companyId: string
  holders: HolderOption[]
  tvcHolderIds: string[]
  onClose: () => void
  onSaved: () => void
}

export function ExposureCreateForm({
  companyId,
  holders,
  tvcHolderIds,
  onClose,
  onSaved,
}: Props) {
  const router = useRouter() // 👈 2. Initialize the router
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const formData = new FormData(e.currentTarget)

    startTransition(async () => {
      const result = await createExposureRow(companyId, formData)
      if (result.success) {
        router.refresh() // 👈 3. Revalidate Server Component data cache immediately
        onSaved()
      } else {
        setError(result.error ?? 'Save failed. Please try again.')
      }
    })
  }

  return (
    <div className="bg-blue-50/30 border border-[#1a23bd]/20 rounded-xl p-5 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-zinc-900">
            Add new exposure
          </p>
          <p className="text-xs text-zinc-400 mt-0.5">
            Pick an existing holder or create a new one, then record the instrument.
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="text-xs text-zinc-400 hover:text-zinc-700 transition-colors"
        >
          Cancel
        </button>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* ── Holder picker ─────────────────────────────────── */}
        <Field label="Holder">
          <HolderPicker holders={holders} tvcHolderIds={tvcHolderIds} />
        </Field>

        {/* ── Instrument fields ─────────────────────────────── */}
        <div className="grid grid-cols-2 gap-x-5 gap-y-4 sm:grid-cols-3 lg:grid-cols-4 pt-2 border-t border-zinc-200/60">
          <Field label="Instrument type">
            <select name="exposure_type" className={selectClass} required>
              <option value="">Select type</option>
              {EXPOSURE_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </Field>

          <Field label="Instrument name">
            <input
              type="text"
              name="instrument_name"
              placeholder="e.g. Series A Preferred"
              className={inputClass}
            />
          </Field>

          <Field label="Issue date">
            <input type="date" name="issue_date" className={inputClass} />
          </Field>

          <Field label="Amount invested (USD)">
            <input
              type="number"
              name="amount_invested"
              placeholder="250000"
              min="0"
              step="1"
              className={inputClass}
            />
          </Field>

          <Field label="Ownership (%)">
            <input
              type="number"
              name="ownership_pct"
              placeholder="10.00"
              min="0"
              max="100"
              step="0.001"
              className={inputClass}
            />
          </Field>

          <Field label="Share class">
            <input
              type="text"
              name="share_class"
              placeholder="e.g. Series A"
              className={inputClass}
            />
          </Field>

          <Field label="Status">
            <select name="status" defaultValue="Active" className={selectClass}>
              {EXPOSURE_STATUSES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </Field>

          <Field label="Last verified date">
            <input type="date" name="last_verified_date" className={inputClass} />
          </Field>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-200/60">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isPending}
            className="rounded-lg bg-[#1a23bd] px-5 py-2 text-sm font-medium text-white hover:bg-[#1520a8] disabled:opacity-50 transition-colors"
          >
            {isPending ? 'Saving…' : 'Add exposure'}
          </button>
        </div>
      </form>
    </div>
  )
}