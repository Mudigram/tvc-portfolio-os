// src/features/monthly-updates/types/index.ts

export type UpdateStatus = 'Draft' | 'Submitted' | 'Verified' | 'Reviewed' | 'Needs Correction'

// ─── POEM KPI Framework ─────────────────────────────────────────────────────
export interface PoemMetrics {
  // 1. Proposition
  active_customers?: number | null
  monthly_user_growth_pct?: number | null
  paying_customers?: number | null
  churn_rate_pct?: number | null
  retention_rate_pct?: number | null
  revenue_growth_pct?: number | null

  // 2. Organization
  team_size?: number | null
  founder_commitment?: 'Full-time' | 'Part-time' | 'Transitioning' | 'Other' | string | null
  reporting_consistency?: 'High' | 'Medium' | 'Low' | string | null
  reporting_compliance?: 'Compliant' | 'Needs Review' | 'Non-Compliant' | string | null

  // 3. Economics
  monthly_revenue?: number | null
  burn_rate?: number | null
  runway_months?: number | null
  ltv_cac_ratio?: number | null
  operating_margin_pct?: number | null
  arr?: number | null
  gross_margin_pct?: number | null

  // 4. Milestones
  targets_completion_rate_pct?: number | null
}

export interface MonthlyUpdate extends PoemMetrics {
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
export interface CreateUpdateInput extends PoemMetrics {
  company_id: string
  month: number
  year: number
  achievements?: string
  challenges?: string
  targets?: string
  status?: UpdateStatus   // Optional — defaults to 'Draft' in the action
}

// ─── A computed summary the UI uses to show status banners ──────────────────
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
