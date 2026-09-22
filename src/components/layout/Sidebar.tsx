'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { UserRole } from '@/types/roles'
import { SignOutButton } from '@/features/auth/components/SignOutButton'
import { X, LayoutDashboard, Building2, Users2, LineChart, FileCheck, Briefcase, Send, LogOut, Settings, MonitorPlay } from 'lucide-react'

interface NavItem {
  label: string
  href: string
  icon: React.ComponentType<{ className?: string }>
}

const NAV: Record<UserRole, NavItem[]> = {
  admin: [
    { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { label: 'Companies', href: '/companies', icon: Building2 },
    { label: 'Founders', href: '/founders', icon: Users2 },
    { label: 'Exposure', href: '/exposure', icon: LineChart },
    { label: 'Investor View', href: '/investor-snapshot', icon: MonitorPlay },
    { label: 'Reconciliation', href: '/reconciliation', icon: FileCheck },
    { label: 'Campaigns', href: '/campaigns', icon: Send },
  ],
  internal: [
    { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { label: 'Companies', href: '/companies', icon: Building2 },
    { label: 'Founders', href: '/founders', icon: Users2 },
    { label: 'Exposure', href: '/exposure', icon: LineChart },
    { label: 'Investor View', href: '/investor-snapshot', icon: MonitorPlay },
    { label: 'Reconciliation', href: '/reconciliation', icon: FileCheck },
    { label: 'Campaigns', href: '/campaigns', icon: Send },
  ],
  angel: [{ label: 'My Portfolio', href: '/portfolio', icon: Briefcase }],
  founder: [
    { label: 'Dashboard', href: '/founder-dashboard', icon: LayoutDashboard },
    { label: 'My Company', href: '/my-company', icon: Building2 },
    { label: 'Updates', href: '/updates', icon: Send },
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
  const isSettingsActive = pathname === '/settings' || pathname.startsWith('/settings/')

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 z-40 bg-slate-950/45 backdrop-blur-sm lg:hidden" onClick={onClose} />
      )}

      <aside
        className={[
          'fixed inset-y-0 left-0 z-50 flex flex-col border-r border-sidebar-border bg-sidebar py-5 text-sidebar-foreground transition-all duration-300 ease-out lg:sticky lg:top-0 lg:h-screen',
          isOpen ? 'translate-x-0 shadow-2xl shadow-slate-950/35' : '-translate-x-full lg:translate-x-0',
          isCollapsed ? 'w-20 px-2' : 'w-64 px-3',
        ].join(' ')}
      >
        <div className={`mb-7 flex items-center justify-between ${isCollapsed ? 'justify-center px-0' : 'px-2'}`}>
          <div
            className={[
              'flex items-center gap-2 font-mono font-bold uppercase tracking-[0.2em] text-white transition-all',
              isCollapsed ? 'text-[10px]' : 'text-[11px]',
            ].join(' ')}
          >
            <span className="inline-flex h-2.5 w-2.5 rounded-full bg-blue-400" />
            {isCollapsed ? 'TVC' : 'TVCLabs'}
          </div>

          <button
            onClick={onClose}
            type="button"
            className="rounded-md p-1.5 text-sidebar-foreground/60 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground lg:hidden"
            aria-label="Close menu"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <nav className="flex-1 space-y-1.5">
          {items.map((item) => {
            const active = pathname === item.href || pathname.startsWith(item.href + '/')
            const Icon = item.icon

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                title={isCollapsed ? item.label : undefined}
                className={[
                  'flex h-10 items-center rounded-xl border text-xs font-semibold uppercase tracking-widest transition-all duration-200',
                  isCollapsed ? 'justify-center border-transparent px-0' : 'border-transparent px-3',
                  active
                    ? 'border-blue-500/40 bg-blue-500/10 text-white shadow-inner shadow-blue-900/20'
                    : 'text-sidebar-foreground/60 hover:border-sidebar-border hover:bg-sidebar-accent hover:text-sidebar-foreground',
                ].join(' ')}
              >
                <Icon className={['h-4 w-4 shrink-0', isCollapsed ? 'm-0' : 'mr-3'].join(' ')} />
                {!isCollapsed && <span>{item.label}</span>}
              </Link>
            )
          })}
        </nav>

        <div className="mb-2 space-y-1.5">
          <Link
            href="/settings"
            onClick={onClose}
            title={isCollapsed ? 'Settings' : undefined}
            className={[
              'flex h-10 items-center rounded-xl border text-xs font-semibold uppercase tracking-widest transition-all duration-200',
              isCollapsed ? 'justify-center border-transparent px-0' : 'border-transparent px-3',
              isSettingsActive
                ? 'border-blue-500/40 bg-blue-500/10 text-white shadow-inner shadow-blue-900/20'
                : 'text-sidebar-foreground/60 hover:border-sidebar-border hover:bg-sidebar-accent hover:text-sidebar-foreground',
            ].join(' ')}
          >
            <Settings className={['h-4 w-4 shrink-0', isCollapsed ? 'm-0' : 'mr-3'].join(' ')} />
            {!isCollapsed && <span>Settings</span>}
          </Link>
        </div>

        <div className="mx-2 border-t border-sidebar-border pt-4" />

        <div className={['space-y-3', isCollapsed ? 'px-1' : 'px-2'].join(' ')}>
          {!isCollapsed && (
            <div className="space-y-1.5">
              <span className="inline-flex items-center rounded-full border border-sidebar-border bg-sidebar-accent px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest text-sidebar-foreground">
                {role}
              </span>
              <p className="truncate font-mono text-[11px] text-sidebar-foreground/50">{email}</p>
            </div>
          )}

          <SignOutButton
            className={[
              'flex h-9 items-center rounded-xl border border-transparent text-xs font-semibold text-sidebar-foreground/60 transition-all hover:border-rose-500/30 hover:bg-rose-500/5 hover:text-rose-300',
              isCollapsed ? 'justify-center px-0' : 'px-2.5',
            ].join(' ')}
          >
            {isCollapsed ? <LogOut className="h-4 w-4" /> : 'Sign out'}
          </SignOutButton>
        </div>
      </aside>
    </>
  )
}