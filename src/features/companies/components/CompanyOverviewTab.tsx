// ─────────────────────────────────────────────────────────────
// CompanyOverviewTab — Company Profile
// With the header handling the persistent identity strip,
// this tab is the full company bio card:
//   • Logo + bio / description
//   • Identity fields (editable)
//   • Founder CRM contact
//   • Portfolio health edit
//   • Verification status
// ─────────────────────────────────────────────────────────────

import Link from 'next/link'
import Image from 'next/image'
import HealthEditForm from '@/features/companies/components/HealthEditForm'
import type { CompanyProfile } from '@/features/companies/types'
import { CompanyIdentityEditForm } from '@/features/companies/components/CompanyIdentityEditForm'
import { getCompanyLogoUrl } from '@/features/companies/services/logo'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

interface CompanyOverviewTabProps {
  company: CompanyProfile
  stalenessDays?: number
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="space-y-0.5">
      <p className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wide">{label}</p>
      <div className="text-sm text-zinc-800">{value ?? <span className="text-zinc-300">—</span>}</div>
    </div>
  )
}

function isStale(dateStr: string | null, days: number = 90): boolean {
  if (!dateStr) return true
  return Date.now() - new Date(dateStr).getTime() > days * 86_400_000
}

function formatDate(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
  })
}

function SectionCard({
  title,
  action,
  children,
}: {
  title: string
  action?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <Card className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
          {title}
        </h2>
        {action}
      </div>
      {children}
    </Card>
  )
}

export default function CompanyOverviewTab({ company, stalenessDays = 90 }: CompanyOverviewTabProps) {
  const stale    = isStale(company.last_verified_date, stalenessDays)
  const initials = company.name.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase()
  const logoUrl  = getCompanyLogoUrl({ logo_path: company.logo_path, logo_url: company.logo_url })

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-7xl">

      {/* ── LEFT COLUMN (2/3) ─────────────────────────────── */}
      <div className="lg:col-span-2 space-y-6">

        {/* Company Bio Card */}
        <SectionCard title="Company Profile">
          <div className="flex items-start gap-5">

            {/* Logo */}
            <div className="shrink-0">
              {logoUrl ? (
                <div className="w-20 h-20 rounded-xl border border-zinc-100 overflow-hidden bg-white shadow-sm">
                  <Image
                    src={logoUrl}
                    alt={`${company.name} logo`}
                    width={80}
                    height={80}
                    className="w-full h-full object-contain p-1.5"
                    unoptimized
                  />
                </div>
              ) : (
                <div className="w-20 h-20 rounded-xl border border-zinc-100 bg-zinc-50 flex items-center justify-center shadow-sm">
                  <span className="text-xl font-bold text-zinc-300 tracking-wide">
                    {initials}
                  </span>
                </div>
              )}
            </div>

            {/* Name + bio */}
            <div className="min-w-0 flex-1 space-y-2">
              <h3 className="text-xl font-semibold text-zinc-900 tracking-tight">
                {company.name}
              </h3>
              {[company.stage, company.sector, company.country].filter(Boolean).length > 0 && (
                <p className="text-xs text-zinc-400">
                  {[company.stage, company.sector, company.country].filter(Boolean).join(' · ')}
                </p>
              )}
              {company.bio ? (
                <p className="text-sm text-zinc-600 leading-relaxed">
                  {company.bio}
                </p>
              ) : (
                <p className="text-sm text-zinc-300 italic">
                  No company description added yet.
                </p>
              )}
              {company.website && (
                <Link
                  href={company.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-[#1a23bd] hover:underline underline-offset-2"
                >
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
                    <polyline points="15 3 21 3 21 9" />
                    <line x1="10" y1="14" x2="21" y2="3" />
                  </svg>
                  {company.website.replace(/^https?:\/\//, '')}
                </Link>
              )}
            </div>
          </div>
        </SectionCard>

        {/* Identity Edit Form — edit button is inside the card header */}
        <SectionCard
          title="Company Identity"
          action={
            <Button
              size="xs"
              onClick={() => {
                // Find and click the hidden edit trigger inside CompanyIdentityEditForm
                document.getElementById('company-identity-edit-trigger')?.click()
              }}
            >
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
              Edit Profile
            </Button>
          }
        >
          <CompanyIdentityEditForm company={company} />
        </SectionCard>

      </div>

      {/* ── RIGHT COLUMN (1/3) ─────────────────────────────── */}
      <div className="space-y-6">

        {/* Portfolio Health */}
        <SectionCard title="Portfolio Health">
          <HealthEditForm
            companyId={company.id}
            current={{
              portfolio_health: company.portfolio_health,
              health_notes: company.health_notes,
              health_reviewed_at: company.health_reviewed_at,
              health_reviewed_by: company.health_reviewed_by,
            }}
          />
        </SectionCard>

        {/* Verification */}
        <SectionCard title="Verification">
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <Field label="Last verified"  value={formatDate(company.last_verified_date)} />
              <Field label="Verified by"    value={company.verified_by?.split('@')[0] ?? null} />
            </div>

            {stale && (
              <div className="flex items-start gap-2 px-3 py-2.5 rounded-lg bg-amber-50 border border-amber-200">
                <span className="text-amber-500 text-xs mt-0.5 shrink-0">⚠</span>
                <p className="text-xs text-amber-700 leading-relaxed">
                  Verification overdue — not confirmed in over {stalenessDays} days.
                  Review before updating health status.
                </p>
              </div>
            )}
          </div>
        </SectionCard>

        {/* Primary Contact — lives below Verification */}
        <SectionCard title="Primary Contact">
          {company.founder ? (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-zinc-100 border border-zinc-200 flex items-center justify-center shrink-0">
                  <span className="text-sm font-semibold text-zinc-500">
                    {company.founder.full_name.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase()}
                  </span>
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-zinc-900">{company.founder.full_name}</p>
                  <a
                    href={`mailto:${company.founder.email}`}
                    className="text-xs text-zinc-400 hover:text-[#1a23bd] transition-colors"
                  >
                    {company.founder.email}
                  </a>
                </div>
              </div>
              <Link
                href={`/founders/${company.founder.id}`}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-400 hover:text-zinc-700 transition-colors"
              >
                View full CRM profile →
              </Link>
            </div>
          ) : (
            <p className="text-sm text-zinc-400">No founder linked to this company.</p>
          )}
        </SectionCard>

        {/* Investment quick facts */}
        {(company.investment_date || company.amount_invested || company.instrument_type) && (
          <SectionCard title="Investment">
            <div className="space-y-4">
              {company.investment_date && (
                <Field label="Investment date" value={formatDate(company.investment_date)} />
              )}
              {company.instrument_type && (
                <Field label="Instrument" value={company.instrument_type} />
              )}
              {company.amount_invested != null && (
                <Field
                  label="Amount invested"
                  value={`${company.currency ?? 'USD'} ${company.amount_invested.toLocaleString()}`}
                />
              )}
              {company.syndicate_holdings && (
                <Field label="Syndicate" value={company.syndicate_holdings} />
              )}
            </div>
          </SectionCard>
        )}

      </div>
    </div>
  )
}