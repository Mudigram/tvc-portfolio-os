'use server'

import { createServerClient } from '@/lib/supabase/server'

export type GlobalSearchResult = {
  id: string
  type: 'company' | 'founder'
  title: string
  subtitle?: string
  href: string
}

export async function globalSearchAction(query: string): Promise<GlobalSearchResult[]> {
  if (!query || query.trim() === '') return []

  const supabase = await createServerClient()
  const formattedQuery = `%${query.trim()}%`

  // We'll perform two parallel searches
  const [companiesRes, foundersRes] = await Promise.all([
    supabase
      .from('companies')
      .select('id, name, sector')
      .ilike('name', formattedQuery)
      .limit(5),
    supabase
      .from('founders')
      .select('id, full_name, startup_name')
      .ilike('full_name', formattedQuery)
      .limit(5)
  ])

  const results: GlobalSearchResult[] = []

  if (companiesRes.data) {
    companiesRes.data.forEach(c => {
      results.push({
        id: `comp_${c.id}`,
        type: 'company',
        title: c.name,
        subtitle: c.sector || 'Company',
        href: `/companies/${c.id}`
      })
    })
  }

  if (foundersRes.data) {
    foundersRes.data.forEach(f => {
      results.push({
        id: `fnd_${f.id}`,
        type: 'founder',
        title: f.full_name,
        subtitle: f.startup_name ? `Founder @ ${f.startup_name}` : 'Founder',
        href: `/founders/${f.id}`
      })
    })
  }

  return results
}
