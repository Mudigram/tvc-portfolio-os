// ─────────────────────────────────────────────────────────────
// Cap Table tab — server component
// Route: /companies/[id]?tab=cap-table
//
// This sits inside the existing CompanyTabs shell.
// It fetches data server-side and hands it to the client view.
// Pattern: page.tsx (server) → CapTableClientView (client)
// ─────────────────────────────────────────────────────────────

import { notFound } from 'next/navigation'
import { getClaims } from '@/features/auth/services/auth.server'
import { getCapTableByCompanyId } from '@/features/cap-table/services/cap-table.server'
import CapTableClientView from '@/features/cap-table/components/CapTableClientView'

interface Props {
  companyId: string
  companyName: string
}

// Called from the parent company detail page when tab=cap-table
// is active. Pass companyId and companyName in as props so this
// component doesn't need to re-fetch the company record.
export default async function CapTableTab({ companyId, companyName }: Props) {
  const claims = await getClaims()

  // Founders have no access — guard here as well as in RLS
  if (!claims || claims.role === 'founder') {
    notFound()
  }

  const data = await getCapTableByCompanyId(companyId)

  let defaultFounderThreshold: number | null = null
  let defaultTvcThreshold: number | null = null
  try {
    const { getAppSettings } = await import('@/features/settings/settings.server')
    const settings = await getAppSettings()
    if (settings.founder_dilution_threshold?.value) {
      defaultFounderThreshold = parseFloat(settings.founder_dilution_threshold.value)
    }
    if (settings.tvc_dilution_threshold?.value) {
      defaultTvcThreshold = parseFloat(settings.tvc_dilution_threshold.value)
    }
  } catch (e) {
    console.warn('[CapTableTab] Could not load app_settings:', e)
  }

  // Angels: strip sensitive fields before passing to client
  // (amount_invested, notes — filtered here, not at DB layer)
  const safeData =
    claims.role === 'angel' && data
      ? {
          ...data,
          amount_invested: null,
          notes: null,
        }
      : data

  return (
    <CapTableClientView
      companyId={companyId}
      companyName={companyName}
      data={safeData}
      defaultFounderThreshold={defaultFounderThreshold}
      defaultTvcThreshold={defaultTvcThreshold}
    />
  )
}