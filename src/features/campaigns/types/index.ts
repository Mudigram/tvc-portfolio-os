// ─────────────────────────────────────────────────────────────
// Campaigns — Types
// ─────────────────────────────────────────────────────────────

export type CampaignEmailType =
  | 'portfolio_update'
  | 'founder_checkin'
  | 'event_invite'
  | 'funding_milestone'
  | 'general'

export type CampaignStatus = 'draft' | 'sent' | 'failed'

export type RecipientPool =
  | 'angels'
  | 'founders_with_companies'
  | 'founders_crm_only'
  | 'all_founders'

export type RecipientType =
  | 'angel'
  | 'founder_portfolio'
  | 'founder_crm'
  | 'individual'

export type RecipientStatus = 'sent' | 'failed'

// ── DB rows ───────────────────────────────────────────────────
export interface Campaign {
  id: string
  title: string
  email_type: CampaignEmailType
  subject: string
  body: string
  recipient_pools: RecipientPool[]
  individual_emails: string[]
  status: CampaignStatus
  sent_by: string | null
  sent_at: string | null
  recipient_count: number | null
  created_at: string
}

export interface CampaignRecipient {
  id: string
  campaign_id: string
  email: string
  recipient_type: RecipientType
  status: RecipientStatus
  error_message: string | null
  sent_at: string
}

// ── Resolved recipient (before send) ─────────────────────────
export interface ResolvedRecipient {
  email: string
  type: RecipientType
  name: string | null
}

// ── Compose form values ───────────────────────────────────────
export interface CampaignFormValues {
  title: string
  email_type: CampaignEmailType
  subject: string
  body: string
  recipient_pools: RecipientPool[]
  individual_emails: string   // comma-separated string from textarea, parsed before send
}

// ── Send result ───────────────────────────────────────────────
export interface SendCampaignResult {
  success: boolean
  error?: string
  campaignId?: string
  sentCount?: number
  failedCount?: number
}

// ── History row (joined with sender email) ────────────────────
export interface CampaignHistoryRow extends Campaign {
  sender_email: string | null
}

// ── Email type display config ─────────────────────────────────
export const EMAIL_TYPE_CONFIG: Record<
  CampaignEmailType,
  { label: string; defaultSubject: string }
> = {
  portfolio_update:  { label: 'Portfolio update',       defaultSubject: 'Portfolio Update — ' },
  founder_checkin:   { label: 'Founder check-in',       defaultSubject: 'Monthly Update Reminder' },
  event_invite:      { label: 'Event invite',           defaultSubject: "You're Invited — " },
  funding_milestone: { label: 'Funding milestone',      defaultSubject: 'Portfolio News from TVCLabs' },
  general:           { label: 'General engagement',     defaultSubject: 'Message from TVCLabs' },
}

export const RECIPIENT_POOL_CONFIG: Record<
  RecipientPool,
  { label: string; description: string }
> = {
  angels: {
    label: 'Angels',
    description: 'All angel investors with portal access',
  },
  founders_with_companies: {
    label: 'Portfolio founders',
    description: 'Founders linked to a portfolio company',
  },
  founders_crm_only: {
    label: 'CRM founders',
    description: 'Founders in CRM not yet linked to a company',
  },
  all_founders: {
    label: 'All founders',
    description: 'All founders — portfolio + CRM',
  },
}