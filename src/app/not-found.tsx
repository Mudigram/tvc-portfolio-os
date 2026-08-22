import Link from 'next/link'
import {
  Building2,
  PieChart,
  Users,
  LayoutDashboard,
  ArrowLeft,
  FileQuestion,
  Search,
  ShieldAlert,
} from 'lucide-react'

export const metadata = {
  title: '404 - Record Not Found | TVCLabs Portfolio OS',
}

export default function NotFound() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col items-center justify-center p-6 relative overflow-hidden font-sans selection:bg-[#1a23bd] selection:text-white">
      {/* Background Subtle Radial Gradient & Grid Overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(26,35,189,0.15),rgba(255,255,255,0))]" />
      <div 
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
          backgroundSize: '24px 24px',
        }}
      />

      <div className="relative z-10 max-w-xl w-full text-center space-y-8">
        {/* Brand Tag / Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-900/80 border border-zinc-800 text-xs font-medium text-zinc-400 backdrop-blur-md">
          <ShieldAlert className="w-3.5 h-3.5 text-[#1a23bd]" />
          <span>Error 404 · Unresolved Master Ledger Target</span>
        </div>

        {/* Hero Visual Icon */}
        <div className="mx-auto w-20 h-20 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center shadow-2xl shadow-[#1a23bd]/10 group transition-all duration-300 hover:border-[#1a23bd]/50 hover:scale-105">
          <FileQuestion className="w-10 h-10 text-zinc-400 group-hover:text-white transition-colors" />
        </div>

        {/* Heading & Subtitle */}
        <div className="space-y-3">
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-white">
            Record Not Found
          </h1>
          <p className="text-sm sm:text-base text-zinc-400 max-w-md mx-auto leading-relaxed">
            The company profile, financial position, or asset parameter you are attempting to view does not exist in the active portfolio ledger.
          </p>
        </div>

        {/* Primary Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Link
            href="/dashboard"
            className="w-full sm:w-auto h-10 px-5 text-xs font-semibold text-white bg-[#1a23bd] hover:bg-[#151c9a] rounded-lg flex items-center justify-center gap-2 transition-all shadow-lg shadow-[#1a23bd]/25 active:scale-95"
          >
            <LayoutDashboard className="w-4 h-4" />
            Return to Dashboard
          </Link>
          <Link
            href="/companies"
            className="w-full sm:w-auto h-10 px-5 text-xs font-medium text-zinc-300 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 hover:text-white rounded-lg flex items-center justify-center gap-2 transition-colors active:scale-95"
          >
            <Building2 className="w-4 h-4 text-zinc-400" />
            Browse Companies
          </Link>
        </div>

        {/* Quick Navigation Traversal Grid */}
        <div className="pt-8 border-t border-zinc-900 space-y-3 text-left">
          <p className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider text-center">
            Portfolio Traversal Shortcuts
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Link
              href="/companies"
              className="p-3 rounded-lg bg-zinc-900/50 border border-zinc-800/80 hover:border-zinc-700 hover:bg-zinc-900 transition-all group"
            >
              <div className="flex items-center gap-2 text-xs font-semibold text-zinc-200 group-hover:text-white">
                <Building2 className="w-3.5 h-3.5 text-[#1a23bd]" />
                Companies
              </div>
              <p className="text-[11px] text-zinc-500 mt-1">Cap table & identity profiles</p>
            </Link>

            <Link
              href="/exposure"
              className="p-3 rounded-lg bg-zinc-900/50 border border-zinc-800/80 hover:border-zinc-700 hover:bg-zinc-900 transition-all group"
            >
              <div className="flex items-center gap-2 text-xs font-semibold text-zinc-200 group-hover:text-white">
                <PieChart className="w-3.5 h-3.5 text-[#1a23bd]" />
                Exposure
              </div>
              <p className="text-[11px] text-zinc-500 mt-1">Capital & instrument ledgers</p>
            </Link>

            <Link
              href="/founders"
              className="p-3 rounded-lg bg-zinc-900/50 border border-zinc-800/80 hover:border-zinc-700 hover:bg-zinc-900 transition-all group"
            >
              <div className="flex items-center gap-2 text-xs font-semibold text-zinc-200 group-hover:text-white">
                <Users className="w-3.5 h-3.5 text-[#1a23bd]" />
                Founders
              </div>
              <p className="text-[11px] text-zinc-500 mt-1">CRM & key contact directory</p>
            </Link>
          </div>
        </div>

        {/* Footer info */}
        <p className="text-[11px] text-zinc-600">
          TVCLabs Portfolio OS · Internal Sandbox Engine
        </p>
      </div>
    </div>
  )
}
