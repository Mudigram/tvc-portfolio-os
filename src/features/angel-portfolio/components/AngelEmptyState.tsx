import { Briefcase, Mail } from 'lucide-react'

export function AngelEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center px-6 bg-white border border-zinc-200/90 rounded-2xl shadow-xs max-w-lg mx-auto">
      <div className="w-12 h-12 rounded-xl bg-zinc-100 border border-zinc-200 flex items-center justify-center mb-5 text-zinc-600 shadow-2xs">
        <Briefcase className="w-5 h-5" />
      </div>
      <h2 className="text-base font-bold text-zinc-900 mb-2 tracking-tight">
        No Portfolio Positions Linked Yet
      </h2>
      <p className="text-xs sm:text-sm text-zinc-600 leading-relaxed max-w-sm mb-6">
        Your syndicate allocations and investments will appear here once TVCLabs associates your holding entity with your account.
      </p>
      <a
        href="mailto:invest@tvclabs.com?subject=Portfolio%20Position%20Allocation%20Inquiry"
        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-zinc-900 text-white text-xs font-semibold hover:bg-zinc-800 transition-colors shadow-2xs"
      >
        <Mail className="w-3.5 h-3.5" />
        <span>Contact Portfolio Administrator</span>
      </a>
    </div>
  )
}