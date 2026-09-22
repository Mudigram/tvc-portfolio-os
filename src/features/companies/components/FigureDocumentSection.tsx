'use client'

import { useState } from 'react'
import type { FigureDocument, ReconciliationStatus } from '../types'
import {
  attachFigureDocumentAction,
  updateReconciliationStatusAction,
  removeFigureDocumentAction,
} from '../actions/document.actions'
import { useToast } from '@/hooks/use-toast'
import { FileText, Plus, ExternalLink, Trash2, ShieldCheck, AlertTriangle, Clock, HelpCircle } from 'lucide-react'

import { FormSelect } from '@/components/ui/form-select'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface FigureDocumentSectionProps {
  companyId: string
  figureKey: string
  figureLabel: string
  documents: FigureDocument[]
}

const STATUS_CONFIG: Record<
  ReconciliationStatus,
  { label: string; badgeClass: string; icon: React.ReactNode }
> = {
  Reconciled: {
    label: 'Reconciled',
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    icon: <ShieldCheck className="w-3 h-3 text-emerald-600" />,
  },
  Pending: {
    label: 'Pending Review',
    badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
    icon: <Clock className="w-3 h-3 text-amber-600" />,
  },
  Discrepancy: {
    label: 'Discrepancy',
    badgeClass: 'bg-rose-50 text-rose-700 border-rose-200',
    icon: <AlertTriangle className="w-3 h-3 text-rose-600" />,
  },
  Unverified: {
    label: 'Unverified',
    badgeClass: 'bg-zinc-100 text-zinc-600 border-zinc-200',
    icon: <HelpCircle className="w-3 h-3 text-zinc-500" />,
  },
}

export function FigureDocumentSection({
  companyId,
  figureKey,
  figureLabel,
  documents,
}: FigureDocumentSectionProps) {
  const { toast } = useToast()
  const [adding, setAdding] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const [docName, setDocName] = useState('')
  const [docUrl, setDocUrl] = useState('')
  const [status, setStatus] = useState<ReconciliationStatus>('Reconciled')
  const [notes, setNotes] = useState('')

  const linkedDocs = documents.filter((d) => d.figure_key === figureKey)

  async function handleAddDocument(e: React.FormEvent) {
    e.preventDefault()
    if (!docName.trim() || !docUrl.trim()) return

    setSubmitting(true)
    const res = await attachFigureDocumentAction({
      companyId,
      figureKey,
      documentName: docName.trim(),
      fileUrl: docUrl.trim(),
      reconciliationStatus: status,
      reconciliationNotes: notes.trim() || null,
    })

    if (res.success) {
      toast({
        title: 'Source Document Attached',
        description: `Evidence linked to ${figureLabel}.`,
        type: 'success',
      })
      setDocName('')
      setDocUrl('')
      setNotes('')
      setAdding(false)
    } else {
      toast({
        title: 'Error attaching document',
        description: res.error ?? 'Something went wrong.',
        type: 'error',
      })
    }
    setSubmitting(false)
  }

  async function handleStatusChange(docId: string, newStatus: ReconciliationStatus) {
    const res = await updateReconciliationStatusAction(docId, companyId, newStatus)
    if (res.success) {
      toast({
        title: 'Reconciliation Status Updated',
        description: `Status changed to ${newStatus}`,
        type: 'success',
      })
    } else {
      toast({
        title: 'Error updating status',
        description: res.error ?? 'Failed to update.',
        type: 'error',
      })
    }
  }

  async function handleDelete(docId: string) {
    if (!confirm('Remove this source document link?')) return
    const res = await removeFigureDocumentAction(docId, companyId)
    if (res.success) {
      toast({
        title: 'Document Unlinked',
        description: 'Source document record removed.',
        type: 'success',
      })
    } else {
      toast({
        title: 'Error removing document',
        description: res.error ?? 'Failed to delete.',
        type: 'error',
      })
    }
  }

  return (
    <div className="mt-2 space-y-2 border-t border-zinc-100 pt-2">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
          <FileText className="w-3 h-3 text-zinc-400" />
          Evidence / Source Docs ({linkedDocs.length})
        </span>
        {!adding && (
          <Button
            type="button"
            variant="ghost"
            size="xs"
            onClick={() => setAdding(true)}
            className="text-primary hover:text-primary"
          >
            <Plus className="w-3 h-3" />
            Attach Evidence
          </Button>
        )}
      </div>

      {/* Linked Documents List */}
      {linkedDocs.length > 0 ? (
        <div className="space-y-1.5">
          {linkedDocs.map((doc) => {
            const statusInfo = STATUS_CONFIG[doc.reconciliation_status] || STATUS_CONFIG.Unverified
            return (
              <div
                key={doc.id}
                className="flex items-center justify-between p-2 rounded-md bg-zinc-50 border border-zinc-100 text-xs"
              >
                <div className="flex items-center gap-2 min-w-0 pr-2">
                  <a
                    href={doc.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-zinc-800 hover:text-[#1a23bd] truncate flex items-center gap-1 transition-colors"
                  >
                    {doc.document_name}
                    <ExternalLink className="w-3 h-3 text-zinc-400 shrink-0" />
                  </a>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <select
                    value={doc.reconciliation_status}
                    onChange={(e) =>
                      handleStatusChange(doc.id, e.target.value as ReconciliationStatus)
                    }
                    className={`text-[11px] font-medium px-2 py-0.5 rounded-full border flex items-center gap-1 cursor-pointer focus:outline-none ${statusInfo.badgeClass}`}
                  >
                    <option value="Reconciled">Reconciled</option>
                    <option value="Pending">Pending</option>
                    <option value="Discrepancy">Discrepancy</option>
                    <option value="Unverified">Unverified</option>
                  </select>

                  <button
                    type="button"
                    onClick={() => handleDelete(doc.id)}
                    className="text-zinc-400 hover:text-rose-600 transition-colors p-1"
                    title="Remove evidence link"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        !adding && (
          <p className="text-xs text-zinc-400 italic">No source document attached for this figure.</p>
        )
      )}

      {/* Add Document Inline Form */}
      {adding && (
        <form onSubmit={handleAddDocument} className="p-3 bg-zinc-50 border border-zinc-200 rounded-lg space-y-3 mt-2">
          <div className="space-y-1">
            <label className="text-[11px] font-medium text-zinc-500 uppercase">Document Title / Reference</label>
            <Input
              type="text"
              required
              placeholder="e.g. Executed SAFE Agreement 2024.pdf"
              value={docName}
              onChange={(e) => setDocName(e.target.value)}
              className="h-8 text-xs"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-medium text-zinc-500 uppercase">Document URL / Storage Link</label>
            <Input
              type="url"
              required
              placeholder="https://..."
              value={docUrl}
              onChange={(e) => setDocUrl(e.target.value)}
              className="h-8 text-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-zinc-500 uppercase">Reconciliation Status</label>
              <FormSelect
                value={status}
                onChange={(e) => setStatus(e.target.value as ReconciliationStatus)}
              >
                <option value="Reconciled">Reconciled</option>
                <option value="Pending">Pending Review</option>
                <option value="Discrepancy">Discrepancy</option>
                <option value="Unverified">Unverified</option>
              </FormSelect>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-medium text-zinc-500 uppercase">Reconciliation Note</label>
              <Input
                type="text"
                placeholder="e.g. Verified against bank wire"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="h-8 text-xs"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-1">
            <Button
              type="button"
              variant="ghost"
              size="xs"
              onClick={() => setAdding(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={submitting}
              size="xs"
            >
              {submitting ? 'Linking...' : 'Save Document'}
            </Button>
          </div>
        </form>
      )}
    </div>
  )
}
