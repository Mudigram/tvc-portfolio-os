// ─────────────────────────────────────────────────────────────
// CompanyHeader — sticky persistent band above all tabs
// Shows: logo, name, stage/sector, health badge, last reviewed
// Stays visible as the user switches between tabs.
// ─────────────────────────────────────────────────────────────
'use client'

import Image from 'next/image'
import Link from 'next/link'
import type { CompanyProfile } from '@/features/companies/types'
import { getCompanyLogoUrl } from '@/features/companies/services/logo'

interface Props {
  company: CompanyProfile
}

const HEALTH_CONFIG = {
  Green: { dot: 'bg-emerald-400', text: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200', label: 'Green' },
  Amber: { dot: 'bg-amber-400',   text: 'text-amber-700',   bg: 'bg-amber-50',   border: 'border-amber-200',   label: 'Amber' },
  Red:   { dot: 'bg-red-400',     text: 'text-red-700',     bg: 'bg-red-50',     border: 'border-red-200',     label: 'Red'   },
}

function timeAgo(dateStr: string | null): string {
  if (!dateStr) return 'Never reviewed'
  const diff  = Date.now() - new Date(dateStr).getTime()
  const days  = Math.floor(diff / 86_400_000)
  if (days === 0) return 'Reviewed today'
  if (days === 1) return 'Reviewed yesterday'
  if (days < 30)  return `Reviewed ${days}d ago`
  const months = Math.floor(days / 30)
  return `Reviewed ${months}mo ago`
}

export function CompanyHeader({ company }: Props) {
  const health = company.portfolio_health
    ? HEALTH_CONFIG[company.portfolio_health]
    : null

  const logoUrl = getCompanyLogoUrl({
    logo_path: company.logo_path,
    logo_url: company.logo_url,
  })

  const initials = company.name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase()

  return (
    <div className="sticky top-0 z-20 bg-white border-b border-zinc-100 shadow-sm">
      <div className="max-w-[1600px] mx-auto px-6 py-4 flex items-center gap-5">

        {/* Logo / initials avatar */}
        <div className="shrink-0">
          {logoUrl ? (
            <div className="w-12 h-12 rounded-xl border border-zinc-100 overflow-hidden bg-white shadow-sm">
              <Image
                src={logoUrl}
                alt={`${company.name} logo`}
                width={48}
                height={48}
                className="w-full h-full object-contain p-1"
                unoptimized
              />
            </div>
          ) : (
            <div className="w-12 h-12 rounded-xl border border-zinc-100 bg-zinc-50 flex items-center justify-center shadow-sm">
              <span className="text-sm font-bold text-zinc-400 tracking-wide">
                {initials}
              </span>
            </div>
          )}
        </div>

        {/* Name + meta */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-lg font-semibold text-zinc-900 tracking-tight truncate">
              {company.name}
            </h1>

            {/* Health badge */}
            {health ? (
              <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-xs font-medium ${health.text} ${health.bg} ${health.border}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${health.dot}`} />
                {health.label}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border border-zinc-200 bg-zinc-50 text-xs font-medium text-zinc-400">
                <span className="w-1.5 h-1.5 rounded-full bg-zinc-300" />
                Not reviewed
              </span>
            )}

            {/* Fundraising signal */}
            {company.instrument_type && (
              <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full border border-amber-200 bg-amber-50 text-xs font-medium text-amber-700">
                {company.instrument_type}
              </span>
            )}
          </div>

          {/* Stage · Sector · Country */}
          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            {[company.stage, company.sector, company.country]
              .filter(Boolean)
              .map((val, i, arr) => (
                <span key={val} className="flex items-center gap-2">
                  <span className="text-xs text-zinc-400">{val}</span>
                  {i < arr.length - 1 && (
                    <span className="text-zinc-200 text-xs">·</span>
                  )}
                </span>
              ))}
          </div>
        </div>

        {/* Right side — review stamp + website */}
        <div className="shrink-0 flex items-center gap-4">
          <div className="hidden md:block text-right">
            <p className="text-[11px] text-zinc-400 font-medium">
              {timeAgo(company.health_reviewed_at)}
            </p>
            {company.health_reviewed_by && (
              <p className="text-[11px] text-zinc-300">
                by {company.health_reviewed_by.split('@')[0]}
              </p>
            )}
          </div>

          {company.website && (
            <Link
              href={company.website}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:inline-flex items-center gap-1.5 h-8 px-3 text-xs font-medium text-zinc-600 border border-zinc-200 rounded-md hover:bg-zinc-50 transition-colors"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
                <polyline points="15 3 21 3 21 9" />
                <line x1="10" y1="14" x2="21" y2="3" />
              </svg>
              Website
            </Link>
          )}
        </div>

      </div>
    </div>
  )
}
