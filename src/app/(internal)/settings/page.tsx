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
import SettingsTabs from '@/features/settings/components/SettingsTab'
import ThresholdsTabView from '@/features/settings/components/ThresholdsTabView'
import UsersTabView from '@/features/settings/components/UsersTabView'
import TvcEntitiesTabView from '@/features/settings/components/TVCEntitiesTabView'

export const metadata = {
  title: 'Settings — TVCLabs Portfolio OS',
}

export default async function SettingsPage() {
  const claims = await getClaims()

  // Hard guard — internal only, redirect anyone else
  if (!claims || claims.role !== 'internal') {
    redirect('/login')
  }

  // Parallel fetch all three data sources
  const [settings, users, entities] = await Promise.all([
    getAppSettings(),
    getManagedUsers(),
    getTvcEntities(),
  ])

  // Pre-render tab content as server component slots
  const thresholdsElement = <ThresholdsTabView settings={settings} />
  const usersElement      = <UsersTabView users={users} />
  const entitiesElement   = <TvcEntitiesTabView entities={entities} />

  return (
    <div className="space-y-8 max-w-[1200px] mx-auto py-2">

      {/* Page header */}
      <div className="border-b border-zinc-100 pb-6">
        <h1 className="text-xl font-semibold text-zinc-900 tracking-tight">
          Settings
        </h1>
        <p className="text-xs text-zinc-400 mt-1 uppercase tracking-wider font-medium">
          Platform configuration — internal access only
        </p>
      </div>

      <SettingsTabs
        thresholdsElement={thresholdsElement}
        usersElement={usersElement}
        entitiesElement={entitiesElement}
      />

    </div>
  )
}