import Link from 'next/link'
import type { AngelCompanySummary } from '@/features/angel-portfolio/types'
import { Zap, Share2 } from 'lucide-react'

interface AngelSignalBannerProps {
  companies: AngelCompanySummary[]
}

export function AngelSignalBanner({ companies }: AngelSignalBannerProps) {
  const raising = companies.filter((c) => c.is_actively_raising)

  if (raising.length === 0) return null

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3 rounded-xl border border-amber-200/90 bg-[#FDF9F3] shadow-2xs">
      <div className="flex items-center gap-3">
        <div className="w-7 h-7 rounded-lg bg-amber-100/80 border border-amber-200 flex items-center justify-center shrink-0 text-amber-700">
          <Zap className="w-4 h-4 fill-amber-500 text-amber-600" />
        </div>
        <p className="text-xs sm:text-sm text-amber-950 font-medium">
          {raising.length === 1 ? (
            <>
              <Link
                href={`/portfolio/${raising[0].company_id}`}
                className="font-bold underline decoration-amber-400 underline-offset-2 hover:text-amber-900 transition-colors"
              >
                {raising[0].company_name}
              </Link>{' '}
              is actively raising follow-on capital.
            </>
          ) : (
            <>
              <strong className="font-bold">{raising.length} portfolio companies</strong> are actively raising follow-on rounds:{' '}
              {raising.map((c, i) => (
                <span key={c.company_id}>
                  <Link
                    href={`/portfolio/${c.company_id}`}
                    className="font-semibold underline decoration-amber-400 underline-offset-2 hover:text-amber-900 transition-colors"
                  >
                    {c.company_name}
                  </Link>
                  {i < raising.length - 1 ? ', ' : ''}
                </span>
              ))}
            </>
          )}
        </p>
      </div>

      <a
        href="mailto:invest@tvclabs.com?subject=Co-Investment%20Opportunity%20Inquiry"
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-amber-200/80 text-xs font-semibold text-amber-900 hover:bg-amber-50 hover:border-amber-300 transition-colors shrink-0 self-start sm:self-center shadow-2xs"
      >
        <Share2 className="w-3.5 h-3.5 text-amber-700" />
        <span>Co-Invest / Invite Angel</span>
      </a>
    </div>
  )
}