// ─── What a row from the monthly_updates table looks like ───────────────────
// This mirrors your database columns. Every field that comes back from Supabase
// gets a type here. If a column can be null in the DB, it's null here too.

export type UpdateStatus = 'Draft' | 'Submitted' | 'Reviewed'

export interface MonthlyUpdate {
  id: string
  company_id: string
  month: number           // 1–12. Not a Date — just a number. Easier to work with.
  year: number
  achievements: string
  challenges: string
  targets: string
  submitted_by: string    // Email of whoever submitted it
  submitted_at: string | null   // null if it's still a Draft
  status: UpdateStatus
  created_at: string
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