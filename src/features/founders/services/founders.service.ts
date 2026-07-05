import { createServerClient } from '@/lib/supabase/server'
import type { Founder, FounderListItem } from '@/features/founders/types'

export interface FounderFilters {
  search?: string
  industry?: string
  stage?: string
  linked?: 'linked' | 'unlinked'
  page?: number
}

const PAGE_SIZE = 25

export interface PaginatedFounders {
  founders: FounderListItem[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export async function getFounders(
  filters: FounderFilters = {}
): Promise<PaginatedFounders> {
  const supabase = await createServerClient()

  const page = filters.page ?? 1
  const from = (page - 1) * PAGE_SIZE
  const to = from + PAGE_SIZE - 1

  let query = supabase
    .from('founders')
    .select(`
      id,
      full_name,
      email,
      startup_name,
      industry,
      stage,
      city,
      country,
      ddr_status,
      updated_at,
      companies (
        id,
        name,
        portfolio_health
      )
    `, { count: 'exact' })
    .order('full_name')
    .range(from, to)

  if (filters.search) {
    query = query.or(
      `full_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%,startup_name.ilike.%${filters.search}%`
    )
  }

  if (filters.industry) query = query.eq('industry', filters.industry)
  if (filters.stage)    query = query.eq('stage', filters.stage)

  const { data, error, count } = await query

  if (error) {
    console.error('[founders.service] getFounders error:', error.message)
    return { founders: [], total: 0, page, pageSize: PAGE_SIZE, totalPages: 0 }
  }

  let founders = (data ?? []).map((row) => {
    const company = Array.isArray(row.companies) ? row.companies[0] : row.companies
    return {
      id: row.id,
      full_name: row.full_name,
      email: row.email,
      startup_name: row.startup_name ?? null,
      industry: row.industry ?? null,
      stage: row.stage ?? null,
      city: row.city ?? null,
      country: row.country ?? null,
      ddr_status: row.ddr_status ?? null,
      updated_at: row.updated_at ?? null,
      linked_company: company
        ? {
            id: company.id,
            name: company.name,
            portfolio_health: company.portfolio_health ?? null,
          }
        : null,
    }
  })

  // Filter linked/unlinked client-side after mapping
  // (Supabase doesn't support filtering on join presence easily)
  if (filters.linked === 'linked') {
    founders = founders.filter((f) => f.linked_company !== null)
  } else if (filters.linked === 'unlinked') {
    founders = founders.filter((f) => f.linked_company === null)
  }

  const total = count ?? 0

  return {
    founders,
    total,
    page,
    pageSize: PAGE_SIZE,
    totalPages: Math.ceil(total / PAGE_SIZE),
  }
}

export async function getFounderById(id: string): Promise<Founder | null> {
  const supabase = await createServerClient()

  const { data, error } = await supabase
    .from('founders')
    .select(`
      id,
      full_name,
      email,
      startup_name,
      phone,
      industry,
      stage,
      city,
      country,
      ddr_status,
      notes,
      linkedin_url,
      created_at,
      updated_at,
      companies (
        id,
        name,
        portfolio_health,
        monthly_updates (
          submitted_at,
          month,
          year,
          status
        )
      )
    `)
    .eq('id', id)
    .single()

  if (error || !data) {
    console.error('[founders.service] getFounderById error:', error?.message)
    return null
  }

  const company = Array.isArray(data.companies) ? data.companies[0] : data.companies

  // Determine if this month's update has been submitted
  let updateSubmittedThisCycle = false
  if (company?.monthly_updates) {
    const now = new Date()
    const currentMonth = now.getMonth() + 1
    const currentYear = now.getFullYear()
    const updates = Array.isArray(company.monthly_updates)
      ? company.monthly_updates
      : [company.monthly_updates]

    updateSubmittedThisCycle = updates.some(
      (u: { month: number; year: number; status: string }) =>
        u.month === currentMonth &&
        u.year === currentYear &&
        u.status === 'Submitted'
    )
  }

  return {
    id: data.id,
    full_name: data.full_name,
    email: data.email,
    startup_name: data.startup_name ?? null,
    phone: data.phone ?? null,
    industry: data.industry ?? null,
    stage: data.stage ?? null,
    city: data.city ?? null,
    country: data.country ?? null,
    ddr_status: data.ddr_status ?? null,
    notes: data.notes ?? null,
    linkedin_url: data.linkedin_url ?? null,
    created_at: data.created_at,
    updated_at: data.updated_at,
    linked_company: company
      ? {
          id: company.id,
          name: company.name,
          portfolio_health: company.portfolio_health ?? null,
          update_submitted_this_cycle: updateSubmittedThisCycle,
        }
      : null,
  }
}