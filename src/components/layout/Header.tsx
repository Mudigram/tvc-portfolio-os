'use client'

import { ChevronLeft, ChevronRight, Search, ShieldCheck, Menu } from 'lucide-react'

interface HeaderProps {
  title?: string
  onMenuToggle?: () => void
  onDesktopToggle?: () => void
  isCollapsed: boolean
}

export default function Header({ title, onMenuToggle, onDesktopToggle, isCollapsed }: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 h-16 shrink-0 border-b border-border bg-background/80 backdrop-blur-xl">
      <div className="flex h-full items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <button
            onClick={onMenuToggle}
            type="button"
            className="inline-flex rounded-lg border border-border bg-card p-2 text-muted-foreground transition-colors hover:border-border hover:text-foreground lg:hidden"
            aria-label="Open navigation menu"
          >
            <Menu className="h-4 w-4" />
          </button>

          <button
            onClick={onDesktopToggle}
            type="button"
            className="hidden rounded-lg border border-border bg-card p-2 text-muted-foreground transition-all hover:border-border hover:text-foreground lg:inline-flex"
            aria-label="Toggle compact workspace view"
          >
            {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>

          <div className="min-w-0">
            <p className="truncate text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground/80">
              TVCLabs Portfolio OS
            </p>
            <p className="truncate text-sm sm:text-base font-semibold text-foreground tracking-tight">
              {title ?? 'Overview'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 sm:gap-4">
          <button
            onClick={() => window.dispatchEvent(new Event('open-command-palette'))}
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-white/60 p-2 sm:px-2.5 sm:py-1.5 text-xs font-medium text-muted-foreground transition-all hover:border-zinc-300 hover:text-foreground hover:bg-white shadow-2xs"
            title="Quick Find (⌘K)"
          >
            <Search className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="hidden sm:inline">Quick Find</span>
            <kbd className="hidden sm:inline ml-1 rounded border border-border bg-zinc-50 px-1.5 py-0.5 font-mono text-[10px] font-bold text-muted-foreground">
              ⌘K
            </kbd>
          </button>

          <div className="h-4 w-px bg-border/80" />

          <div className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200/80 bg-emerald-50/80 px-2.5 py-1 text-xs font-medium text-emerald-700 shadow-2xs">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
            <span className="hidden md:inline text-[11px] font-semibold">Ledger Verified</span>
          </div>
        </div>
      </div>
    </header>
  )
}