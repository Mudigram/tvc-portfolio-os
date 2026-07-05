import { createServerClient } from '@/lib/supabase/server'
import { getCompanyExitReadiness } from '../services/exit-readiness.service'
import ExitReadinessTabView from './ExitReadinessTabView'

interface CompanyExitReadinessTabProps {
  companyId: string
}

export default async function CompanyExitReadinessTab({ companyId }: CompanyExitReadinessTabProps) {
  const supabase = await createServerClient()
  const data = await getCompanyExitReadiness(supabase, companyId)

  return (
    <ExitReadinessTabView
      companyId={companyId}
      initialData={data}
    />
  )
}