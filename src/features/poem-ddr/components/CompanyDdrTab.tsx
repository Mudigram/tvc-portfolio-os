import { createServerClient } from '@/lib/supabase/server'
import { getCompanyDdrStatus } from '../services/ddr.service'
import DdrTabView from './DDRTabView'

interface CompanyDdrTabProps {
  companyId: string
}

export default async function CompanyDdrTab({ companyId }: CompanyDdrTabProps) {
  const supabase = await createServerClient()
  const data = await getCompanyDdrStatus(supabase, companyId)

  return (
    <DdrTabView
      companyId={companyId}
      initialData={data}
    />
  )
}