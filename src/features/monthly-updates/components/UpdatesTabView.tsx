'use client'

import { useState, useTransition } from 'react'
import { useRole } from '@/hooks/useRole'
import { submitUpdateAction } from '@/features/monthly-updates/actions/submitUpdate.action'
import { reviewUpdateAction } from '@/features/monthly-updates/actions/reviewUpdate.action'
import { sendReminderAction } from '@/features/monthly-updates/actions/sendReminder.action'
import { upsertTargetAction } from '@/features/monthly-updates/actions/upsertTarget.action'
import type {
  MonthlyUpdate,
  ReportingTarget,
  UpdateStatusInfo,
  CreateUpdateInput,
} from '@/features/monthly-updates/types'
import {
  CheckCircle2,
  AlertCircle,
  Clock,
  Send,
  Target as TargetIcon,
  MessageSquare,
  RefreshCw,
  FileEdit,
} from 'lucide-react'

interface UpdatesTabViewProps {
  companyId: string
  updates: MonthlyUpdate[]
  status: UpdateStatusInfo
  targets?: ReportingTarget[]
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

function formatDate(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
  })
}

// ── Status Styles ─────────────────────────────────────────────────────────────
const STATUS_STYLES: Record<string, { badge: string; icon: any }> = {
  Draft: { badge: 'text-zinc-600 bg-zinc-100 border-zinc-200', icon: Clock },
  Submitted: { badge: 'text-blue-700 bg-blue-50 border-blue-200', icon: Send },
  Verified: { badge: 'text-emerald-700 bg-emerald-50 border-emerald-200', icon: CheckCircle2 },
  'Needs Correction': { badge: 'text-amber-700 bg-amber-50 border-amber-200', icon: AlertCircle },
}

// ── Status Banner ──────────────────────────────────────────────────────────────
function StatusBanner({
  status,
  companyId,
  isInternal,
}: {
  status: UpdateStatusInfo
  companyId: string
  isInternal: boolean
}) {
  const period = `${MONTHS[status.currentPeriod.month - 1]} ${status.currentPeriod.year}`
  const [sendingReminder, setSendingReminder] = useState(false)
  const [reminderResult, setReminderResult] = useState<string | null>(null)

  async function handleSendReminder() {
    setSendingReminder(true)
    setReminderResult(null)

    const res = await sendReminderAction({
      companyId,
      month: status.currentPeriod.month,
      year: status.currentPeriod.year,
    })

    if (res.success) {
      setReminderResult(`Reminder sent successfully to ${res.recipientEmail || 'founder'}.`)
    } else {
      setReminderResult(`Failed: ${res.error || 'Could not send reminder.'}`)
    }
    setSendingReminder(false)
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border bg-white shadow-sm">
        <div>
          {!status.lastUpdateDate ? (
            <p className="text-sm font-medium text-amber-700">
              No updates submitted yet. Pending update for {period}.
            </p>
          ) : status.hasCurrentPeriodUpdate ? (
            <p className="text-sm font-medium text-emerald-700">
              Update submitted for {period} — {status.daysSinceLastUpdate} days ago.
            </p>
          ) : (
            <p className="text-sm font-medium text-red-600">
              Overdue: No update submitted for {period}. Last update was {status.daysSinceLastUpdate} days ago.
            </p>
          )}
          <p className="text-xs text-zinc-400 mt-0.5 font-mono">
            Reporting Period: {period}
          </p>
        </div>

        {isInternal && !status.hasCurrentPeriodUpdate && (
          <button
            onClick={handleSendReminder}
            disabled={sendingReminder}
            className="h-8 px-3 text-xs font-semibold text-white bg-[#1a23bd] rounded-md hover:bg-[#151c9a] disabled:opacity-40 transition-colors inline-flex items-center gap-1.5 shrink-0"
          >
            {sendingReminder ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Send className="w-3.5 h-3.5" />
            )}
            Send Reminder
          </button>
        )}
      </div>

      {reminderResult && (
        <div className="p-3 text-xs rounded-lg bg-blue-50 border border-blue-200 text-blue-800 flex items-center justify-between">
          <span>{reminderResult}</span>
          <button
            onClick={() => setReminderResult(null)}
            className="text-[10px] underline text-blue-600 hover:text-blue-900"
          >
            Dismiss
          </button>
        </div>
      )}
    </div>
  )
}

// ── Reporting Targets Component ────────────────────────────────────────────────
function ReportingTargetsCard({
  companyId,
  targets,
  currentMonth,
  currentYear,
  isInternal,
}: {
  companyId: string
  targets: ReportingTarget[]
  currentMonth: number
  currentYear: number
  isInternal: boolean
}) {
  const activeTarget = targets.find((t) => t.month === currentMonth && t.year === currentYear)
  const [editing, setEditing] = useState(false)
  const [revenue, setRevenue] = useState(activeTarget?.target_revenue?.toString() ?? '')
  const [mrr, setMrr] = useState(activeTarget?.target_mrr?.toString() ?? '')
  const [milestones, setMilestones] = useState(activeTarget?.key_milestones ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSaveTarget(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)

    const res = await upsertTargetAction({
      companyId,
      month: currentMonth,
      year: currentYear,
      targetRevenue: revenue ? Number(revenue) : null,
      targetMrr: mrr ? Number(mrr) : null,
      keyMilestones: milestones,
    })

    if (res.success) {
      setEditing(false)
    } else {
      setError(res.error || 'Failed to save targets')
    }
    setSaving(false)
  }

  return (
    <div className="border border-zinc-200 rounded-xl bg-white p-5 space-y-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TargetIcon className="w-4 h-4 text-[#1a23bd]" />
          <h3 className="text-xs font-bold text-zinc-900 uppercase tracking-wide">
            Reporting Targets ({MONTHS[currentMonth - 1]} {currentYear})
          </h3>
        </div>
        {isInternal && !editing && (
          <button
            onClick={() => setEditing(true)}
            className="text-xs font-semibold text-[#1a23bd] hover:underline"
          >
            {activeTarget ? 'Edit Targets' : '+ Set Targets'}
          </button>
        )}
      </div>

      {editing ? (
        <form onSubmit={handleSaveTarget} className="space-y-3 pt-2">
          {error && <p className="text-xs text-red-600">{error}</p>}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-medium text-zinc-500 uppercase">Target Revenue ($)</label>
              <input
                type="number"
                value={revenue}
                onChange={(e) => setRevenue(e.target.value)}
                placeholder="e.g. 50000"
                className="w-full h-8 px-2.5 text-xs text-zinc-900 bg-white border border-zinc-200 rounded-md focus:outline-none focus:ring-2 focus:ring-[#1a23bd]"
              />
            </div>
            <div>
              <label className="text-[11px] font-medium text-zinc-500 uppercase">Target MRR ($)</label>
              <input
                type="number"
                value={mrr}
                onChange={(e) => setMrr(e.target.value)}
                placeholder="e.g. 15000"
                className="w-full h-8 px-2.5 text-xs text-zinc-900 bg-white border border-zinc-200 rounded-md focus:outline-none focus:ring-2 focus:ring-[#1a23bd]"
              />
            </div>
          </div>
          <div>
            <label className="text-[11px] font-medium text-zinc-500 uppercase">Key Deliverables & Milestones</label>
            <textarea
              rows={2}
              value={milestones}
              onChange={(e) => setMilestones(e.target.value)}
              placeholder="e.g. Launch v2 app, complete pilot with 3 enterprise clients"
              className="w-full p-2 text-xs text-zinc-900 bg-white border border-zinc-200 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-[#1a23bd]"
            />
          </div>
          <div className="flex items-center gap-2 pt-1">
            <button
              type="submit"
              disabled={saving}
              className="h-7 px-3 text-xs font-semibold text-white bg-[#1a23bd] rounded-md hover:bg-[#151c9a] disabled:opacity-40"
            >
              {saving ? 'Saving...' : 'Save Targets'}
            </button>
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="h-7 px-3 text-xs font-medium text-zinc-500 hover:text-zinc-800"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : activeTarget ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
          <div className="bg-zinc-50 p-3 rounded-lg border border-zinc-100 space-y-0.5">
            <p className="text-[10px] font-semibold text-zinc-400 uppercase">Target Revenue</p>
            <p className="text-base font-bold text-zinc-900">
              {activeTarget.target_revenue != null ? `$${activeTarget.target_revenue.toLocaleString()}` : '—'}
            </p>
          </div>
          <div className="bg-zinc-50 p-3 rounded-lg border border-zinc-100 space-y-0.5">
            <p className="text-[10px] font-semibold text-zinc-400 uppercase">Target MRR</p>
            <p className="text-base font-bold text-zinc-900">
              {activeTarget.target_mrr != null ? `$${activeTarget.target_mrr.toLocaleString()}` : '—'}
            </p>
          </div>
          <div className="bg-zinc-50 p-3 rounded-lg border border-zinc-100 space-y-0.5 sm:col-span-1">
            <p className="text-[10px] font-semibold text-zinc-400 uppercase">Key Milestones</p>
            <p className="text-xs text-zinc-700 leading-snug line-clamp-2">
              {activeTarget.key_milestones || '—'}
            </p>
          </div>
        </div>
      ) : (
        <p className="text-xs text-zinc-400 italic">
          No specific performance targets defined for this period yet.
        </p>
      )}
    </div>
  )
}

// ── Individual Update Card + Review Trigger ────────────────────────────────────
function UpdateCard({
  update,
  isLatest,
  isInternal,
  companyId,
}: {
  update: MonthlyUpdate
  isLatest: boolean
  isInternal: boolean
  companyId: string
}) {
  const [showReviewModal, setShowReviewModal] = useState(false)
  const [reviewStatus, setReviewStatus] = useState<'Verified' | 'Needs Correction'>('Verified')
  const [reviewNotes, setReviewNotes] = useState(update.review_notes || '')
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const Style = STATUS_STYLES[update.status] || STATUS_STYLES.Submitted
  const Icon = Style.icon

  function handleReviewSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    startTransition(async () => {
      const res = await reviewUpdateAction({
        updateId: update.id,
        companyId,
        status: reviewStatus,
        reviewNotes,
      })

      if (res.success) {
        setShowReviewModal(false)
      } else {
        setError(res.error || 'Failed to submit review')
      }
    })
  }

  return (
    <div className={`rounded-xl border bg-white p-6 space-y-4 shadow-sm ${isLatest ? 'border-zinc-300' : 'border-zinc-100'}`}>
      <div className="flex items-start justify-between">
        <div className="space-y-0.5">
          <p className="text-sm font-semibold text-zinc-900">
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

        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-medium ${Style.badge}`}>
            <Icon className="w-3.5 h-3.5" />
            {update.status}
          </span>

          {isInternal && update.status !== 'Draft' && (
            <button
              onClick={() => setShowReviewModal(!showReviewModal)}
              className="px-2.5 py-1 text-xs font-semibold text-[#1a23bd] bg-blue-50 border border-blue-100 rounded-lg hover:bg-blue-100 transition-colors inline-flex items-center gap-1"
            >
              <FileEdit className="w-3 h-3" />
              Review
            </button>
          )}
        </div>
      </div>

      {/* Review Notes Display (if verified or needs correction) */}
      {update.review_notes && (
        <div
          className={`p-3 rounded-lg border text-xs space-y-1 ${
            update.status === 'Needs Correction'
              ? 'bg-amber-50 border-amber-200 text-amber-900'
              : 'bg-emerald-50 border-emerald-200 text-emerald-900'
          }`}
        >
          <div className="flex items-center gap-1.5 font-semibold">
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Review Feedback ({update.reviewed_by ? `by ${update.reviewed_by.split('@')[0]}` : 'Internal Team'}):</span>
          </div>
          <p className="leading-relaxed">{update.review_notes}</p>
        </div>
      )}

      {/* Review & Verification Modal / Drawer */}
      {showReviewModal && (
        <form onSubmit={handleReviewSubmit} className="p-4 rounded-xl bg-zinc-50 border border-zinc-200 space-y-3">
          <h4 className="text-xs font-bold text-zinc-900 uppercase tracking-wide">
            Review Submission — {MONTHS[update.month - 1]} {update.year}
          </h4>
          {error && <p className="text-xs text-red-600">{error}</p>}

          <div className="flex items-center gap-4">
            <label className="flex items-center gap-1.5 text-xs font-medium text-zinc-700 cursor-pointer">
              <input
                type="radio"
                name="status"
                value="Verified"
                checked={reviewStatus === 'Verified'}
                onChange={() => setReviewStatus('Verified')}
                className="text-[#1a23bd] focus:ring-[#1a23bd]"
              />
              Mark as Verified
            </label>
            <label className="flex items-center gap-1.5 text-xs font-medium text-zinc-700 cursor-pointer">
              <input
                type="radio"
                name="status"
                value="Needs Correction"
                checked={reviewStatus === 'Needs Correction'}
                onChange={() => setReviewStatus('Needs Correction')}
                className="text-amber-600 focus:ring-amber-600"
              />
              Request Correction
            </label>
          </div>

          <div>
            <label className="text-[11px] font-medium text-zinc-500 uppercase">
              Reviewer Notes / Feedback {reviewStatus === 'Needs Correction' && <span className="text-red-500">*</span>}
            </label>
            <textarea
              rows={2}
              value={reviewNotes}
              onChange={(e) => setReviewNotes(e.target.value)}
              placeholder={
                reviewStatus === 'Needs Correction'
                  ? 'Specify required corrections for the founder...'
                  : 'Optional internal verification notes...'
              }
              className="w-full p-2 text-xs text-zinc-900 bg-white border border-zinc-200 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-[#1a23bd]"
            />
          </div>

          <div className="flex items-center gap-2 pt-1">
            <button
              type="submit"
              disabled={isPending || (reviewStatus === 'Needs Correction' && !reviewNotes.trim())}
              className="h-7 px-3 text-xs font-semibold text-white bg-[#1a23bd] rounded-md hover:bg-[#151c9a] disabled:opacity-40 inline-flex items-center gap-1"
            >
              {isPending && <RefreshCw className="w-3 h-3 animate-spin" />}
              Save Review Decision
            </button>
            <button
              type="button"
              onClick={() => setShowReviewModal(false)}
              className="h-7 px-3 text-xs font-medium text-zinc-500 hover:text-zinc-800"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Submission Content */}
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

// ── Submit & Resubmit Form ─────────────────────────────────────────────────────
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
  const [challenges, setChallenges] = useState(existing?.challenges ?? '')
  const [targets, setTargets] = useState(existing?.targets ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  const isCorrection = existing?.status === 'Needs Correction'

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

    if (!result.success) {
      setError(result.error ?? 'Something went wrong.')
    } else {
      setSaved(true)
    }

    setSaving(false)
  }

  return (
    <div className={`border rounded-xl p-6 space-y-5 shadow-sm ${isCorrection ? 'border-amber-300 bg-amber-50/30' : 'border-zinc-200 bg-zinc-50'}`}>
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-zinc-900">
          {isCorrection
            ? `Resubmit Correction — ${MONTHS[currentMonth - 1]} ${currentYear}`
            : existing
            ? 'Edit draft'
            : `Submit Update — ${MONTHS[currentMonth - 1]} ${currentYear}`}
        </h3>
        {saved && <p className="text-xs font-medium text-emerald-600">Saved successfully!</p>}
      </div>

      {isCorrection && existing.review_notes && (
        <div className="p-3.5 rounded-lg bg-amber-100/70 border border-amber-200 text-xs text-amber-900 space-y-1">
          <div className="flex items-center gap-1.5 font-bold">
            <AlertCircle className="w-4 h-4 text-amber-700" />
            <span>Requested Corrections:</span>
          </div>
          <p className="leading-relaxed">{existing.review_notes}</p>
        </div>
      )}

      {error && <p className="text-xs text-red-600 font-medium">{error}</p>}

      <div className="space-y-4">
        {[
          {
            label: 'Achievements',
            value: achievements,
            set: setAchievements,
            placeholder: 'Key milestones, progress, wins this month...',
          },
          {
            label: 'Challenges',
            value: challenges,
            set: setChallenges,
            placeholder: 'Blockers, risks, or challenges faced...',
          },
          {
            label: 'Targets',
            value: targets,
            set: setTargets,
            placeholder: 'Priorities and goals for next month...',
          },
        ].map(({ label, value, set, placeholder }) => (
          <div key={label} className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">
              {label}
            </label>
            <textarea
              rows={3}
              value={value}
              onChange={(e) => set(e.target.value)}
              placeholder={placeholder}
              className="w-full px-3 py-2 text-sm text-zinc-900 bg-white border border-zinc-200 rounded-lg resize-none placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#1a23bd]"
            />
          </div>
        ))}
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={() => handleSave('Submitted')}
          disabled={saving || !achievements.trim() || !challenges.trim() || !targets.trim()}
          className="h-8 px-4 text-xs font-semibold text-white bg-[#1a23bd] rounded-lg hover:bg-[#151c9a] disabled:opacity-40 transition-colors shadow-sm inline-flex items-center gap-1.5"
        >
          {saving && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
          {isCorrection ? 'Resubmit Update' : 'Submit Update'}
        </button>
        <button
          onClick={() => handleSave('Draft')}
          disabled={saving}
          className="h-8 px-4 text-xs font-medium text-zinc-600 hover:text-zinc-900 transition-colors"
        >
          Save draft
        </button>
      </div>
    </div>
  )
}

// ── Main View Component ────────────────────────────────────────────────────────
export function UpdatesTabView({ companyId, updates, status, targets = [] }: UpdatesTabViewProps) {
  const { role } = useRole()
  const isInternal = role === 'internal' || role === 'admin'
  const canSubmit = isInternal || role === 'founder'

  // Find draft or correction update for current period
  const activeSubmission = updates.find(
    (u) =>
      u.month === status.currentPeriod.month &&
      u.year === status.currentPeriod.year &&
      (u.status === 'Draft' || u.status === 'Needs Correction')
  ) ?? null

  const displayUpdates = updates.filter(
    (u) => u.status !== 'Draft' || u.id === activeSubmission?.id
  )

  return (
    <div className="space-y-8 max-w-3xl">
      {/* Status banner */}
      <StatusBanner status={status} companyId={companyId} isInternal={isInternal} />

      {/* Reporting Targets Section */}
      <ReportingTargetsCard
        companyId={companyId}
        targets={targets}
        currentMonth={status.currentPeriod.month}
        currentYear={status.currentPeriod.year}
        isInternal={isInternal}
      />

      {/* Submit or Resubmit Form */}
      {canSubmit && (!status.hasCurrentPeriodUpdate || activeSubmission?.status === 'Needs Correction') && (
        <SubmitForm
          companyId={companyId}
          existing={activeSubmission}
          currentMonth={status.currentPeriod.month}
          currentYear={status.currentPeriod.year}
        />
      )}

      {/* Update history */}
      <div className="space-y-4">
        <div className="flex items-baseline gap-2">
          <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">
            Update History & Review Pipeline
          </h2>
          <span className="text-xs font-mono font-bold text-zinc-500">{displayUpdates.length}</span>
        </div>

        {displayUpdates.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 border border-dashed border-zinc-200 rounded-xl bg-white">
            <p className="text-sm font-medium text-zinc-500">No monthly updates recorded yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {displayUpdates.map((update, index) => (
              <UpdateCard
                key={update.id}
                update={update}
                isLatest={index === 0 && update.status !== 'Draft'}
                isInternal={isInternal}
                companyId={companyId}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default UpdatesTabView