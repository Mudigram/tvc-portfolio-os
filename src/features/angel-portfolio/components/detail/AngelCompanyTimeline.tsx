'use client'

import { useState } from 'react'
import type { HealthStatus } from '@/features/angel-portfolio/types'
import { Calendar, ShieldCheck, FileText, CheckCircle2, AlertTriangle, Layers } from 'lucide-react'

export interface TimelineEvent {
  id: string
  date: string
  type: 'round' | 'health' | 'briefing'
  title: string
  description?: string
  status?: string
}

interface AngelCompanyTimelineProps {
  events: TimelineEvent[]
}

const TYPE_CONFIG = {
  round:    { icon: Layers,       bg: 'bg-blue-50',    text: 'text-blue-700',  border: 'border-blue-200' },
  health:   { icon: ShieldCheck,  bg: 'bg-amber-50',   text: 'text-amber-700', border: 'border-amber-200' },
  briefing: { icon: FileText,     bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
}

function formatDate(iso: string): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export function AngelCompanyTimeline({ events }: AngelCompanyTimelineProps) {
  const [filter, setFilter] = useState<'all' | 'round' | 'health' | 'briefing'>('all')

  const filtered = filter === 'all' ? events : events.filter((e) => e.type === filter)

  if (events.length === 0) {
    return (
      <div className="py-8 text-center text-zinc-500 text-xs">
        No recorded governance or funding milestones on ledger yet.
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Micro-Filter Chips */}
      <div className="flex items-center gap-1.5 pb-2">
        {(['all', 'round', 'health', 'briefing'] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setFilter(tab)}
            className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors cursor-pointer capitalize ${
              filter === tab
                ? 'bg-zinc-900 text-white'
                : 'bg-zinc-100 text-zinc-600 hover:text-zinc-900'
            }`}
          >
            {tab === 'all' ? 'All Milestones' : tab === 'round' ? 'Funding' : tab === 'health' ? 'Governance' : 'Briefings'}
          </button>
        ))}
      </div>

      {/* Timeline Stream */}
      <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-px before:bg-zinc-200">
        {filtered.map((item) => {
          const config = TYPE_CONFIG[item.type]
          const Icon = config.icon

          return (
            <div key={item.id} className="relative group">
              {/* Timeline marker */}
              <div
                className={`absolute -left-6 top-0.5 w-5 h-5 rounded-md ${config.bg} ${config.text} border ${config.border} flex items-center justify-center`}
              >
                <Icon className="w-3 h-3" />
              </div>

              {/* Event Body */}
              <div className="bg-white border border-zinc-200/80 rounded-xl p-3.5 shadow-2xs hover:border-zinc-300 transition-colors">
                <div className="flex items-baseline justify-between gap-2">
                  <h4 className="text-xs font-bold text-zinc-900 tracking-tight">
                    {item.title}
                  </h4>
                  <span className="text-[11px] font-mono text-zinc-500 shrink-0">
                    {formatDate(item.date)}
                  </span>
                </div>

                {item.description && (
                  <p className="text-xs text-zinc-600 mt-1 leading-relaxed">
                    {item.description}
                  </p>
                )}

                {item.status && (
                  <span className="inline-block mt-2 px-2 py-0.5 rounded text-[10px] font-semibold bg-zinc-100 text-zinc-700">
                    {item.status}
                  </span>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
