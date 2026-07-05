// src/features/monthly-updates/components/CompanyUpdatesTab.tsx

import { createServerClient } from '@/lib/supabase/server' // Safe to import here!
import { getCompanyUpdates, computeUpdateStatus } from '@/features/monthly-updates/services/monthly-updates.service'
import { UpdatesTabView } from '@/features/monthly-updates/components/UpdatesTabView'

interface CompanyUpdatesTabProps {
  companyId: string
}

export default async function CompanyUpdatesTab({ companyId }: CompanyUpdatesTabProps) {
  // Initialize the server-safe client here
  const supabase = await createServerClient()
  
  // Pass the client into the service function
  const updates = await getCompanyUpdates(supabase, companyId)
  const status = computeUpdateStatus(updates)

  return (
    <UpdatesTabView
      companyId={companyId}
      updates={updates}
      status={status}
    />
  )
}