// ─── What a row from the monthly_updates table looks like ───────────────────
// This mirrors your database columns. Every field that comes back from Supabase
// gets a type here. If a column can be null in the DB, it's null here too.

export type UpdateStatus = 'Draft' | 'Submitted' | 'Verified' | 'Needs Correction'

export interface MonthlyUpdate {
  id: string
  company_id: string
  month: number           // 1–12
  year: number
  achievements: string
  challenges: string
  targets: string
  submitted_by: string
  submitted_at: string | null
  status: UpdateStatus
  review_notes?: string | null
  reviewed_at?: string | null
  reviewed_by?: string | null
  created_at: string
}

export interface ReportingTarget {
  id: string
  company_id: string
  month: number
  year: number
  target_revenue: number | null
  target_mrr: number | null
  key_milestones: string | null
  created_at: string
  created_by: string | null
}

// ─── What the form sends to the server action ───────────────────────────────
// A subset of MonthlyUpdate. The fields the user fills in.
// id, created_at, submitted_at are not here — the database or server sets those.

export interface CreateUpdateInput {
  company_id: string
  month: number
  year: number
  achievements: string
  challenges: string
  targets: string
  status?: UpdateStatus   // Optional — defaults to 'Draft' in the action
}

// ─── A computed summary the UI uses to show status banners ──────────────────
// Not a database shape — we compute this in the service from the raw rows.
// The UI shouldn't have to do this calculation itself.

export interface UpdateStatusInfo {
  hasCurrentPeriodUpdate: boolean   // Did they submit for this calendar month?
  hasRecentUpdate: boolean          // Was the last submission within 30 days?
  daysSinceLastUpdate: number | null
  lastUpdateDate: string | null
  currentPeriod: {
    month: number
    year: number
  }
}