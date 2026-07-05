'use client'
// ↑ Required because this component uses useState and event handlers.
// Anything interactive needs this directive.

import { useState } from 'react'
import { useRole } from '@/hooks/useRole'
import { submitUpdateAction } from '@/features/monthly-updates/actions/submitUpdate.action'
import type { MonthlyUpdate, UpdateStatusInfo, CreateUpdateInput } from '@/features/monthly-updates/types'

interface UpdatesTabViewProps {
  companyId: string
  updates: MonthlyUpdate[]
  status: UpdateStatusInfo
}

// ─── Month name lookup ───────────────────────────────────────────────────────
const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
]

function formatDate(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
  })
}

// ─── Status banner ───────────────────────────────────────────────────────────
// A small component that lives inside this file — no need to extract it
// since it's only used here. Extract only when shared across files.

function StatusBanner({ status }: { status: UpdateStatusInfo }) {
  const period = `${MONTHS[status.currentPeriod.month - 1]} ${status.currentPeriod.year}`

  if (!status.lastUpdateDate) {
    return (
      <div className="px-4 py-4 rounded-md bg-amber-50 border border-amber-200">
        <p className="text-sm text-amber-700">
          No updates submitted yet. Submit the first update for {period}.
        </p>
      </div>
    )
  }

  if (status.hasCurrentPeriodUpdate) {
    return (
      <div className="px-4 py-4 rounded-md bg-emerald-50 border border-emerald-200">
        <p className="text-sm text-emerald-700">
          Update submitted for {period} — {status.daysSinceLastUpdate} days ago.
        </p>
      </div>
    )
  }

  return (
    <div className="px-4 py-4 rounded-md bg-red-50 border border-red-200">
      <p className="text-sm text-red-700">
        No update for {period}. Last update was {status.daysSinceLastUpdate} days ago.
      </p>
    </div>
  )
}

// ─── Individual update card ──────────────────────────────────────────────────

const STATUS_STYLES: Record<string, string> = {
  Draft:     'text-zinc-600 bg-zinc-100 border-zinc-200',
  Submitted: 'text-blue-700 bg-blue-50 border-blue-200',
  Reviewed:  'text-emerald-700 bg-emerald-50 border-emerald-200',
}

function UpdateCard({ update, isLatest }: { update: MonthlyUpdate; isLatest: boolean }) {
  return (
    <div className={`rounded-lg border p-6 space-y-4 ${isLatest ? 'border-zinc-200' : 'border-zinc-100'}`}>
      <div className="flex items-start justify-between">
        <div className="space-y-0.5">
          <p className="text-sm font-medium text-zinc-900">
            {MONTHS[update.month - 1]} {update.year}
            {isLatest && (
              <span className="ml-2 text-xs font-normal text-zinc-400">Latest</span>
            )}
          </p>
          {update.submitted_at && (
            <p className="text-xs text-zinc-400">
              Submitted {formatDate(update.submitted_at)} by {update.submitted_by}
            </p>
          )}
        </div>
        <span className={`inline-flex items-center px-2 py-0.5 rounded border text-xs font-medium ${STATUS_STYLES[update.status]}`}>
          {update.status}
        </span>
      </div>

      <div className="space-y-4 pt-2 border-t border-zinc-50">
        <div className="space-y-1">
          <p className="text-xs font-medium text-zinc-400 uppercase tracking-wide">Achievements</p>
          <p className="text-sm text-zinc-700 whitespace-pre-wrap leading-relaxed">{update.achievements}</p>
        </div>
        <div className="space-y-1">
          <p className="text-xs font-medium text-zinc-400 uppercase tracking-wide">Challenges</p>
          <p className="text-sm text-zinc-700 whitespace-pre-wrap leading-relaxed">{update.challenges}</p>
        </div>
        <div className="space-y-1">
          <p className="text-xs font-medium text-zinc-400 uppercase tracking-wide">Targets</p>
          <p className="text-sm text-zinc-700 whitespace-pre-wrap leading-relaxed">{update.targets}</p>
        </div>
      </div>
    </div>
  )
}

// ─── Submit form ─────────────────────────────────────────────────────────────
// Lives in this file for now. Extract to its own file if it grows.

function SubmitForm({
  companyId,
  existing,
  currentMonth,
  currentYear,
}: {
  companyId: string
  existing: MonthlyUpdate | null
  currentMonth: number
  currentYear: number
}) {
  const [achievements, setAchievements] = useState(existing?.achievements ?? '')
  const [challenges, setChallenges]     = useState(existing?.challenges ?? '')
  const [targets, setTargets]           = useState(existing?.targets ?? '')
  const [saving, setSaving]             = useState(false)
  const [error, setError]               = useState<string | null>(null)
  const [saved, setSaved]               = useState(false)

  // One handler covers both Save as Draft and Submit.
  // The status argument tells the action which one to do.
  async function handleSave(status: 'Draft' | 'Submitted') {
    setSaving(true)
    setError(null)
    setSaved(false)

    const input: CreateUpdateInput = {
      company_id: companyId,
      month: currentMonth,
      year: currentYear,
      achievements,
      challenges,
      targets,
      status,
    }

    const result = await submitUpdateAction(input)
    // ↑ This calls the server action directly — no fetch, no API route needed.
    // Next.js handles the server communication behind the scenes.

    if (!result.success) {
      setError(result.error ?? 'Something went wrong.')
    } else {
      setSaved(true)
    }

    setSaving(false)
  }

  return (
    <div className="border border-zinc-100 rounded-lg p-6 space-y-5 bg-zinc-50">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-zinc-900">
          {existing ? 'Edit draft' : `Submit update — ${MONTHS[currentMonth - 1]} ${currentYear}`}
        </h3>
        {saved && <p className="text-xs text-emerald-600">Saved</p>}
      </div>

      {error && (
        <p className="text-xs text-red-600">{error}</p>
      )}

      <div className="space-y-4">
        {[
          { label: 'Achievements', value: achievements, set: setAchievements,
            placeholder: 'Key milestones, progress, wins this month...' },
          { label: 'Challenges', value: challenges, set: setChallenges,
            placeholder: 'Blockers, risks, or challenges faced...' },
          { label: 'Targets', value: targets, set: setTargets,
            placeholder: 'Priorities and goals for next month...' },
        ].map(({ label, value, set, placeholder }) => (
          <div key={label} className="space-y-1.5">
            <label className="text-xs font-medium text-zinc-500 uppercase tracking-wide">
              {label}
            </label>
            <textarea
              rows={3}
              value={value}
              onChange={(e) => set(e.target.value)}
              placeholder={placeholder}
              className="
                w-full px-3 py-2 text-sm text-zinc-900 bg-white
                border border-zinc-200 rounded-md resize-none
                placeholder:text-zinc-400
                focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent
              "
            />
          </div>
        ))}
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={() => handleSave('Submitted')}
          disabled={saving || !achievements.trim() || !challenges.trim() || !targets.trim()}
          className="
            h-8 px-4 text-xs font-medium text-white bg-zinc-900
            rounded-md hover:bg-zinc-800 disabled:opacity-40 transition-colors
          "
        >
          {saving ? 'Saving…' : 'Submit update'}
        </button>
        <button
          onClick={() => handleSave('Draft')}
          disabled={saving}
          className="h-8 px-4 text-xs font-medium text-zinc-500 hover:text-zinc-800 transition-colors"
        >
          Save draft
        </button>
      </div>
    </div>
  )
}

// ─── Main view ───────────────────────────────────────────────────────────────
// This is what CompanyUpdatesTab renders. It receives everything as props.

export function UpdatesTabView({ companyId, updates, status }: UpdatesTabViewProps) {
  const { role } = useRole()
  // ↑ useRole reads from the browser session.
  // Internal users and founders can submit. Angels can only read.

  const canSubmit = role === 'internal' || role === 'founder'

  // Find draft for the current period if one exists
  const currentDraft = updates.find(
    (u) =>
      u.status === 'Draft' &&
      u.month === status.currentPeriod.month &&
      u.year === status.currentPeriod.year
  ) ?? null

  // Show all submitted updates + any current draft
  const displayUpdates = updates.filter(
    (u) => u.status !== 'Draft' || u.id === currentDraft?.id
  )

  return (
    <div className="space-y-8 max-w-2xl">

      {/* Status banner — always visible */}
      <StatusBanner status={status} />

      {/* Submit form — internal and founder only, hidden from angels */}
      {canSubmit && !status.hasCurrentPeriodUpdate && (
        <SubmitForm
          companyId={companyId}
          existing={currentDraft}
          currentMonth={status.currentPeriod.month}
          currentYear={status.currentPeriod.year}
        />
      )}

      {/* Update history */}
      <div className="space-y-4">
        <div className="flex items-baseline gap-2">
          <h2 className="text-xs font-medium text-zinc-400 uppercase tracking-wide">
            Update history
          </h2>
          <span className="text-xs text-zinc-300">{displayUpdates.length}</span>
        </div>

        {displayUpdates.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 border border-dashed border-zinc-200 rounded-lg">
            <p className="text-sm text-zinc-500">No updates yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {displayUpdates.map((update, index) => (
              <UpdateCard
                key={update.id}
                update={update}
                isLatest={index === 0 && update.status !== 'Draft'}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}