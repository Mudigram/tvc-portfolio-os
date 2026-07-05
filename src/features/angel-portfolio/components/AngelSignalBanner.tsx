import Link from 'next/link'
import type { AngelCompanySummary } from '@/features/angel-portfolio/types'

interface AngelSignalBannerProps {
  companies: AngelCompanySummary[]
}

export function AngelSignalBanner({ companies }: AngelSignalBannerProps) {
  const raising = companies.filter((c) => c.is_actively_raising)

  if (raising.length === 0) return null

  return (
    <div className="flex items-center gap-3 px-4 py-3 rounded-lg border border-amber-200 bg-amber-50">
      <span className="text-amber-500 shrink-0">⚡</span>
      <p className="text-sm text-amber-800">
        {raising.length === 1 ? (
          <>
            <Link
              href={`/portfolio/${raising[0].company_id}`}
              className="font-medium underline underline-offset-2 hover:text-amber-900"
            >
              {raising[0].company_name}
            </Link>{' '}
            is actively raising.
          </>
        ) : (
          <>
            {raising.length} of your companies are actively raising —{' '}
            {raising.map((c, i) => (
              <span key={c.company_id}>
                <Link
                  href={`/portfolio/${c.company_id}`}
                  className="font-medium underline underline-offset-2 hover:text-amber-900"
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
  )
}