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
  // New state tracking if the workspace layout is wide-canvas (sidebar collapsed)
  const [isCollapsed, setIsCollapsed] = useState(false)

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-white">

      <Sidebar
        role={role}
        email={email}
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        isCollapsed={isCollapsed}
      />

      {/* Main Content Area: Smoothly transitions its margin-left or width alignment */}
      <div className="flex flex-col flex-1 min-w-0 transition-all duration-300 ease-in-out">
        
        <Header
          title={title}
          onMenuToggle={() => setMobileMenuOpen(!mobileMenuOpen)}
          onDesktopToggle={() => setIsCollapsed(!isCollapsed)}
          isCollapsed={isCollapsed}
        />
        
        <main className="flex-1 max-w-[1600px] w-full px-6 lg:px-10 py-6">
          {children}
        </main>
      </div>

    </div>
  )
}