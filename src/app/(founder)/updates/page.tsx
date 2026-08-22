import { redirect } from 'next/navigation'
import { getClaims } from '@/features/auth/services/auth.server'
import { getFounderCompanyId } from '@/features/founder-portal/services/founder-portal.service'
import {
  getCompanyUpdates,
  getCompanyReportingTargets,
  computeUpdateStatus,
} from '@/features/monthly-updates/services/monthly-updates.service'
import UpdatesTabView from '@/features/monthly-updates/components/UpdatesTabView'

export const metadata = { title: 'Monthly Updates — Founder Portal' }

export default async function FounderUpdatesPage() {
  const claims = await getClaims()
  if (!claims) redirect('/login')

  const companyId = await getFounderCompanyId(claims.userId)

  if (!companyId) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-center px-8">
        <p className="text-sm font-medium text-zinc-900 mb-2">
          No company linked to your account
        </p>
      </div>
    )
  }

  const [updates, targets] = await Promise.all([
    getCompanyUpdates(companyId),
    getCompanyReportingTargets(companyId),
  ])
  const status = computeUpdateStatus(updates)

  return (
    <div className="max-w-4xl mx-auto space-y-6 p-6 lg:p-10">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900">Monthly Updates</h1>
        <p className="text-sm text-zinc-500 mt-1">
          Submit your POEM updates and review historical operational data.
        </p>
      </div>
      
      {/* 
        We reuse the UpdatesTabView which handles the list, empty states, 
        status banners, and the modal for the SubmitUpdateForm.
      */}
      <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden shadow-sm">
        <div className="p-6">
          <UpdatesTabView 
            companyId={companyId} 
            updates={updates} 
            status={status} 
            targets={targets}
          />
        </div>
      </div>
    </div>
  )
}
