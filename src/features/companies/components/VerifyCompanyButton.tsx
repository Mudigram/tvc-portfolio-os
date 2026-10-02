'use client'

import { useState } from 'react'
import { verifyCompanyAction } from '@/features/companies/actions/verifyCompany.action'
import { useToast } from '@/hooks/use-toast'
import { CheckCircle2 } from 'lucide-react'

export function VerifyCompanyButton({ companyId }: { companyId: string }) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)

  async function handleVerify() {
    setLoading(true)
    const res = await verifyCompanyAction(companyId)
    if (res.success) {
      toast({
        title: 'Company profile verified',
        description: 'Last verified date updated to today.',
        type: 'success',
      })
    } else {
      toast({
        title: 'Verification failed',
        description: res.error || 'Could not verify profile.',
        type: 'error',
      })
    }
    setLoading(false)
  }

  return (
    <button
      onClick={handleVerify}
      disabled={loading}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-[#1a23bd] hover:bg-[#1520a8] disabled:opacity-50 transition-all shadow-2xs"
    >
      <CheckCircle2 className="w-3.5 h-3.5" />
      {loading ? 'Verifying…' : 'Verify Profile Now'}
    </button>
  )
}
