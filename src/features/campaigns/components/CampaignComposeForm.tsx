'use client'
// ─────────────────────────────────────────────────────────────
// CampaignComposeForm — compose + preview + send
// Flow: fill form → preview recipients → send
// ─────────────────────────────────────────────────────────────

import { useState, useTransition, useRef } from 'react'
import {
  previewRecipientsAction,
  sendCampaignAction,
} from '../actions/campaigns.actions'
import {
  EMAIL_TYPE_CONFIG,
  RECIPIENT_POOL_CONFIG,
} from '../types'
import type {
  CampaignEmailType,
  RecipientPool,
  ResolvedRecipient,
} from '../types'

const inputClass =
  'w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 ' +
  'placeholder:text-zinc-400 focus:border-[#1a23bd] focus:outline-none ' +
  'focus:ring-2 focus:ring-[#1a23bd]/20 disabled:bg-zinc-50 disabled:text-zinc-400'

const selectClass =
  'w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 ' +
  'focus:border-[#1a23bd] focus:outline-none focus:ring-2 focus:ring-[#1a23bd]/20'

const labelClass = 'text-xs font-medium text-zinc-500 uppercase tracking-wide block mb-1.5'

const POOLS = Object.entries(RECIPIENT_POOL_CONFIG) as [
  RecipientPool,
  { label: string; description: string },
][]

const EMAIL_TYPES = Object.entries(EMAIL_TYPE_CONFIG) as [
  CampaignEmailType,
  { label: string; defaultSubject: string },
][]

const RECIPIENT_TYPE_STYLES: Record<string, string> = {
  angel:             'text-amber-700 bg-amber-50 border-amber-200',
  founder_portfolio: 'text-emerald-700 bg-emerald-50 border-emerald-200',
  founder_crm:       'text-blue-700 bg-blue-50 border-blue-200',
  individual:        'text-zinc-600 bg-zinc-50 border-zinc-200',
}

const RECIPIENT_TYPE_LABELS: Record<string, string> = {
  angel:             'Angel',
  founder_portfolio: 'Portfolio founder',
  founder_crm:       'CRM founder',
  individual:        'Individual',
}

// ─────────────────────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────────────────────

export default function CampaignComposeForm() {
  const formRef = useRef<HTMLFormElement>(null)
  const [emailType, setEmailType] = useState<CampaignEmailType>('general')
  const [subject, setSubject] = useState(
    EMAIL_TYPE_CONFIG['general'].defaultSubject,
  )

  // Preview state
  const [previewing, startPreviewTransition] = useTransition()
  const [previewRecipients, setPreviewRecipients] = useState<ResolvedRecipient[] | null>(null)
  const [previewError, setPreviewError] = useState<string | null>(null)

  // Send state
  const [sending, startSendTransition] = useTransition()
  const [sendResult, setSendResult] = useState<{
    success: boolean
    sentCount?: number
    failedCount?: number
    error?: string
  } | null>(null)

  function handleEmailTypeChange(type: CampaignEmailType) {
    setEmailType(type)
    setSubject(EMAIL_TYPE_CONFIG[type].defaultSubject)
    setPreviewRecipients(null)
  }

  function handlePreview() {
    if (!formRef.current) return
    setPreviewError(null)
    setPreviewRecipients(null)
    setSendResult(null)
    const formData = new FormData(formRef.current)

    startPreviewTransition(async () => {
      const result = await previewRecipientsAction(formData)
      if (result.error) {
        setPreviewError(result.error)
      } else {
        setPreviewRecipients(result.recipients)
      }
    })
  }

  function handleSend() {
    if (!formRef.current) return
    setSendResult(null)
    const formData = new FormData(formRef.current)

    startSendTransition(async () => {
      const result = await sendCampaignAction(formData)
      setSendResult(result)
      if (result.success) {
        // Reset form on success
        formRef.current?.reset()
        setEmailType('general')
        setSubject(EMAIL_TYPE_CONFIG['general'].defaultSubject)
        setPreviewRecipients(null)
      }
    })
  }

  return (
    <div className="space-y-6">

      {/* Send result banner */}
      {sendResult && (
        <div className={`rounded-xl px-5 py-4 border text-sm ${
          sendResult.success
            ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
            : 'bg-red-50 border-red-200 text-red-700'
        }`}>
          {sendResult.success ? (
            <p>
              <strong>Campaign sent.</strong> {sendResult.sentCount} email{sendResult.sentCount !== 1 ? 's' : ''} delivered
              {sendResult.failedCount ? `, ${sendResult.failedCount} failed` : ''}.
            </p>
          ) : (
            <p><strong>Send failed.</strong> {sendResult.error}</p>
          )}
        </div>
      )}

      <form ref={formRef} className="space-y-6" onSubmit={(e) => e.preventDefault()}>

        {/* ── Campaign details ────────────────────────────── */}
        <div className="rounded-xl border border-zinc-100 bg-white shadow-sm p-6 space-y-5">
          <div>
            <h3 className="text-sm font-semibold text-zinc-900">Campaign details</h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              Title is for internal reference only — not included in the email.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div>
              <label className={labelClass}>Internal title</label>
              <input
                type="text"
                name="title"
                placeholder="e.g. Q2 2026 Angel Update"
                className={inputClass}
                required
              />
            </div>

            <div>
              <label className={labelClass}>Email type</label>
              <select
                name="email_type"
                value={emailType}
                onChange={(e) => handleEmailTypeChange(e.target.value as CampaignEmailType)}
                className={selectClass}
              >
                {EMAIL_TYPES.map(([key, config]) => (
                  <option key={key} value={key}>{config.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className={labelClass}>Subject line</label>
            <input
              type="text"
              name="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Email subject"
              className={inputClass}
              required
            />
          </div>

          <div>
            <label className={labelClass}>Body</label>
            <textarea
              name="body"
              rows={10}
              placeholder="Write your message here…"
              className={`${inputClass} resize-none leading-relaxed`}
              required
            />
            <p className="text-xs text-zinc-400 mt-1">
              Plain text only. Keep it clear and concise.
            </p>
          </div>
        </div>

        {/* ── Recipients ──────────────────────────────────── */}
        <div className="rounded-xl border border-zinc-100 bg-white shadow-sm p-6 space-y-5">
          <div>
            <h3 className="text-sm font-semibold text-zinc-900">Recipients</h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              Select one or more pools. Duplicate emails across pools are removed automatically.
            </p>
          </div>

          {/* Pool checkboxes */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {POOLS.map(([key, config]) => (
              <label
                key={key}
                className="flex items-start gap-3 p-3 rounded-lg border border-zinc-100 hover:bg-zinc-50/60 cursor-pointer transition-colors"
              >
                <input
                  type="checkbox"
                  name={`pool_${key}`}
                  className="mt-0.5 accent-[#1a23bd]"
                  onChange={() => setPreviewRecipients(null)}
                />
                <div>
                  <p className="text-sm font-medium text-zinc-900">{config.label}</p>
                  <p className="text-xs text-zinc-400 mt-0.5">{config.description}</p>
                </div>
              </label>
            ))}
          </div>

          {/* Individual emails */}
          <div>
            <label className={labelClass}>
              Individual emails (optional)
            </label>
            <textarea
              name="individual_emails"
              rows={3}
              placeholder="one@example.com, two@example.com"
              className={`${inputClass} resize-none`}
              onChange={() => setPreviewRecipients(null)}
            />
            <p className="text-xs text-zinc-400 mt-1">
              Comma or newline separated. These are added on top of any selected pools.
            </p>
          </div>

          {/* Preview button */}
          <div className="flex items-center gap-3 pt-2 border-t border-zinc-50">
            <button
              type="button"
              onClick={handlePreview}
              disabled={previewing}
              className="rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-50 transition-colors"
            >
              {previewing ? 'Resolving…' : 'Preview recipients'}
            </button>
            {previewError && (
              <p className="text-xs text-red-600">{previewError}</p>
            )}
          </div>
        </div>

        {/* ── Preview panel ────────────────────────────────── */}
        {previewRecipients !== null && (
          <div className="rounded-xl border border-zinc-200 bg-white shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-50">
              <div>
                <h3 className="text-sm font-semibold text-zinc-900">
                  Recipient preview
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  {previewRecipients.length} unique recipient{previewRecipients.length !== 1 ? 's' : ''} resolved
                </p>
              </div>
              {previewRecipients.length > 0 && (
                <button
                  type="button"
                  onClick={handleSend}
                  disabled={sending}
                  className="rounded-lg bg-[#1a23bd] px-5 py-2 text-sm font-medium text-white hover:bg-[#1520a8] disabled:opacity-50 transition-colors"
                >
                  {sending ? 'Sending…' : `Send to ${previewRecipients.length} recipient${previewRecipients.length !== 1 ? 's' : ''}`}
                </button>
              )}
            </div>

            {previewRecipients.length === 0 ? (
              <div className="px-5 py-8 text-center">
                <p className="text-sm text-zinc-400">
                  No recipients found for the selected pools.
                </p>
                <p className="text-xs text-zinc-400 mt-1">
                  Check that holders and founders have email addresses recorded.
                </p>
              </div>
            ) : (
              <div className="max-h-64 overflow-y-auto divide-y divide-zinc-50">
                {previewRecipients.map((r, i) => (
                  <div key={i} className="flex items-center justify-between px-5 py-3">
                    <div className="flex items-center gap-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded border text-xs font-medium ${RECIPIENT_TYPE_STYLES[r.type]}`}>
                        {RECIPIENT_TYPE_LABELS[r.type]}
                      </span>
                      <span className="text-sm text-zinc-700">{r.email}</span>
                    </div>
                    {r.name && (
                      <span className="text-xs text-zinc-400">{r.name}</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </form>
    </div>
  )
}