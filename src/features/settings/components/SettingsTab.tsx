'use client'
// ─────────────────────────────────────────────────────────────
// SettingsTabs — tab nav shell
// Same slot pattern as CompanyTabs — tab content is pre-rendered
// as server component slots and passed in as React nodes.
// ─────────────────────────────────────────────────────────────

import { useState } from 'react'

const TABS = ['Thresholds', 'Users', 'TVC Entities'] as const
type Tab = typeof TABS[number]

interface SettingsTabsProps {
  thresholdsElement: React.ReactNode
  usersElement: React.ReactNode
  entitiesElement: React.ReactNode
}

export default function SettingsTabs({
  thresholdsElement,
  usersElement,
  entitiesElement,
}: SettingsTabsProps) {
  const [active, setActive] = useState<Tab>('Thresholds')

  return (
    <div className="space-y-8">
      {/* Tab bar */}
      <div className="flex items-center gap-0.5 border-b border-zinc-100">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActive(tab)}
            className={`
              px-4 py-2.5 text-sm transition-colors relative
              ${active === tab
                ? 'text-zinc-900 font-medium'
                : 'text-zinc-400 hover:text-zinc-700'
              }
            `}
          >
            {tab}
            {active === tab && (
              <span className="absolute bottom-0 left-0 right-0 h-px bg-[#1a23bd]" />
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div>
        {active === 'Thresholds'   && thresholdsElement}
        {active === 'Users'        && usersElement}
        {active === 'TVC Entities' && entitiesElement}
      </div>
    </div>
  )
}