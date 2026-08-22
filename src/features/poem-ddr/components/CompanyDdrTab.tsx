import { getCompanyDdrStatus } from '../services/ddr.service'
import DdrTabView from './DDRTabView'

interface CompanyDdrTabProps {
  companyId: string
}

export default async function CompanyDdrTab({ companyId }: CompanyDdrTabProps) {
  const data = await getCompanyDdrStatus(companyId)

  return (
    <DdrTabView
      companyId={companyId}
      initialData={data}
    />
  )
}