'use client'
// ─────────────────────────────────────────────────────────────
// Cap Table & Ownership — Client View
// Receives pre-fetched + derived data from the server component.
// Handles: read view, edit mode toggle, form submission.
// ─────────────────────────────────────────────────────────────

import { useState, useTransition } from 'react'
import { saveCapTable } from '../actions/cap-table.actions'
import { CapTableStatusBadge, OwnershipStatusBadge, AlertPill } from './CapTableBadges'
import { formatPct, formatCurrency, isFounderDilutionAlert, isTvcDilutionAlert } from '../utils/derive'
import { INVESTMENT_ROUNDS, CURRENCIES } from '../types'
import type { CapTableOwnershipViewModel } from '../types'
import { FormSelect } from '@/components/ui/form-select'

// ─────────────────────────────────────────────────────────────

interface Props {
  companyId: string
  companyName: string
  data: CapTableOwnershipViewModel | null
  defaultFounderThreshold?: number | null
  defaultTvcThreshold?: number | null
}

// ── Shared label + input layout ───────────────────────────────
function Field({
  label,
  children,
  hint,
}: {
  label: string
  children: React.ReactNode
  hint?: string
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium text-zinc-500 uppercase tracking-wide">
        {label}
      </label>
      {children}
      {hint && <p className="text-xs text-zinc-400">{hint}</p>}
    </div>
  )
}

// ── Static read value ─────────────────────────────────────────
function ReadValue({ value }: { value: React.ReactNode }) {
  return (
    <span className="text-sm text-zinc-900">
      {value ?? <span className="text-zinc-400">—</span>}
    </span>
  )
}

// ── Section heading ───────────────────────────────────────────
function SectionHeading({ title }: { title: string }) {
  return (
    <h3 className="text-xs font-semibold uppercase tracking-widest text-zinc-400 border-b border-zinc-100 pb-2 mb-4">
      {title}
    </h3>
  )
}

// ── Input primitives ──────────────────────────────────────────
const inputClass =
  'w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/20 disabled:bg-zinc-50 disabled:text-zinc-400'

const selectClass =
  'w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/20'

// ─────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────

export default function CapTableClientView({
  companyId,
  companyName,
  data,
  defaultFounderThreshold,
  defaultTvcThreshold,
}: Props) {
  const [editing, setEditing] = useState(data === null) // open in edit if no record yet
  const [isPending, startTransition] = useTransition()
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saveSuccess, setSaveSuccess] = useState(false)

  // ── Form submission ─────────────────────────────────────
  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSaveError(null)
    setSaveSuccess(false)

    const formData = new FormData(e.currentTarget)

    startTransition(async () => {
      const result = await saveCapTable(companyId, formData)
      if (result.success) {
        setSaveSuccess(true)
        setEditing(false)
      } else {
        setSaveError(result.error ?? 'Save failed. Please try again.')
      }
    })
  }

  // ── Alert flags (read mode) ─────────────────────────────
  const alerts: string[] = []
  if (data) {
    if (data.capTableStatus === 'Red') alerts.push('Missing cap table')
    if (data.capTableStatus === 'Amber') alerts.push('Cap table outdated')
    if (isFounderDilutionAlert(data, defaultFounderThreshold)) alerts.push('Founder dilution exceeds threshold')
    if (isTvcDilutionAlert(data, defaultTvcThreshold)) alerts.push('TVC ownership dilution exceeds threshold')
  }

  // ─────────────────────────────────────────────────────────
  // READ VIEW
  // ─────────────────────────────────────────────────────────
  if (!editing) {
    return (
      <div className="space-y-8">

        {/* Header row */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-zinc-900">
              Cap Table & Ownership
            </h2>
            <p className="text-sm text-zinc-500 mt-0.5">{companyName}</p>
          </div>
          <div className="flex items-center gap-3">
            {data && alerts.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {alerts.map((a) => <AlertPill key={a} label={a} />)}
              </div>
            )}
            <button
              onClick={() => setEditing(true)}
              className="rounded-lg bg-[#1a23bd] px-4 py-2 text-sm font-medium text-white hover:bg-[#1520a8] transition-colors"
            >
              {data ? 'Edit' : 'Add data'}
            </button>
          </div>
        </div>

        {saveSuccess && (
          <div className="rounded-lg bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm text-emerald-700">
            Cap table saved successfully.
          </div>
        )}

        {/* No data yet */}
        {!data && (
          <div className="rounded-xl border border-dashed border-zinc-200 bg-zinc-50 px-8 py-16 text-center">
            <p className="text-sm font-medium text-zinc-500">No cap table data recorded yet.</p>
            <p className="text-sm text-zinc-400 mt-1">
              Click &ldquo;Add data&rdquo; to enter ownership information for this company.
            </p>
          </div>
        )}

        {/* Data present */}
        {data && (
          <div className="grid gap-8">

            {/* ── Investment info ─────────────────────────── */}
            <div className="rounded-xl border border-zinc-100 bg-white p-6 shadow-sm">
              <SectionHeading title="Investment" />
              <div className="grid grid-cols-2 gap-x-8 gap-y-5 sm:grid-cols-4">
                <Field label="Date">
                  <ReadValue value={data.investment_date} />
                </Field>
                <Field label="Round">
                  <ReadValue value={data.investment_round} />
                </Field>
                <Field label="Amount invested">
                  <ReadValue
                    value={formatCurrency(data.amount_invested, data.currency)}
                  />
                </Field>
                <Field label="Currency">
                  <ReadValue value={data.currency} />
                </Field>
              </div>
            </div>

            {/* ── Cap table documents ─────────────────────── */}
            <div className="rounded-xl border border-zinc-100 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <SectionHeading title="Documents" />
                <CapTableStatusBadge status={data.capTableStatus} />
              </div>
              <div className="grid grid-cols-1 gap-y-5 sm:grid-cols-2 gap-x-8">
                <Field label="Cap table at investment">
                  {data.cap_table_at_investment_url ? (
                    <a
                      href={data.cap_table_at_investment_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-[#1a23bd] underline underline-offset-2 hover:text-[#1520a8]"
                    >
                      Open document ↗
                    </a>
                  ) : (
                    <ReadValue value={null} />
                  )}
                  {data.cap_table_at_investment_note && (
                    <p className="text-xs text-zinc-400 mt-1">
                      {data.cap_table_at_investment_note}
                    </p>
                  )}
                </Field>
                <Field label="Current cap table">
                  {data.current_cap_table_url ? (
                    <a
                      href={data.current_cap_table_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-[#1a23bd] underline underline-offset-2 hover:text-[#1520a8]"
                    >
                      Open document ↗
                    </a>
                  ) : (
                    <ReadValue value={null} />
                  )}
                  {data.current_cap_table_note && (
                    <p className="text-xs text-zinc-400 mt-1">
                      {data.current_cap_table_note}
                    </p>
                  )}
                </Field>
                <Field label="Last updated">
                  <ReadValue value={data.cap_table_last_updated} />
                </Field>
              </div>
            </div>

            {/* ── Founder ownership ───────────────────────── */}
            <div className="rounded-xl border border-zinc-100 bg-white p-6 shadow-sm">
              <SectionHeading title="Founder ownership" />
              <div className="grid grid-cols-2 gap-x-8 gap-y-5 sm:grid-cols-3">
                <Field label="At investment">
                  <ReadValue
                    value={formatPct(data.founder_ownership_at_investment)}
                  />
                </Field>
                <Field label="Current">
                  <ReadValue
                    value={formatPct(data.current_founder_ownership)}
                  />
                </Field>
                <Field label="Dilution">
                  <div className="flex items-center gap-2">
                    <ReadValue
                      value={
                        data.founderDilution != null
                          ? formatPct(data.founderDilution)
                          : null
                      }
                    />
                    {isFounderDilutionAlert(data) && (
                      <span className="text-xs text-red-600 font-medium">
                        Above threshold
                      </span>
                    )}
                  </div>
                </Field>
              </div>
            </div>

            {/* ── TVC / ARM ownership ─────────────────────── */}
            <div className="rounded-xl border border-zinc-100 bg-white p-6 shadow-sm">
              <SectionHeading title="TVC Labs / TD / ARM ownership" />
              <div className="grid grid-cols-2 gap-x-8 gap-y-5 sm:grid-cols-4">
                <Field label="At investment">
                  <ReadValue
                    value={formatPct(data.tvc_ownership_at_investment)}
                  />
                </Field>
                <Field label="Current">
                  <ReadValue
                    value={formatPct(data.current_tvc_ownership)}
                  />
                </Field>
                <Field label="Change">
                  <ReadValue
                    value={
                      data.tvcOwnershipChange != null
                        ? formatPct(data.tvcOwnershipChange)
                        : null
                    }
                  />
                </Field>
                <Field label="Status">
                  <OwnershipStatusBadge status={data.ownershipStatus} />
                </Field>
              </div>
            </div>

            {/* ── Internal notes ──────────────────────────── */}
            {data.notes && (
              <div className="rounded-xl border border-zinc-100 bg-white p-6 shadow-sm">
                <SectionHeading title="Notes" />
                <p className="text-sm text-zinc-700 whitespace-pre-wrap">
                  {data.notes}
                </p>
              </div>
            )}

          </div>
        )}
      </div>
    )
  }

  // ─────────────────────────────────────────────────────────
  // EDIT / FORM VIEW
  // ─────────────────────────────────────────────────────────
  return (
    <div className="space-y-8">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-zinc-900">
            {data ? 'Edit cap table' : 'Add cap table data'}
          </h2>
          <p className="text-sm text-zinc-500 mt-0.5">{companyName}</p>
        </div>
        {data && (
          <button
            onClick={() => { setEditing(false); setSaveError(null) }}
            className="text-sm text-zinc-500 hover:text-zinc-700"
          >
            Cancel
          </button>
        )}
      </div>

      {saveError && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {saveError}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">

        {/* ── Investment info ─────────────────────────────── */}
        <div className="rounded-xl border border-zinc-100 bg-white p-6 shadow-sm">
          <SectionHeading title="Investment" />
          <div className="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2 lg:grid-cols-4">

            <Field label="Investment date">
              <input
                type="date"
                name="investment_date"
                defaultValue={data?.investment_date ?? ''}
                className={inputClass}
              />
            </Field>

            <Field label="Investment round">
              <FormSelect
                name="investment_round"
                defaultValue={data?.investment_round ?? ''}
              >
                <option value="">Select round</option>
                {INVESTMENT_ROUNDS.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </FormSelect>
            </Field>

            <Field label="Amount invested">
              <input
                type="number"
                name="amount_invested"
                defaultValue={data?.amount_invested ?? ''}
                placeholder="250000"
                min="0"
                step="1"
                className={inputClass}
              />
            </Field>

            <Field label="Currency">
              <FormSelect
                name="currency"
                defaultValue={data?.currency ?? 'USD'}
              >
                {CURRENCIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </FormSelect>
            </Field>

          </div>
        </div>

        {/* ── Cap table documents ──────────────────────────── */}
        <div className="rounded-xl border border-zinc-100 bg-white p-6 shadow-sm">
          <SectionHeading title="Documents" />
          <div className="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2">

            <Field
              label="Cap table at investment (URL)"
              hint="Google Drive, Notion, or Dropbox share link"
            >
              <input
                type="url"
                name="cap_table_at_investment_url"
                defaultValue={data?.cap_table_at_investment_url ?? ''}
                placeholder="https://drive.google.com/..."
                className={inputClass}
              />
            </Field>

            <Field label="Note (at investment)">
              <input
                type="text"
                name="cap_table_at_investment_note"
                defaultValue={data?.cap_table_at_investment_note ?? ''}
                placeholder="e.g. Seed round, pre-ESOP"
                className={inputClass}
              />
            </Field>

            <Field
              label="Current cap table (URL)"
              hint="Google Drive, Notion, or Dropbox share link"
            >
              <input
                type="url"
                name="current_cap_table_url"
                defaultValue={data?.current_cap_table_url ?? ''}
                placeholder="https://drive.google.com/..."
                className={inputClass}
              />
            </Field>

            <Field label="Note (current)">
              <input
                type="text"
                name="current_cap_table_note"
                defaultValue={data?.current_cap_table_note ?? ''}
                placeholder="e.g. Post-Series A, includes ESOP pool"
                className={inputClass}
              />
            </Field>

            <Field label="Cap table last updated">
              <input
                type="date"
                name="cap_table_last_updated"
                defaultValue={data?.cap_table_last_updated ?? ''}
                className={inputClass}
              />
            </Field>

          </div>
        </div>

        {/* ── Founder ownership ────────────────────────────── */}
        <div className="rounded-xl border border-zinc-100 bg-white p-6 shadow-sm">
          <SectionHeading title="Founder ownership" />
          <p className="text-xs text-zinc-400 mb-5">
            Founder dilution is calculated automatically from these two values.
          </p>
          <div className="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2">

            <Field label="At investment (%)">
              <input
                type="number"
                name="founder_ownership_at_investment"
                defaultValue={data?.founder_ownership_at_investment ?? ''}
                placeholder="80.0"
                min="0"
                max="100"
                step="0.001"
                className={inputClass}
              />
            </Field>

            <Field label="Current (%)">
              <input
                type="number"
                name="current_founder_ownership"
                defaultValue={data?.current_founder_ownership ?? ''}
                placeholder="72.5"
                min="0"
                max="100"
                step="0.001"
                className={inputClass}
              />
            </Field>

          </div>
        </div>

        {/* ── TVC / ARM ownership ──────────────────────────── */}
        <div className="rounded-xl border border-zinc-100 bg-white p-6 shadow-sm">
          <SectionHeading title="TVC Labs / TD / ARM ownership" />
          <p className="text-xs text-zinc-400 mb-5">
            Ownership change and status (Diluted / Maintained / Increased) are
            calculated automatically.
          </p>
          <div className="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2">

            <Field label="At investment (%)">
              <input
                type="number"
                name="tvc_ownership_at_investment"
                defaultValue={data?.tvc_ownership_at_investment ?? ''}
                placeholder="10.0"
                min="0"
                max="100"
                step="0.001"
                className={inputClass}
              />
            </Field>

            <Field label="Current (%)">
              <input
                type="number"
                name="current_tvc_ownership"
                defaultValue={data?.current_tvc_ownership ?? ''}
                placeholder="9.0"
                min="0"
                max="100"
                step="0.001"
                className={inputClass}
              />
            </Field>

          </div>
        </div>

        {/* ── Alert thresholds ─────────────────────────────── */}
        <div className="rounded-xl border border-zinc-100 bg-white p-6 shadow-sm">
          <SectionHeading title="Alert thresholds" />
          <p className="text-xs text-zinc-400 mb-5">
            Override the system defaults (25% founder, 20% TVC) for this
            company if needed. Leave blank to use defaults.
          </p>
          <div className="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2">

            <Field
              label="Founder dilution threshold (%)"
              hint="Alert fires above this value. Default: 25%"
            >
              <input
                type="number"
                name="founder_dilution_alert_threshold"
                defaultValue={data?.founder_dilution_alert_threshold ?? ''}
                placeholder="25"
                min="0"
                max="100"
                step="0.1"
                className={inputClass}
              />
            </Field>

            <Field
              label="TVC dilution threshold (%)"
              hint="Alert fires above this value. Default: 20%"
            >
              <input
                type="number"
                name="tvc_dilution_alert_threshold"
                defaultValue={data?.tvc_dilution_alert_threshold ?? ''}
                placeholder="20"
                min="0"
                max="100"
                step="0.1"
                className={inputClass}
              />
            </Field>

          </div>
        </div>

        {/* ── Internal notes ───────────────────────────────── */}
        <div className="rounded-xl border border-zinc-100 bg-white p-6 shadow-sm">
          <SectionHeading title="Notes" />
          <textarea
            name="notes"
            defaultValue={data?.notes ?? ''}
            rows={4}
            placeholder="Any relevant context about the ownership structure or history…"
            className={`${inputClass} resize-none`}
          />
        </div>

        {/* ── Actions ──────────────────────────────────────── */}
        <div className="flex items-center justify-end gap-3 pb-8">
          {data && (
            <button
              type="button"
              onClick={() => { setEditing(false); setSaveError(null) }}
              className="rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition-colors"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={isPending}
            className="rounded-lg bg-[#1a23bd] px-5 py-2 text-sm font-medium text-white hover:bg-[#1520a8] disabled:opacity-50 transition-colors"
          >
            {isPending ? 'Saving…' : 'Save cap table'}
          </button>
        </div>

      </form>
    </div>
  )
}