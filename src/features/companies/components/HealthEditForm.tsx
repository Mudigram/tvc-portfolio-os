'use client'

import { useState } from 'react'
import { updateHealthAction } from '@/features/companies/actions/updateHealth.actions'
import type { CompanyProfile } from '@/features/companies/types'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'

type HealthValue = 'Green' | 'Amber' | 'Red'

const HEALTH_STYLES: Record<HealthValue, string> = {
  Green: 'text-emerald-700 bg-emerald-50 border-emerald-200',
  Amber: 'text-amber-700 bg-amber-50 border-amber-200',
  Red:   'text-red-700 bg-red-50 border-red-200',
}

interface HealthEditFormProps {
  companyId: string
  current: Pick<CompanyProfile, 'portfolio_health' | 'health_notes' | 'health_reviewed_at' | 'health_reviewed_by'>
}

function formatDate(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
  })
}

export default function HealthEditForm({ companyId, current }: HealthEditFormProps) {
  const { toast } = useToast()
  const [editing, setEditing] = useState(false)
  const [health, setHealth] = useState<HealthValue>(
    (current.portfolio_health as HealthValue) ?? 'Green'
  )
  const [notes, setNotes] = useState(current.health_notes ?? '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleConfirm() {
    setLoading(true)
    setError(null)

    const result = await updateHealthAction(companyId, { portfolio_health: health, health_notes: notes })

    if (result.success) {
      toast({
        title: 'Portfolio health updated',
        description: `Status set to ${health}.`,
        type: 'success',
      })
      setEditing(false)
    } else {
      const errMsg = result.error ?? 'Something went wrong.'
      setError(errMsg)
      toast({
        title: 'Error updating health',
        description: errMsg,
        type: 'error',
      })
    }

    setLoading(false)
  }

  const badgeStyle = current.portfolio_health
    ? HEALTH_STYLES[current.portfolio_health as HealthValue]
    : 'text-zinc-500 bg-zinc-50 border-zinc-200'

  return (
    <div className="space-y-4">
      {/* Display row */}
      <div className="flex items-center gap-3">
        <span className={`inline-flex items-center px-2.5 py-1 rounded border text-sm font-medium ${badgeStyle}`}>
          {current.portfolio_health ?? 'Not set'}
        </span>
        {!editing && (
          <button
            onClick={() => setEditing(true)}
            className="text-xs text-zinc-400 hover:text-zinc-700 underline underline-offset-2 transition-colors"
          >
            Edit
          </button>
        )}
      </div>

      {/* Reviewed by / date — quiet, below badge */}
      {current.health_reviewed_at && (
        <p className="text-xs text-zinc-400">
          Last reviewed {formatDate(current.health_reviewed_at)}
          {current.health_reviewed_by && (
            <> · by <span className="text-zinc-500">{current.health_reviewed_by.split('@')[0]}</span></>
          )}
        </p>
      )}

      {/* Notes display */}
      {!editing && current.health_notes && (
        <p className="text-sm text-zinc-600 leading-relaxed">{current.health_notes}</p>
      )}

      {/* Edit form */}
      {editing && (
        <div className="border border-zinc-100 rounded-lg p-4 space-y-4 bg-zinc-50">
          {/* Health selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-zinc-500 uppercase tracking-wide">
              Status
            </label>
            <div className="flex gap-2">
              {(['Green', 'Amber', 'Red'] as HealthValue[]).map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setHealth(val)}
                  className={`
                    flex-1 py-1.5 rounded border text-xs font-medium transition-all
                    ${health === val
                      ? HEALTH_STYLES[val] + ' ring-2 ring-offset-1 ring-current'
                      : 'text-zinc-400 bg-white border-zinc-200 hover:border-zinc-300'
                    }
                  `}
                >
                  {val}
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-zinc-500 uppercase tracking-wide">
              Notes
            </label>
            <Textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="What is driving this status? What does the team need to do?"
            />
          </div>

          {error && (
            <p className="text-xs text-red-600">{error}</p>
          )}

          {/* Actions */}
          <div className="flex items-center gap-3">
            <Button
              onClick={handleConfirm}
              disabled={loading}
              size="sm"
            >
              {loading ? 'Saving…' : 'Confirm'}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setEditing(false)
                setHealth((current.portfolio_health as HealthValue) ?? 'Green')
                setNotes(current.health_notes ?? '')
                setError(null)
              }}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}