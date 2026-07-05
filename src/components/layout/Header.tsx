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
    <header className="h-14 border-b border-zinc-100 bg-white flex items-center justify-between px-6 lg:px-10 shrink-0 sticky top-0 z-30">
      
      <div className="flex items-center gap-4 min-w-0">
        {/* Mobile Hamburger View Toggle */}
        <button
          onClick={onMenuToggle}
          type="button"
          className="lg:hidden p-1 text-zinc-500 hover:text-zinc-800 rounded-md transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Premium Desktop Canvas Toggle Arrow */}
        <button
          onClick={onDesktopToggle}
          type="button"
          className="hidden lg:flex p-1 text-zinc-400 hover:text-zinc-800 rounded bg-zinc-50 border border-zinc-200/60 transition-all hover:bg-zinc-100"
          aria-label="Toggle compact workspace view"
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>

        <p className="text-sm font-semibold text-zinc-900 truncate">
          {title ?? 'Portfolio OS'}
        </p>
      </div>

      {/* Right side status indicators persist unchanged */}
      <div className="flex items-center gap-6">
        <button className="hidden md:flex items-center gap-2 text-zinc-400 hover:text-zinc-600 text-xs font-medium">
          <Search className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>Quick Find…</span>
          <kbd className="bg-zinc-100 text-[10px] font-mono px-1.5 py-0.5 rounded border border-zinc-200/60 font-bold ml-1">⌘K</kbd>
        </button>
        <div className="hidden md:block h-4 w-px bg-zinc-200/80" />
        <div className="flex items-center justify-center text-emerald-600 bg-emerald-50/50 border border-emerald-100 p-1.5 rounded-md">
          <ShieldCheck className="w-4 h-4 stroke-[2.5]" />
        </div>
      </div>

    </header>
  )
}