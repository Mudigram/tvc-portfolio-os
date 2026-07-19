'use client'
// ─────────────────────────────────────────────────────────────
// ThresholdsTabView — editable alert threshold settings
// ─────────────────────────────────────────────────────────────

import { useState, useTransition } from 'react'
import { updateSettingAction } from '../actions/settings.actions'
import type { SettingsMap, SettingKey } from '../types'

interface Props {
  settings: SettingsMap
}

const inputClass =
  'w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 ' +
  'placeholder:text-zinc-400 focus:border-[#1a23bd] focus:outline-none ' +
  'focus:ring-2 focus:ring-[#1a23bd]/20 disabled:bg-zinc-50 disabled:text-zinc-400'

// Groups of settings displayed together
const THRESHOLD_GROUPS = [
  {
    heading: 'Cap table alerts',
    description: 'These thresholds determine when ownership alerts fire on the dashboard. Per-company overrides on the cap table record take precedence.',
    settings: [
      'founder_dilution_threshold',
      'tvc_dilution_threshold',
      'cap_table_stale_months',
    ] as SettingKey[],
    suffix: (key: SettingKey) =>
      key === 'cap_table_stale_months' ? 'months' : '%',
  },
  {
    heading: 'Update cycle',
    description: 'Controls when the dashboard flags companies as overdue or critical for POEM updates.',
    settings: [
      'update_cycle_warning_days',
      'update_cycle_critical_days',
    ] as SettingKey[],
    suffix: () => 'days',
  },
]

// ── Single editable setting row ───────────────────────────────
function SettingRow({
  settingKey,
  setting,
  suffix,
}: {
  settingKey: SettingKey
  setting: { value: string; label: string; description: string | null; updated_at: string }
  suffix: string
}) {
  const [value, setValue] = useState(setting.value)
  const [isPending, startTransition] = useTransition()
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isDirty = value !== setting.value

  function handleSave() {
    setError(null)
    setSaved(false)
    startTransition(async () => {
      const result = await updateSettingAction(settingKey, value)
      if (result.success) {
        setSaved(true)
        setTimeout(() => setSaved(false), 3000)
      } else {
        setError(result.error ?? 'Save failed')
      }
    })
  }

  return (
    <div className="flex items-start justify-between gap-6 py-5 border-b border-zinc-50 last:border-0">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-zinc-900">{setting.label}</p>
        {setting.description && (
          <p className="text-xs text-zinc-400 mt-0.5 leading-relaxed">
            {setting.description}
          </p>
        )}
        {error && (
          <p className="text-xs text-red-600 mt-1">{error}</p>
        )}
        <p className="text-[10px] text-zinc-300 mt-1">
          Last updated {new Date(setting.updated_at).toLocaleDateString('en-GB', {
            day: 'numeric', month: 'short', year: 'numeric',
          })}
        </p>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <div className="relative w-24">
          <input
            type="number"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            min="0"
            step="1"
            className={inputClass}
          />
        </div>
        <span className="text-xs text-zinc-400 w-10">{suffix}</span>
        {isDirty && (
          <button
            onClick={handleSave}
            disabled={isPending}
            className="rounded-lg bg-[#1a23bd] px-3 py-2 text-xs font-medium text-white hover:bg-[#1520a8] disabled:opacity-50 transition-colors whitespace-nowrap"
          >
            {isPending ? 'Saving…' : 'Save'}
          </button>
        )}
        {saved && !isDirty && (
          <span className="text-xs text-emerald-600 font-medium">✓ Saved</span>
        )}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────────────────────

export default function ThresholdsTabView({ settings }: Props) {
  return (
    <div className="space-y-10 max-w-2xl">
      {THRESHOLD_GROUPS.map((group) => (
        <div key={group.heading} className="rounded-xl border border-zinc-100 bg-white shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-zinc-50">
            <h3 className="text-sm font-semibold text-zinc-900">{group.heading}</h3>
            <p className="text-xs text-zinc-400 mt-0.5 leading-relaxed">
              {group.description}
            </p>
          </div>
          <div className="px-6">
            {group.settings.map((key) => {
              const setting = settings[key]
              if (!setting) return null
              return (
                <SettingRow
                  key={key}
                  settingKey={key}
                  setting={setting}
                  suffix={group.suffix(key)}
                />
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}