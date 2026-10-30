'use client'

import { useState } from 'react'
import type { AngelActivityEvent } from '@/features/angel-portfolio/types'
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { AngelActivityFeed } from '@/features/angel-portfolio/components/AngelActivityFeed'
import { AngelPulseRibbon } from '@/features/angel-portfolio/components/detail/AngelPulseRibbon'
import { Bell, Sparkles } from 'lucide-react'

interface AngelActivityDrawerProps {
  events: AngelActivityEvent[]
}

export function AngelActivityDrawer({ events }: AngelActivityDrawerProps) {
  const [open, setOpen] = useState(false)
  const count = events.length

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button
          type="button"
          aria-label="View recent portfolio activity"
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-zinc-200 bg-white hover:bg-zinc-50 hover:border-zinc-300 text-xs font-semibold text-zinc-700 transition-colors shadow-2xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 min-h-[38px] cursor-pointer"
        >
          <Bell className="w-3.5 h-3.5 text-zinc-500" />
          <span>Activity Stream</span>
          {count > 0 && (
            <span className="inline-flex items-center justify-center px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
              {count}
            </span>
          )}
        </button>
      </SheetTrigger>

      <SheetContent side="right" className="w-full sm:max-w-md p-0 flex flex-col bg-white">
        <SheetHeader className="p-5 border-b border-zinc-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-700">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <SheetTitle className="text-base font-bold text-zinc-900 tracking-tight">
                Portfolio Activity &amp; Briefings
              </SheetTitle>
              <SheetDescription className="text-xs text-zinc-500 mt-0.5">
                Past 90 days across your TVCLabs holdings.
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <div className="p-5 overflow-y-auto flex-1 space-y-4">
          <AngelPulseRibbon events={events} />
          <AngelActivityFeed events={events} onItemClick={() => setOpen(false)} />
        </div>
      </SheetContent>
    </Sheet>
  )
}
