'use server'

import { createServerClient } from '@/lib/supabase/server'
import { getClaims } from '@/features/auth/services/auth.server'

const RESEND_API_URL = 'https://api.resend.com/emails'
const FROM_ADDRESS = 'portfolio@tvclabs.com'

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
]

export interface SendReminderInput {
  companyId: string
  month: number
  year: number
  customMessage?: string
}

export async function sendReminderAction(
  input: SendReminderInput
): Promise<{ success: boolean; recipientEmail?: string; error?: string }> {
  const claims = await getClaims()
  if (!claims || (claims.role !== 'internal' && claims.role !== 'admin')) {
    return { success: false, error: 'Not authorised.' }
  }

  const supabase = await createServerClient()

  // 1. Fetch company and founder email
  const { data: company, error: compErr } = await supabase
    .from('companies')
    .select(`
      name,
      crm_founder_id,
      founders:crm_founder_id (
        full_name,
        email
      )
    `)
    .eq('id', input.companyId)
    .single()

  if (compErr || !company) {
    return { success: false, error: 'Company not found.' }
  }

  const founder = Array.isArray(company.founders) ? company.founders[0] : company.founders
  if (!founder?.email) {
    return { success: false, error: 'No founder email linked to this company.' }
  }

  const monthName = MONTH_NAMES[input.month - 1] || `Month ${input.month}`
  const periodLabel = `${monthName} ${input.year}`
  const apiKey = process.env.RESEND_API_KEY

  if (!apiKey) {
    console.warn('[sendReminder.action] RESEND_API_KEY is not set.')
    return {
      success: true,
      recipientEmail: founder.email,
      error: 'Simulated send (RESEND_API_KEY not configured). Email would go to: ' + founder.email,
    }
  }

  const subject = `Reminder: Submit Monthly Portfolio Update for ${company.name} (${periodLabel})`
  const bodyText = `
Hi ${founder.full_name || 'Founder'},

This is a friendly reminder from the TVCLabs Investment Team to submit your monthly portfolio update for ${periodLabel}.

${input.customMessage ? `Note from team: "${input.customMessage.trim()}"\n` : ''}
Please log in to your Founder Portal to complete your submission:
https://portfolio.tvclabs.com/updates

Thank you,
TVCLabs Investment Team
`

  try {
    const res = await fetch(RESEND_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: FROM_ADDRESS,
        to: founder.email,
        subject,
        text: bodyText,
      }),
    })

    if (!res.ok) {
      const errBody = await res.text()
      console.error('[sendReminder.action] Resend API error:', errBody)
      return { success: false, error: 'Resend delivery failed.' }
    }

    return { success: true, recipientEmail: founder.email }
  } catch (err: any) {
    console.error('[sendReminder.action] Exception:', err)
    return { success: false, error: err?.message || 'Failed to send email.' }
  }
}
