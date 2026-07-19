// ─────────────────────────────────────────────────────────────
// Campaigns page — /campaigns
// Internal only. Compose at top, history below.
// No tabs — linear flow matches how campaigns are used.
// ─────────────────────────────────────────────────────────────

import { redirect } from 'next/navigation'
import { getClaims } from '@/features/auth/services/auth.server'
import { getCampaignHistory } from '@/features/campaigns/services/campaigns.server'
import CampaignComposeForm from '@/features/campaigns/components/CampaignComposeForm'
import CampaignHistory from '@/features/campaigns/components/CampaignHistory'

export const metadata = {
  title: 'Campaigns — TVCLabs Portfolio OS',
}

export default async function CampaignsPage() {
  const claims = await getClaims()

  if (!claims || claims.role !== 'internal') {
    redirect('/login')
  }

  const history = await getCampaignHistory()

  return (
    <div className="space-y-12 max-w-[1200px] mx-auto py-2">

      {/* Page header */}
      <div className="border-b border-zinc-100 pb-6">
        <h1 className="text-xl font-semibold text-zinc-900 tracking-tight">
          Campaigns
        </h1>
        <p className="text-xs text-zinc-400 mt-1 uppercase tracking-wider font-medium">
          Compose and send emails to angels, founders, and portfolio companies
        </p>
      </div>

      {/* Compose */}
      <section className="space-y-4">
        <div>
          <h2 className="text-base font-semibold text-zinc-900">New campaign</h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Fill in the details, preview recipients, then send.
            Emails are sent from{' '}
            <code className="text-xs bg-zinc-100 px-1 py-0.5 rounded">
              {claims.email.split('@')[0]} via TVCLabs &lt;portfolio@tvclabs.com&gt;
            </code>
          </p>
        </div>
        <CampaignComposeForm />
      </section>

      {/* History */}
      <section>
        <CampaignHistory campaigns={history} />
      </section>

    </div>
  )
}