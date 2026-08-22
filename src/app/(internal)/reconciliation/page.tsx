import { redirect } from 'next/navigation'
import { getClaims } from '@/features/auth/services/auth.server'
import {
  getMasterLedgerStatus,
  getReconciliationPositions,
} from '@/features/exposure/services/exposure-events.service'
import { ReconciliationConsole } from '@/features/exposure/components/ReconciliationConsole'

export const metadata = {
  title: 'Master Ledger Reconciliation — TVCLabs Portfolio OS',
}

export default async function ReconciliationPage() {
  const claims = await getClaims()
  if (!claims || (claims.role !== 'internal' && claims.role !== 'admin')) {
    redirect('/login')
  }

  const [ledgerStatuses, positions] = await Promise.all([
    getMasterLedgerStatus(),
    getReconciliationPositions(),
  ])

  return (
    <div className="space-y-8 max-w-[1200px] mx-auto py-2">
      {/* Page Header */}
      <div className="border-b border-zinc-100 pb-6">
        <h1 className="text-xl font-semibold text-zinc-900 tracking-tight">
          Master Ledger Reconciliation
        </h1>
        <p className="text-xs text-zinc-400 mt-1 uppercase tracking-wider font-medium">
          Portfolio company verification & document evidence audit console
        </p>
      </div>

      <ReconciliationConsole
        ledgerStatuses={ledgerStatuses}
        positions={positions}
      />
    </div>
  )
}
