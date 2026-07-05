import { createServerClient } from '@/lib/supabase/server'
import { getCompanyAdvisoryData } from '../services/advisory.service'
import AdvisoryTabView from './AdvisoryTabView'

interface CompanyAdvisoryTabProps {
  companyId: string
}

export default async function CompanyAdvisoryTab({ companyId }: CompanyAdvisoryTabProps) {
  const supabase = await createServerClient()
  const { activities, roster } = await getCompanyAdvisoryData(supabase, companyId)

  return (
    <AdvisoryTabView
      companyId={companyId}
      activities={activities}
      roster={roster}
    />
  )
}