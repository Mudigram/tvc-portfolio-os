'use client'
// ─────────────────────────────────────────────────────────────
// ExposureEditForm — inline edit panel for one exposure row
// Rendered inside ExposureTable when the user clicks Edit.
// Slides open below the row, saves via server action.
// ─────────────────────────────────────────────────────────────

import { useState, useEffect, useTransition } from 'react'
import { updateExposureRow, getExposureAngelLinkAction } from '../actions/exposure.actions'
import { getRegisteredAngelUsersAction } from '@/features/settings/actions/settings.actions'
import type { ExposureRow, ExposureType, ExposureStatus } from '../types'
import { FormSelect } from '@/components/ui/form-select'
import { Button } from '@/components/ui/button'

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
  row: ExposureRow
  companyId: string
  onClose: () => void
  onSaved: () => void
}

export function ExposureEditForm({ row, companyId, onClose, onSaved }: Props) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [angelUsers, setAngelUsers] = useState<{ id: string; email: string; name?: string }[]>([])
  const [selectedAngelId, setSelectedAngelId] = useState<string>('')
  const [loadingAngel, setLoadingAngel] = useState(true)

  useEffect(() => {
    let active = true
    async function loadAngelData() {
      try {
        const [angels, linkedId] = await Promise.all([
          getRegisteredAngelUsersAction(),
          getExposureAngelLinkAction(row.id),
        ])
        if (active) {
          setAngelUsers(angels)
          if (linkedId) {
            setSelectedAngelId(linkedId)
          }
        }
      } catch (err) {
        console.error('[ExposureEditForm] error loading angel link data:', err)
      } finally {
        if (active) setLoadingAngel(false)
      }
    }
    loadAngelData()
    return () => {
      active = false
    }
  }, [row.id])

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const formData = new FormData(e.currentTarget)

    startTransition(async () => {
      const result = await updateExposureRow(row.id, companyId, formData)
      if (result.success) {
        onSaved()
      } else {
        setError(result.error ?? 'Save failed. Please try again.')
      }
    })
  }

  return (
    <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-5 space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-zinc-900">
            Edit exposure — {row.holder_name}
          </p>
          <p className="text-xs text-zinc-400 mt-0.5">
            Changes will revalidate the exposure page and this company view.
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

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-2 gap-x-5 gap-y-4 sm:grid-cols-3 lg:grid-cols-4">

          <Field label="Instrument type">
            <FormSelect
              name="exposure_type"
              defaultValue={row.exposure_type}
            >
              {EXPOSURE_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </FormSelect>
          </Field>

          <Field label="Instrument name">
            <input
              type="text"
              name="instrument_name"
              defaultValue={row.instrument_name ?? ''}
              placeholder="e.g. Series A Preferred"
              className={inputClass}
            />
          </Field>

          <Field label="Issue date">
            <input
              type="date"
              name="issue_date"
              defaultValue={row.issue_date ?? ''}
              className={inputClass}
            />
          </Field>

          <Field label="Amount invested (USD)">
            <input
              type="number"
              name="amount_invested"
              defaultValue={row.amount_invested ?? ''}
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
              defaultValue={row.ownership_pct ?? ''}
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
              defaultValue={row.share_class ?? ''}
              placeholder="e.g. Series A"
              className={inputClass}
            />
          </Field>

          <Field label="Status">
            <FormSelect
              name="status"
              defaultValue={row.status}
            >
              {EXPOSURE_STATUSES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </FormSelect>
          </Field>

          <Field label="Last verified date">
            <input
              type="date"
              name="last_verified_date"
              defaultValue={row.last_verified_date ?? ''}
              className={inputClass}
            />
          </Field>

          {/* Angel Portal Link */}
          <div className="col-span-2 sm:col-span-3 lg:col-span-4 pt-3 border-t border-zinc-200/60">
            <div className="flex flex-col gap-1.5 max-w-md">
              <label className="text-xs font-medium text-zinc-500 uppercase tracking-wide flex items-center justify-between">
                <span>Angel Portal Access (Optional)</span>
                {selectedAngelId && (
                  <span className="text-[10px] text-blue-600 font-semibold lowercase bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                    linked to portal
                  </span>
                )}
              </label>
              <FormSelect
                name="angel_user_id"
                value={selectedAngelId}
                onChange={(e) => setSelectedAngelId(e.target.value)}
                disabled={loadingAngel}
              >
                <option value="">None (Internal TVC only)</option>
                {angelUsers.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name ? `${u.name} (${u.email})` : u.email}
                  </option>
                ))}
              </FormSelect>
              <p className="text-[11px] text-zinc-400">
                Grants this angel investor secure access to view and monitor this holding on their personal portal.
              </p>
            </div>
          </div>

        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 mt-5 pt-4 border-t border-zinc-200">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isPending}
            size="sm"
          >
            {isPending ? 'Saving…' : 'Save changes'}
          </Button>
        </div>
      </form>
    </div>
  )
}