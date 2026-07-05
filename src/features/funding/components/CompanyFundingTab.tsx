import { createServerClient } from '@/lib/supabase/server'
import { getCompanyFundingData, computeFundingSummary } from '../services/funding.service'
import FundingTabView from './FundingTabView'

interface CompanyFundingTabProps {
  companyId: string
}

export default async function CompanyFundingTab({ companyId }: CompanyFundingTabProps) {
  // Initialize the authenticated server-safe client context
  const supabase = await createServerClient()
  
  // Concurrently load history array and current active tracking metrics
  const { rounds, status } = await getCompanyFundingData(supabase, companyId)
  
  // Transform data points into aggregated analytics summary properties
  const summary = computeFundingSummary(rounds, status)

  return (
    <FundingTabView
      companyId={companyId}
      initialStatus={status}
      rounds={rounds}
      summary={summary}
    />
  )
}