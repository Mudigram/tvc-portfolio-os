'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { UserRole } from '@/types/roles'
import { SignOutButton } from '@/features/auth/components/SignOutButton'
import { X, LayoutDashboard, Building2, Users2, LineChart, FileCheck, Briefcase, Send, LogOut, Settings } from 'lucide-react' // 💡 Added Settings & FileCheck icon

interface NavItem {
  label: string
  href: string
  icon: React.ComponentType<{ className?: string }>
}

const NAV: Record<UserRole, NavItem[]> = {
  admin: [
    { label: 'Dashboard',      href: '/dashboard',      icon: LayoutDashboard },
    { label: 'Companies',      href: '/companies',      icon: Building2 },
    { label: 'Founders',       href: '/founders',       icon: Users2 },
    { label: 'Exposure',       href: '/exposure',       icon: LineChart },
    { label: 'Reconciliation', href: '/reconciliation', icon: FileCheck },
    { label: 'Campaigns',      href: '/campaigns',      icon: Send }
  ],
  internal: [
    { label: 'Dashboard',      href: '/dashboard',      icon: LayoutDashboard },
    { label: 'Companies',      href: '/companies',      icon: Building2 },
    { label: 'Founders',       href: '/founders',       icon: Users2 },
    { label: 'Exposure',       href: '/exposure',       icon: LineChart },
    { label: 'Reconciliation', href: '/reconciliation', icon: FileCheck },
    { label: 'Campaigns',      href: '/campaigns',      icon: Send }
  ],
  angel: [
    { label: 'My Portfolio', href: '/portfolio', icon: Briefcase },
  ],
  founder: [
    { label: 'Dashboard',   href: '/founder-dashboard',  icon: LayoutDashboard },
    { label: 'My Company',  href: '/my-company', icon: Building2 },
    { label: 'Updates',     href: '/updates',    icon: Send },
  ],
}

interface SidebarProps {
  role: UserRole
  email: string
  isOpen: boolean
  isCollapsed: boolean 
  onClose: () => void
}

export default function Sidebar({ role, email, isOpen, isCollapsed, onClose }: SidebarProps) {
  const pathname = usePathname()
  const items = NAV[role]
  
  // 💡 Check if settings link matches current route path
  const isSettingsActive = pathname === '/settings' || pathname.startsWith('/settings/')

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 bg-zinc-950/40 backdrop-blur-sm z-40 lg:hidden animate-in fade-in duration-200" onClick={onClose} />
      )}

      {/* Dynamic aside wrapper changing its desktop width parameter smoothly */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 flex flex-col
        bg-zinc-950 border-r border-white/5
        py-6 transition-all duration-300 ease-in-out
        lg:translate-x-0 lg:sticky lg:top-0 lg:h-screen
        ${isOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'}
        ${isCollapsed ? 'w-16 px-3' : 'w-56 px-4'}
      `}>

        {/* Wordmark Block */}
        <div className={`mb-8 flex items-center justify-between ${isCollapsed ? 'justify-center px-0' : 'px-3'}`}>
          <span className={`font-bold tracking-[0.25em] text-white uppercase font-mono transition-all duration-200 ${isCollapsed ? 'text-[10px] tracking-normal' : 'text-xs'}`}>
            {isCollapsed ? 'TVC' : 'TVCLabs'}
          </span>
          <button onClick={onClose} className="lg:hidden p-1.5 text-zinc-500 hover:text-zinc-200 rounded transition-colors" type="button">
            <X className="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>

        {/* Dynamic Items Navigation */}
        <nav className="flex-1 space-y-1">
          {items.map((item) => {
            const active = pathname === item.href || pathname.startsWith(item.href + '/')
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                title={isCollapsed ? item.label : undefined}
                className={`
                  flex items-center h-9 rounded text-xs tracking-wide uppercase transition-all duration-150
                  font-semibold group relative
                  ${isCollapsed ? 'justify-center border-0' : 'px-3 border-l-2'}
                  ${active
                    ? 'bg-white/10 text-white border-[#1a23bd]'
                    : 'text-zinc-400 hover:text-zinc-100 hover:bg-white/5 border-transparent'
                  }
                `}
              >
                <Icon className={`w-4 h-4 shrink-0 transition-transform ${isCollapsed ? 'm-0' : 'mr-3'}`} />
                <span className={`transition-opacity duration-200 ${isCollapsed ? 'opacity-0 w-0 hidden' : 'opacity-100'}`}>
                  {item.label}
                </span>
              </Link>
            )
          })}
        </nav>

        {/* 💡 Utilities & Settings Section */}
        <div className="space-y-1 mb-2">
          <Link
            href="/settings"
            onClick={onClose}
            title={isCollapsed ? 'Settings' : undefined}
            className={`
              flex items-center h-9 rounded text-xs tracking-wide uppercase transition-all duration-150
              font-semibold group relative
              ${isCollapsed ? 'justify-center border-0' : 'px-3 border-l-2'}
              ${isSettingsActive
                ? 'bg-white/10 text-white border-[#1a23bd]'
                : 'text-zinc-400 hover:text-zinc-100 hover:bg-white/5 border-transparent'
              }
            `}
          >
            <Settings className={`w-4 h-4 shrink-0 transition-transform ${isCollapsed ? 'm-0' : 'mr-3'}`} />
            <span className={`transition-opacity duration-200 ${isCollapsed ? 'opacity-0 w-0 hidden' : 'opacity-100'}`}>
              Settings
            </span>
          </Link>
        </div>

        <div className="border-t border-white/10 mx-2 mb-4" />

        {/* Footer Configuration */}
        <div className={`space-y-3 ${isCollapsed ? 'px-0 text-center' : 'px-2'}`}>
          <div className={`space-y-1 ${isCollapsed ? 'hidden' : 'block'}`}>
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-widest bg-white/10 text-zinc-300 border border-white/5 font-mono">
              {role}
            </span>
            <p className="text-xs text-zinc-400 truncate font-medium font-mono">{email}</p>
          </div>

          {/* Adjusted SignOut block fallback logic for narrow icon-only states */}
          <SignOutButton className={`
            w-full h-8 flex items-center text-xs font-semibold
            text-zinc-500 hover:text-rose-400 hover:bg-rose-950/20 
            rounded border border-transparent hover:border-rose-900/30
            transition-all text-left cursor-pointer
            ${isCollapsed ? 'justify-center px-0' : 'px-2'}
          `}>
            {isCollapsed && <LogOut className="w-4 h-4 shrink-0 text-zinc-500 group-hover:text-rose-400" />}
          </SignOutButton>
        </div>

      </aside>
    </>
  )
}