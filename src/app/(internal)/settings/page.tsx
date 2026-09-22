// ─────────────────────────────────────────────────────────────
// Settings page — /settings
// Internal only. Fetches all data server-side, builds slots,
// passes to SettingsTabs client shell.
// ─────────────────────────────────────────────────────────────

import { redirect } from 'next/navigation'
import { getClaims } from '@/features/auth/services/auth.server'
import {
  getAppSettings,
  getManagedUsers,
  getTvcEntities,
} from '@/features/settings/settings.server'
import { getGovernanceGaps } from '@/features/exposure/services/governance-gaps.service'
import { GovernanceGapsCard } from '@/features/settings/components/GovernanceGapsCard'
import SettingsTabs from '@/features/settings/components/SettingsTab'
import ThresholdsTabView from '@/features/settings/components/ThresholdsTabView'
import UsersTabView from '@/features/settings/components/UsersTabView'
import TvcEntitiesTabView from '@/features/settings/components/TVCEntitiesTabView'

export const metadata = {
  title: 'Settings — TVCLabs Portfolio OS',
}

export default async function SettingsPage() {
  const claims = await getClaims()

  // Hard guard — internal or admin only
  if (!claims || (claims.role !== 'internal' && claims.role !== 'admin')) {
    redirect('/login')
  }

  const isAdmin = claims.role === 'admin'

  // Parallel fetch data sources + governance gaps if admin
  const [settings, users, entities, governanceGaps] = await Promise.all([
    getAppSettings(),
    getManagedUsers(),
    getTvcEntities(),
    isAdmin ? getGovernanceGaps() : Promise.resolve([]),
  ])

  // Pre-render tab content as server component slots
  const thresholdsElement = <ThresholdsTabView settings={settings} />
  const usersElement      = <UsersTabView users={users} />
  const entitiesElement   = <TvcEntitiesTabView entities={entities} />

  return (
    <div className="space-y-6 max-w-5xl mx-auto">

      {/* Page header */}
      <div className="border-b border-border pb-5">
        <h1 className="text-xl font-semibold text-foreground tracking-tight">
          Settings
        </h1>
        <p className="text-xs text-muted-foreground mt-1 uppercase tracking-wider font-medium">
          Platform configuration — internal & admin access
        </p>
      </div>

      {/* Admin Exclusive: Governance Gap Visibility Console */}
      {isAdmin && <GovernanceGapsCard gaps={governanceGaps} />}

      <SettingsTabs
        thresholdsElement={thresholdsElement}
        usersElement={usersElement}
        entitiesElement={entitiesElement}
      />

    </div>
  )
}