// src/features/monthly-updates/utils/csvParser.ts
import type { PoemMetrics } from '../types'

export interface ParsedPoemCsvResult {
  success: boolean
  month?: number
  year?: number
  metrics?: Partial<PoemMetrics>
  achievements?: string
  challenges?: string
  targets?: string
  rawRow?: Record<string, string>
  error?: string
}

/**
 * Standard headers mapping to internal field keys
 */
const HEADER_KEY_MAP: Record<string, keyof PoemMetrics | 'month' | 'year' | 'achievements' | 'challenges' | 'targets'> = {
  // Identification
  month: 'month',
  period_month: 'month',
  year: 'year',
  period_year: 'year',

  // Proposition
  'active customers': 'active_customers',
  active_customers: 'active_customers',
  'monthly user growth': 'monthly_user_growth_pct',
  'monthly user growth (%)': 'monthly_user_growth_pct',
  monthly_user_growth_pct: 'monthly_user_growth_pct',
  'user growth': 'monthly_user_growth_pct',
  'number of paying customers': 'paying_customers',
  'paying customers': 'paying_customers',
  paying_customers: 'paying_customers',
  'churn rate': 'churn_rate_pct',
  'churn rate (%)': 'churn_rate_pct',
  churn_rate_pct: 'churn_rate_pct',
  'retention rate': 'retention_rate_pct',
  'retention rate (%)': 'retention_rate_pct',
  retention_rate_pct: 'retention_rate_pct',
  'revenue growth': 'revenue_growth_pct',
  'revenue growth (%)': 'revenue_growth_pct',
  revenue_growth_pct: 'revenue_growth_pct',

  // Organization
  'team size': 'team_size',
  team_size: 'team_size',
  headcount: 'team_size',
  'founder commitment': 'founder_commitment',
  founder_commitment: 'founder_commitment',
  'reporting consistency': 'reporting_consistency',
  reporting_consistency: 'reporting_consistency',
  'reporting compliance': 'reporting_compliance',
  reporting_compliance: 'reporting_compliance',

  // Economics
  'monthly revenue': 'monthly_revenue',
  'monthly revenue ($)': 'monthly_revenue',
  monthly_revenue: 'monthly_revenue',
  revenue: 'monthly_revenue',
  'burn rate': 'burn_rate',
  'burn rate ($)': 'burn_rate',
  burn_rate: 'burn_rate',
  runway: 'runway_months',
  'runway (months)': 'runway_months',
  runway_months: 'runway_months',
  'ltv/cac ratio': 'ltv_cac_ratio',
  'ltv / cac ratio': 'ltv_cac_ratio',
  ltv_cac_ratio: 'ltv_cac_ratio',
  'ltv cac': 'ltv_cac_ratio',
  'operating margin': 'operating_margin_pct',
  'operating margin (%)': 'operating_margin_pct',
  operating_margin_pct: 'operating_margin_pct',
  arr: 'arr',
  'arr ($)': 'arr',
  'annual recurring revenue': 'arr',
  'gross margin': 'gross_margin_pct',
  'gross margin (%)': 'gross_margin_pct',
  gross_margin_pct: 'gross_margin_pct',

  // Milestones
  'targets completion rate': 'targets_completion_rate_pct',
  'targets completion rate (%)': 'targets_completion_rate_pct',
  targets_completion_rate_pct: 'targets_completion_rate_pct',
  'target completion': 'targets_completion_rate_pct',
  'key achievements': 'achievements',
  achievements: 'achievements',
  challenges: 'challenges',
  targets: 'targets',
}

/**
 * Sanitizes numeric string (e.g. "$1,500,000", "18.5%", "3.2x") into a standard number
 */
export function cleanNumericValue(val: unknown): number | null {
  if (val === null || val === undefined) return null
  if (typeof val === 'number') return isNaN(val) ? null : val

  const str = String(val).trim()
  if (!str || str === '—' || str === '-' || str.toLowerCase() === 'n/a') return null

  // Remove currency signs, commas, percentages, "x", and whitespace
  const sanitized = str.replace(/[$,%xX\s]/g, '')
  const num = Number(sanitized)
  return isNaN(num) ? null : num
}

/**
 * Parses CSV lines handling quoted values with embedded commas
 */
function splitCsvLine(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    if (char === '"' || char === "'") {
      inQuotes = !inQuotes
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim())
      current = ''
    } else {
      current += char
    }
  }
  result.push(current.trim())
  return result
}

/**
 * Parses CSV text representing POEM metrics into structured object
 */
export function parsePoemCsv(csvText: string): ParsedPoemCsvResult {
  try {
    const lines = csvText
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l.length > 0)

    if (lines.length < 2) {
      return {
        success: false,
        error: 'CSV must contain at least a header row and one data row.',
      }
    }

    const headers = splitCsvLine(lines[0]).map((h) => h.toLowerCase().trim())
    const dataValues = splitCsvLine(lines[1])

    const rawRow: Record<string, string> = {}
    const metrics: Partial<PoemMetrics> = {}
    let month: number | undefined
    let year: number | undefined
    let achievements: string | undefined
    let challenges: string | undefined
    let targets: string | undefined

    headers.forEach((header, idx) => {
      const val = dataValues[idx] ?? ''
      rawRow[header] = val

      const mappedKey = HEADER_KEY_MAP[header]
      if (!mappedKey) return

      if (mappedKey === 'month') {
        const m = cleanNumericValue(val)
        if (m && m >= 1 && m <= 12) month = Math.round(m)
      } else if (mappedKey === 'year') {
        const y = cleanNumericValue(val)
        if (y && y > 2000) year = Math.round(y)
      } else if (mappedKey === 'achievements') {
        achievements = val
      } else if (mappedKey === 'challenges') {
        challenges = val
      } else if (mappedKey === 'targets') {
        targets = val
      } else if (
        mappedKey === 'founder_commitment' ||
        mappedKey === 'reporting_consistency' ||
        mappedKey === 'reporting_compliance'
      ) {
        // Text status fields
        metrics[mappedKey] = val as any
      } else {
        // Numeric metric fields
        const num = cleanNumericValue(val)
        metrics[mappedKey] = num as any
      }
    })

    // Auto-convert cash runway to months if a user provides cash balance in the Runway column
    if (metrics.runway_months != null && metrics.runway_months >= 1000 && metrics.burn_rate && metrics.burn_rate > 0) {
      metrics.runway_months = Number((metrics.runway_months / metrics.burn_rate).toFixed(1))
    } else if (metrics.runway_months != null && metrics.runway_months > 9999.9) {
      metrics.runway_months = 9999.9
    }

    return {
      success: true,
      month,
      year,
      metrics,
      achievements,
      challenges,
      targets,
      rawRow,
    }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to parse CSV.',
    }
  }
}

/**
 * Generates ready-to-use CSV template for the PM or founder
 */
export function generatePoemCsvTemplate(companyName?: string): string {
  const headers = [
    'Month',
    'Year',
    'Active Customers',
    'Monthly User Growth (%)',
    'Number of Paying Customers',
    'Churn Rate (%)',
    'Retention Rate (%)',
    'Revenue Growth (%)',
    'Team Size',
    'Founder Commitment',
    'Reporting Consistency',
    'Reporting Compliance',
    'Monthly Revenue ($)',
    'Burn Rate ($)',
    'Runway (months)',
    'LTV/CAC Ratio',
    'Operating Margin (%)',
    'ARR ($)',
    'Gross Margin (%)',
    'Targets Completion Rate (%)',
    'Key Achievements',
    'Challenges',
    'Targets',
  ]

  const now = new Date()
  const currentMonth = now.getMonth() + 1
  const currentYear = now.getFullYear()

  const exampleRow = [
    currentMonth,
    currentYear,
    '1450',
    '18.5',
    '320',
    '2.4',
    '94.2',
    '21.0',
    '14',
    'Full-time',
    'High',
    'Compliant',
    '65000',
    '28000',
    '18',
    '3.8',
    '22.5',
    '780000',
    '74.0',
    '85.0',
    `"Closed major enterprise pilot and onboarded 20 tier-2 clients for ${companyName || 'Portfolio Co'}."`,
    '"Extended sales cycle in corporate procurement."',
    '"Launch self-service checkout and hit $75k MRR."',
  ]

  return [headers.join(','), exampleRow.join(',')].join('\n')
}
