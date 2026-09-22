'use client'

import { useState } from 'react'
import Sidebar from '@/components/layout/Sidebar'
import Header from '@/components/layout/Header'
import type { UserRole } from '@/types/roles'

interface AppShellProps {
  role: UserRole
  email: string
  title?: string
  children: React.ReactNode
}

export default function AppShell({ role, email, title, children }: AppShellProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(false)

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <Sidebar
        role={role}
        email={email}
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        isCollapsed={isCollapsed}
      />

      <div className="flex min-w-0 flex-1 flex-col transition-all duration-300 ease-out">
        <Header
          title={title}
          onMenuToggle={() => setMobileMenuOpen(!mobileMenuOpen)}
          onDesktopToggle={() => setIsCollapsed(!isCollapsed)}
          isCollapsed={isCollapsed}
        />

        <main className="w-full flex-1 px-4 py-5 sm:px-6 lg:px-8 xl:px-10">
          <div className="mx-auto w-full max-w-[1600px]">{children}</div>
        </main>
      </div>
    </div>
  )
}