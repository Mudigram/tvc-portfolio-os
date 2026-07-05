import Link from 'next/link'
import HealthEditForm from '@/features/companies/components/HealthEditForm'
import type { CompanyProfile } from '@/features/companies/types'
import { CompanyIdentityEditForm } from '@/features/companies/components/CompanyIdentityEditForm'

interface CompanyOverviewTabProps {
  company: CompanyProfile
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="space-y-0.5">
      <p className="text-xs font-medium text-zinc-400 uppercase tracking-wide">{label}</p>
      <div className="text-sm text-zinc-800">{value ?? '—'}</div>
    </div>
  )
}

const STALE_THRESHOLD_MS = 60 * 24 * 60 * 60 * 1000

function isStale(dateStr: string | null): boolean {
  if (!dateStr) return true
  return Date.now() - new Date(dateStr).getTime() > STALE_THRESHOLD_MS
}

function formatDate(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
  })
}

export default function CompanyOverviewTab({ company }: CompanyOverviewTabProps) {
  const stale = isStale(company.last_verified_date)

  return (
    <div className="space-y-10 max-w-2xl">

      {/* Health status */}
      <section className="space-y-3">
        <h2 className="text-xs font-medium text-zinc-400 uppercase tracking-wide">
          Portfolio health
        </h2>
        <HealthEditForm
          companyId={company.id}
          current={{
            portfolio_health: company.portfolio_health,
            health_notes: company.health_notes,
            health_reviewed_at: company.health_reviewed_at,
            health_reviewed_by: company.health_reviewed_by,
          }}
        />
      </section>

      <div className="border-t border-zinc-100" />

      {/* Company identity */}
      <section className="space-y-6">
  <h2 className="text-xs font-medium text-zinc-400 uppercase tracking-wide">
    Company
  </h2>
  <CompanyIdentityEditForm company={company} />
</section>

      <div className="border-t border-zinc-100" />

      {/* Primary contact */}
      <section className="space-y-6">
        <h2 className="text-xs font-medium text-zinc-400 uppercase tracking-wide">
          Primary contact
        </h2>
        {company.founder ? (
          <div className="grid grid-cols-2 gap-x-8 gap-y-6">
            <Field label="Full Name" value={company.founder.full_name} />
            <Field
              label="Email"
              value={
                
                  <a href={`mailto:${company.founder.email}`}
                  className="text-zinc-800 underline underline-offset-2 hover:text-zinc-600"
                >
                  {company.founder.email}
                </a>
              }
            />
            <div className="col-span-2">
              <Link
                href={`/founders/${company.founder.id}`}
                className="text-xs text-zinc-400 hover:text-zinc-700 underline underline-offset-2 transition-colors"
              >
                View full CRM profile →
              </Link>
            </div>
          </div>
        ) : (
          <p className="text-sm text-zinc-400">No founder linked. Set Founder on this company.</p>
        )}
      </section>

      <div className="border-t border-zinc-100" />

      {/* Verification */}
      <section className="space-y-4">
        <h2 className="text-xs font-medium text-zinc-400 uppercase tracking-wide">
          Verification
        </h2>
        <div className="grid grid-cols-2 gap-x-8 gap-y-6">
          <Field label="Last verified"  value={formatDate(company.last_verified_date)} />
          <Field label="Verified by"    value={company.verified_by} />
        </div>
        {stale && (
          <div className="flex items-start gap-2 px-3 py-2.5 rounded-md bg-amber-50 border border-amber-200">
            <span className="text-amber-600 text-xs mt-0.5">⚠</span>
            <p className="text-xs text-amber-700 leading-relaxed">
              Verification is overdue. Critical fields have not been confirmed in over 60 days.
              Review and update before setting health status.
            </p>
          </div>
        )}
      </section>

    </div>
  )
}