import { getDashboardCompanies } from '@/features/companies/services/companies.services'
import { CompaniesListView } from '@/features/companies/components/CompaniesListView'

export const metadata = {
  title: 'Companies — TVCLabs Portfolio OS',
}

export default async function CompaniesPage() {
  const companies = await getDashboardCompanies()
  return <CompaniesListView companies={companies} />
}