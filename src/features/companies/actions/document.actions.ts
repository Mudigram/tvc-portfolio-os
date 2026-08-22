'use server'

import { revalidatePath } from 'next/cache'
import { createServerClient } from '@/lib/supabase/server'
import { getClaims } from '@/features/auth/services/auth.server'
import type { ReconciliationStatus } from '../types'

export interface AttachDocumentInput {
  companyId: string
  figureKey: string
  documentName: string
  fileUrl: string
  filePath?: string | null
  fileSize?: number | null
  mimeType?: string | null
  reconciliationStatus?: ReconciliationStatus
  reconciliationNotes?: string | null
}

export async function attachFigureDocumentAction(
  input: AttachDocumentInput
): Promise<{ success: boolean; error?: string; documentId?: string }> {
  const claims = await getClaims()
  if (!claims) return { success: false, error: 'Not authenticated.' }
  if (claims.role !== 'internal' && claims.role !== 'admin') return { success: false, error: 'Not authorised.' }

  if (!input.companyId || !input.figureKey || !input.documentName || !input.fileUrl) {
    return { success: false, error: 'Required document fields missing.' }
  }

  const supabase = await createServerClient()

  const { data, error } = await supabase
    .from('company_figure_documents')
    .insert({
      company_id: input.companyId,
      figure_key: input.figureKey,
      document_name: input.documentName.trim(),
      file_url: input.fileUrl.trim(),
      file_path: input.filePath || null,
      file_size: input.fileSize || null,
      mime_type: input.mimeType || null,
      uploaded_by: claims.userId,
      reconciliation_status: input.reconciliationStatus || 'Reconciled',
      reconciliation_notes: input.reconciliationNotes?.trim() || null,
    })
    .select('id')
    .single()

  if (error) {
    console.error('[attachFigureDocumentAction] error:', error.message)
    return { success: false, error: 'Failed to attach document.' }
  }

  revalidatePath(`/companies/${input.companyId}`)
  return { success: true, documentId: data.id }
}

export async function updateReconciliationStatusAction(
  documentId: string,
  companyId: string,
  status: ReconciliationStatus,
  notes?: string | null
): Promise<{ success: boolean; error?: string }> {
  const claims = await getClaims()
  if (!claims) return { success: false, error: 'Not authenticated.' }
  if (claims.role !== 'internal' && claims.role !== 'admin') return { success: false, error: 'Not authorised.' }

  const supabase = await createServerClient()

  const { error } = await supabase
    .from('company_figure_documents')
    .update({
      reconciliation_status: status,
      reconciliation_notes: notes?.trim() || null,
    })
    .eq('id', documentId)

  if (error) {
    console.error('[updateReconciliationStatusAction] error:', error.message)
    return { success: false, error: 'Failed to update status.' }
  }

  revalidatePath(`/companies/${companyId}`)
  return { success: true }
}

export async function removeFigureDocumentAction(
  documentId: string,
  companyId: string
): Promise<{ success: boolean; error?: string }> {
  const claims = await getClaims()
  if (!claims) return { success: false, error: 'Not authenticated.' }
  if (claims.role !== 'internal' && claims.role !== 'admin') return { success: false, error: 'Not authorised.' }

  const supabase = await createServerClient()

  const { error } = await supabase
    .from('company_figure_documents')
    .delete()
    .eq('id', documentId)

  if (error) {
    console.error('[removeFigureDocumentAction] error:', error.message)
    return { success: false, error: 'Failed to delete document.' }
  }

  revalidatePath(`/companies/${companyId}`)
  return { success: true }
}
