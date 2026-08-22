import Image from 'next/image'
import type { FounderCompanyIdentity } from '@/features/founder-portal/types'
import { getCompanyLogoUrl } from '@/features/companies/services/logo'

const HEALTH_STYLES: Record<string, string> = {
  Green: 'text-emerald-700 bg-emerald-50 border-emerald-200',
  Amber: 'text-amber-700 bg-amber-50 border-amber-200',
  Red:   'text-red-700 bg-red-50 border-red-200',
}

function formatDate(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
  })
}

interface FounderCompanyHeaderProps {
  identity: FounderCompanyIdentity
}

export function FounderCompanyHeader({ identity }: FounderCompanyHeaderProps) {
  const healthStyle = identity.portfolio_health
    ? HEALTH_STYLES[identity.portfolio_health]
    : 'text-zinc-400 bg-zinc-50 border-zinc-200'

  const logoUrl = getCompanyLogoUrl({
    logo_path: identity.logo_path,
    logo_url: identity.logo_url,
  })

  const initials = identity.name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase()

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          {logoUrl ? (
            <div className="w-12 h-12 rounded-xl border border-zinc-100 overflow-hidden bg-white shadow-sm shrink-0">
              <Image
                src={logoUrl}
                alt={`${identity.name} logo`}
                width={48}
                height={48}
                className="w-full h-full object-contain p-1"
                unoptimized
              />
            </div>
          ) : (
            <div className="w-12 h-12 rounded-xl border border-zinc-100 bg-zinc-50 flex items-center justify-center shadow-sm shrink-0">
              <span className="text-sm font-bold text-zinc-400 tracking-wide">
                {initials}
              </span>
            </div>
          )}
          <div className="space-y-1">
            <h1 className="text-2xl font-medium text-zinc-900 tracking-tight">
              {identity.name}
            </h1>
            <p className="text-sm text-zinc-400">
              {[identity.stage, identity.sector, identity.country]
                .filter(Boolean)
                .join(' · ')}
            </p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1.5 shrink-0">
          <span className={`
            inline-flex items-center px-2.5 py-1 rounded border text-sm font-medium
            ${healthStyle}
          `}>
            {identity.portfolio_health ?? 'Not yet reviewed'}
          </span>
          {identity.health_reviewed_at && (
            <p className="text-xs text-zinc-300">
              Reviewed {formatDate(identity.health_reviewed_at)}
            </p>
          )}
        </div>
      </div>

      {identity.website && (<a
          href={identity.website}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-zinc-400 hover:text-zinc-700 underline underline-offset-2 transition-colors"
        >
          {identity.website.replace(/^https?:\/\//, '')}
        </a>
      )}
    </div>
  )
}