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
            <p className="truncate text-sm font-semibold uppercase tracking-widest text-muted-foreground">
              Portfolio OS
            </p>
            <p className="truncate text-sm font-semibold text-foreground sm:text-base">
              {title ?? 'Overview'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={() => window.dispatchEvent(new Event('open-command-palette'))}
            className="hidden items-center gap-2 rounded-lg border border-border bg-muted px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-border hover:text-foreground md:inline-flex"
          >
            <Search className="h-3.5 w-3.5" />
            <span>Quick Find</span>
            <kbd className="ml-1 rounded border border-border bg-card px-1.5 py-0.5 font-mono text-[10px] font-bold text-muted-foreground">
              ⌘K
            </kbd>
          </button>

          <div className="hidden h-5 w-px bg-border md:block" />

          <div className="inline-flex items-center justify-center rounded-lg border border-emerald-200 bg-emerald-50 p-2 text-emerald-600">
            <ShieldCheck className="h-4 w-4" />
          </div>
        </div>
      </div>
    </header>
  )
}