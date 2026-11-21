import Link from 'next/link'
import type { AngelCompanySummary } from '@/features/angel-portfolio/types'
import { ArrowUpRight, Share2 } from 'lucide-react'

interface AngelSignalBannerProps {
  companies: AngelCompanySummary[]
}

export function AngelSignalBanner({ companies }: AngelSignalBannerProps) {
  const raising = companies.filter((c) => c.is_actively_raising)

  if (raising.length === 0) return null

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3 rounded-xl border border-amber-200/70 bg-amber-50/40 shadow-2xs">
      <div className="flex items-center gap-3">
        <div className="w-7 h-7 rounded-lg bg-amber-100/60 border border-amber-200/80 flex items-center justify-center shrink-0 text-amber-800">
          <ArrowUpRight className="w-4 h-4" />
        </div>
        <p className="text-xs sm:text-sm text-zinc-800 font-normal">
          {raising.length === 1 ? (
            <>
              <Link
                href={`/portfolio/${raising[0].company_id}`}
                className="font-semibold text-zinc-950 hover:underline transition-colors"
              >
                {raising[0].company_name}
              </Link>{' '}
              is actively raising follow-on capital
            </>
          ) : (
            <>
              <span className="font-semibold text-zinc-950">{raising.length} portfolio companies</span> are actively raising follow-on rounds:{' '}
              {raising.map((c, i) => (
                <span key={c.company_id}>
                  <Link
                    href={`/portfolio/${c.company_id}`}
                    className="font-medium text-zinc-950 hover:underline transition-colors"
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
        className="inline-flex items-center gap-1.5 px-3 h-9 rounded-lg bg-white border border-zinc-200 text-xs font-medium text-zinc-800 hover:bg-zinc-50 hover:border-zinc-300 transition-colors shrink-0 self-start sm:self-center shadow-2xs"
      >
        <Share2 className="w-3.5 h-3.5 text-zinc-500" />
        <span>Co-invest / invite angel</span>
      </a>
    </div>
  )
}
