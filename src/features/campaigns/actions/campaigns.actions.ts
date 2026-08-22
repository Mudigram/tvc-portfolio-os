'use server'
// ─────────────────────────────────────────────────────────────
// Campaigns — Server Actions
// previewRecipientsAction: resolves recipient list for preview
// sendCampaignAction: sends via Resend, logs to DB
// ─────────────────────────────────────────────────────────────

import { revalidatePath } from 'next/cache'
import { createServerClient } from '@/lib/supabase/server'
import { getClaims } from '@/features/auth/services/auth.server'
import { resolveRecipients } from '../services/campaigns.server'
import type {
  RecipientPool,
  ResolvedRecipient,
  SendCampaignResult,
  CampaignEmailType,
} from '../types'

const RESEND_API_URL = 'https://api.resend.com/emails'
const FROM_ADDRESS = 'portfolio@tvclabs.com'

// ── Parse pools from form ─────────────────────────────────────
function parsePools(formData: FormData): RecipientPool[] {
  const pools: RecipientPool[] = []
  const allPools: RecipientPool[] = [
    'angels',
    'founders_with_companies',
    'founders_crm_only',
    'all_founders',
  ]
  for (const pool of allPools) {
    if (formData.get(`pool_${pool}`) === 'on') pools.push(pool)
  }
  return pools
}

// ── Parse individual emails from comma-separated string ───────
function parseIndividualEmails(raw: string): string[] {
  return raw
    .split(/[\n,]+/)
    .map((e) => e.trim().toLowerCase())
    .filter((e) => e.includes('@'))
}

// ── 1. Preview recipients ─────────────────────────────────────
// Returns resolved list — no email sent, no DB write.
export async function previewRecipientsAction(
  formData: FormData,
): Promise<{ recipients: ResolvedRecipient[]; error?: string }> {
  const claims = await getClaims()
  if (!claims || (claims.role !== 'internal' && claims.role !== 'admin')) {
    return { recipients: [], error: 'Unauthorised' }
  }

  const pools = parsePools(formData)
  const individualRaw = (formData.get('individual_emails') as string) ?? ''
  const individualEmails = parseIndividualEmails(individualRaw)

  if (pools.length === 0 && individualEmails.length === 0) {
    return { recipients: [], error: 'Select at least one recipient pool or add individual emails' }
  }

  const recipients = await resolveRecipients(pools, individualEmails)
  return { recipients }
}

// ── 2. Send campaign ──────────────────────────────────────────
export async function sendCampaignAction(
  formData: FormData,
): Promise<SendCampaignResult> {
  const claims = await getClaims()
  if (!claims || (claims.role !== 'internal' && claims.role !== 'admin')) {
    return { success: false, error: 'Unauthorised' }
  }

  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    return {
      success: false,
      error: 'Resend API key not configured. Add RESEND_API_KEY to your .env file.',
    }
  }

  // ── Parse form ────────────────────────────────────────────
  const title      = (formData.get('title') as string)?.trim()
  const email_type = formData.get('email_type') as CampaignEmailType
  const subject    = (formData.get('subject') as string)?.trim()
  const body       = (formData.get('body') as string)?.trim()

  if (!title || !email_type || !subject || !body) {
    return { success: false, error: 'Title, email type, subject and body are all required' }
  }

  const pools = parsePools(formData)
  const individualRaw = (formData.get('individual_emails') as string) ?? ''
  const individualEmails = parseIndividualEmails(individualRaw)

  if (pools.length === 0 && individualEmails.length === 0) {
    return { success: false, error: 'Select at least one recipient pool or add individual emails' }
  }

  // ── Resolve recipients (fresh at send time) ───────────────
  const recipients = await resolveRecipients(pools, individualEmails)

  if (recipients.length === 0) {
    return { success: false, error: 'No recipients found for the selected pools' }
  }

  // ── Derive sender display name from email ─────────────────
  const senderName = claims.email.split('@')[0]
  const fromField  = `${senderName} via TVCLabs <${FROM_ADDRESS}>`

  // ── Create campaign record (draft) ────────────────────────
  const supabase = await createServerClient()

  const { data: campaign, error: campaignError } = await supabase
    .from('campaigns')
    .insert({
      title,
      email_type,
      subject,
      body,
      recipient_pools: pools,
      individual_emails: individualEmails,
      status: 'draft',
      sent_by: claims.userId,
    })
    .select('id')
    .single()

  if (campaignError || !campaign) {
    console.error('[campaigns] create error:', campaignError?.message)
    return { success: false, error: 'Failed to create campaign record' }
  }

  // ── Send emails via Resend ────────────────────────────────
  let sentCount = 0
  let failedCount = 0
  const recipientLogs: {
    campaign_id: string
    email: string
    recipient_type: string
    status: string
    error_message: string | null
    sent_at: string
  }[] = []

  for (const recipient of recipients) {
    try {
      const response = await fetch(RESEND_API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: fromField,
          to: [recipient.email],
          subject,
          text: body,
        }),
      })

      const resData = await response.json()

      if (!response.ok) {
        failedCount++
        recipientLogs.push({
          campaign_id: campaign.id,
          email: recipient.email,
          recipient_type: recipient.type,
          status: 'failed',
          error_message: resData?.message ?? 'Send failed',
          sent_at: new Date().toISOString(),
        })
      } else {
        sentCount++
        recipientLogs.push({
          campaign_id: campaign.id,
          email: recipient.email,
          recipient_type: recipient.type,
          status: 'sent',
          error_message: null,
          sent_at: new Date().toISOString(),
        })
      }
    } catch (err) {
      failedCount++
      recipientLogs.push({
        campaign_id: campaign.id,
        email: recipient.email,
        recipient_type: recipient.type,
        status: 'failed',
        error_message: err instanceof Error ? err.message : 'Unknown error',
        sent_at: new Date().toISOString(),
      })
    }
  }

  // ── Log all recipient statuses ────────────────────────────
  if (recipientLogs.length > 0) {
    await supabase.from('campaign_recipients').insert(recipientLogs)
  }

  // ── Update campaign to sent/failed ────────────────────────
  const finalStatus = failedCount === recipients.length ? 'failed'
    : 'sent'

  await supabase
    .from('campaigns')
    .update({
      status: finalStatus,
      sent_at: new Date().toISOString(),
      recipient_count: sentCount,
    })
    .eq('id', campaign.id)

  revalidatePath('/campaigns')

  return {
    success: finalStatus !== 'failed',
    campaignId: campaign.id,
    sentCount,
    failedCount,
  }
}