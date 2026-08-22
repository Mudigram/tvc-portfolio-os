import { redirect } from 'next/navigation'
import { getClaims } from '@/features/auth/services/auth.server'
import {
  getFounderCompanyId,
  getFounderCompanyData,
  getFounderRowByUserId,
} from '@/features/founder-portal/services/founder-portal.service'
import { FounderCompanyView } from '@/features/founder-portal/components/FounderCompanyView'

export const metadata = { title: 'My Company — TVCLabs' }

export default async function MyCompanyPage() {
  const claims = await getClaims()
  if (!claims) redirect('/login')

  const companyId = await getFounderCompanyId(claims.userId)
  
  if (!companyId) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-center px-8">
        <p className="text-sm font-medium text-zinc-900 mb-2">
          No company linked to your account
        </p>
        <p className="text-sm text-zinc-400 max-w-sm leading-relaxed">
          Contact your TVCLabs administrator to have your account linked
          to your company profile.
        </p>
      </div>
    )
  }

  // Get the founder row for this auth user via service layer
  const founderRow = await getFounderRowByUserId(claims.userId)

  const data = await getFounderCompanyData(companyId, founderRow?.id)

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-center px-8">
        <p className="text-sm text-zinc-400">Unable to load your company data.</p>
      </div>
    )
  }

  return <FounderCompanyView data={data} />
}