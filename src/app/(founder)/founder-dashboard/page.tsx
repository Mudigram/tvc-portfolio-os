import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getClaims } from '@/features/auth/services/auth.server'
import { getFounderCompanyId, getFounderCompanyData, getFounderRowByUserId } from '@/features/founder-portal/services/founder-portal.service'
import { getCompanyUpdates, computeUpdateStatus } from '@/features/monthly-updates/services/monthly-updates.service'
import { Building2, FileText, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react'

export const metadata = { title: 'Dashboard — Founder Portal' }

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

export default async function FounderDashboardPage() {
  const claims = await getClaims()
  if (!claims) redirect('/login')

  const companyId = await getFounderCompanyId(claims.userId)

  if (!companyId) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-center px-8">
        <div className="w-12 h-12 bg-zinc-100 rounded-full flex items-center justify-center mb-4">
          <Building2 className="w-6 h-6 text-zinc-400" />
        </div>
        <p className="text-sm font-medium text-zinc-900 mb-2">
          No company linked to your account
        </p>
        <p className="text-sm text-zinc-400 max-w-sm leading-relaxed">
          Contact your TVCLabs administrator to have your account linked
          to your company profile to start submitting updates.
        </p>
      </div>
    )
  }

  // Get founder ID for the data fetch via service function
  const founderRow = await getFounderRowByUserId(claims.userId)

  if (!founderRow) {
    return <div>Error resolving founder identity.</div>
  }

  // Fetch parallel data via service functions
  const [companyData, updates] = await Promise.all([
    getFounderCompanyData(companyId, founderRow.id),
    getCompanyUpdates(companyId)
  ])

  if (!companyData) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-center px-8">
        <p className="text-sm text-zinc-400">Unable to load your company data.</p>
      </div>
    )
  }

  const { identity } = companyData
  const updateStatus = computeUpdateStatus(updates)
  const currentMonthName = MONTHS[updateStatus.currentPeriod.month - 1]

  return (
    <div className="max-w-4xl mx-auto space-y-8 p-6 lg:p-10">
      
      {/* Welcome Header */}
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900">
          Welcome back to {identity.name}
        </h1>
        <p className="text-sm text-zinc-500 mt-1">
          Here is your portfolio operations overview for {currentMonthName} {updateStatus.currentPeriod.year}.
        </p>
      </div>

      {/* Primary Action Card: Monthly POEM Update */}
      <div className={`border rounded-xl p-6 ${updateStatus.hasCurrentPeriodUpdate ? 'bg-emerald-50/30 border-emerald-100' : 'bg-white border-zinc-200 shadow-sm'}`}>
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              {updateStatus.hasCurrentPeriodUpdate ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              ) : (
                <AlertCircle className="w-5 h-5 text-amber-500" />
              )}
              <h2 className="text-base font-medium text-zinc-900">
                {currentMonthName} Operations Update
              </h2>
            </div>
            
            <p className="text-sm text-zinc-500 mt-1 max-w-lg">
              {updateStatus.hasCurrentPeriodUpdate 
                ? `You have successfully submitted your POEM update for ${currentMonthName}. No further action is required this month.`
                : `Your monthly Portfolio Operations & Execution Matrix (POEM) update for ${currentMonthName} is currently pending.`}
            </p>
          </div>

          {!updateStatus.hasCurrentPeriodUpdate && (
            <Link 
              href="/updates" 
              className="inline-flex items-center gap-2 bg-[#1a23bd] text-white px-4 py-2 text-sm font-medium rounded-lg hover:bg-[#1a23bd]/90 transition-colors shrink-0 shadow-sm"
            >
              <FileText className="w-4 h-4" />
              Submit Update
            </Link>
          )}
        </div>
      </div>

      {/* Quick Links Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link 
          href="/my-company"
          className="group p-5 border border-zinc-100 rounded-xl bg-white hover:border-zinc-200 hover:shadow-sm transition-all"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-zinc-50 rounded-lg flex items-center justify-center border border-zinc-100">
              <Building2 className="w-5 h-5 text-zinc-600" />
            </div>
            <ArrowRight className="w-4 h-4 text-zinc-300 group-hover:text-zinc-600 transition-colors" />
          </div>
          <h3 className="font-medium text-zinc-900 text-sm">Company Profile & Cap Table</h3>
          <p className="text-xs text-zinc-500 mt-1">View your official TVCLabs record and verified equity positions.</p>
        </Link>

        <Link 
          href="/updates"
          className="group p-5 border border-zinc-100 rounded-xl bg-white hover:border-zinc-200 hover:shadow-sm transition-all"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-zinc-50 rounded-lg flex items-center justify-center border border-zinc-100">
              <FileText className="w-5 h-5 text-zinc-600" />
            </div>
            <ArrowRight className="w-4 h-4 text-zinc-300 group-hover:text-zinc-600 transition-colors" />
          </div>
          <h3 className="font-medium text-zinc-900 text-sm">Update History</h3>
          <p className="text-xs text-zinc-500 mt-1">Review past monthly submissions and historical operational data.</p>
        </Link>
      </div>

    </div>
  )
}
