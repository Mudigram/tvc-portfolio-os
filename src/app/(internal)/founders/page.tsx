import { getFounders } from '@/features/founders/services/founders.service'
import { FoundersListView } from '@/features/founders/components/FounderListView'

export const metadata = {
  title: 'Founders — TVCLabs Portfolio OS',
}

interface FoundersPageProps {
  searchParams: Promise<{
    search?: string
    industry?: string
    stage?: string
    linked?: 'linked' | 'unlinked'
    page?: string
  }>
}

export default async function FoundersPage({ searchParams }: FoundersPageProps) {
  const params = await searchParams

  const result = await getFounders({
    search: params.search,
    industry: params.industry,
    stage: params.stage,
    linked: params.linked,
    page: params.page ? parseInt(params.page) : 1,
  })

  return <FoundersListView {...result} currentFilters={params} />
}