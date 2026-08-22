import { notFound } from 'next/navigation'
import { getCompanyProfile } from '@/features/companies/services/companies.services'
import { getCompanyExposure } from '@/features/exposure/services/exposure.services'
import CompanyTabs from '@/features/companies/components/CompanyTabs'
import CompanyUpdatesTab from '@/features/monthly-updates/components/CompanyUpdatesTab'
import CompanyFundingTab from '@/features/funding/components/CompanyFundingTab'
import CompanyAdvisoryTab from '@/features/advisory/components/CompanyAdvisoryTab'
import CompanyExitReadinessTab from '@/features/exit-readiness/components/CompanyExitReadinessTab'
import CompanyDdrTab from '@/features/poem-ddr/components/CompanyDdrTab'
import CapTableTab from '@/features/cap-table/components/CapTableTab'
import CompanyExposureTab from '@/features/exposure/components/CompanyExposureTab'
import { getCompanyFundingData } from '@/features/funding/services/funding.service'
import { CompanyHeader } from '@/features/companies/components/CompanyHeader'

interface CompanyPageProps {
  params: Promise<{ id: string }>
}

export default async function CompanyPage({ params }: CompanyPageProps) {
  const resolvedParams = await params

  const company = await getCompanyProfile(resolvedParams.id)
  if (!company) notFound()

  const exposureRows = await getCompanyExposure(resolvedParams.id)
  const { rounds } = await getCompanyFundingData(resolvedParams.id)

  const exposureTabElement = (
    <CompanyExposureTab
      companyId={resolvedParams.id}
      rows={exposureRows}
      rounds={rounds}
    />
  )

  const updatesElement  = <CompanyUpdatesTab  companyId={resolvedParams.id} />
  const fundingElement  = <CompanyFundingTab  companyId={resolvedParams.id} />
  const advisoryElement = <CompanyAdvisoryTab companyId={resolvedParams.id} />
  const exitElement     = <CompanyExitReadinessTab companyId={resolvedParams.id} />
  const captableElement = <CapTableTab companyId={resolvedParams.id} companyName={company.name} />
  const ddrElement      = <CompanyDdrTab companyId={resolvedParams.id} />

  return (
    <div className="space-y-0">
      {/* ── Persistent company header ────────────────────────── */}
      <CompanyHeader company={company} />

      {/* ── Tabs + content ───────────────────────────────────── */}
      <div className="pt-6">
        <CompanyTabs
          company={company}
          exposureRows={exposureRows}
          exposureTabElement={exposureTabElement}
          updatesTabElement={updatesElement}
          fundingTabElement={fundingElement}
          advisoryTabElement={advisoryElement}
          exitTabElement={exitElement}
          captableTabElement={captableElement}
          ddrTabElement={ddrElement}
        />
      </div>
    </div>
  )
}