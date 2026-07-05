import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getFounderById } from '@/features/founders/services/founders.service'
import { FounderEditForm } from '@/features/founders/components/FounderEditForm'

interface FounderPageProps {
  params: Promise<{ id: string }>
}

const HEALTH_STYLES: Record<string, string> = {
  Green: 'text-emerald-700 bg-emerald-50 border-emerald-200',
  Amber: 'text-amber-700 bg-amber-50 border-amber-200',
  Red:   'text-red-700 bg-red-50 border-red-200',
}

export async function generateMetadata({ params }: FounderPageProps) {
  const { id } = await params
  const founder = await getFounderById(id)
  return {
    title: founder
      ? `${founder.full_name} — TVCLabs Portfolio OS`
      : 'Founder not found',
  }
}

export default async function FounderPage({ params }: FounderPageProps) {
  const { id } = await params
  const founder = await getFounderById(id)
  if (!founder) notFound()

  return (
    <div className="space-y-10 max-w-2xl">

      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-zinc-400">
        <Link href="/founders" className="hover:text-zinc-700 transition-colors">
          Founders
        </Link>
        <span>·</span>
        <span className="text-zinc-600">{founder.full_name}</span>
      </div>

      {/* Page header */}
      <div className="space-y-1">
        <h1 className="text-2xl font-medium text-zinc-900 tracking-tight">
          {founder.full_name}
        </h1>
        {founder.startup_name && (
          <p className="text-sm text-zinc-400">{founder.startup_name}</p>
        )}
      </div>

      {/* Linked portfolio company */}
      {founder.linked_company && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-lg border border-zinc-100 bg-zinc-50">
          <span className="text-xs text-zinc-400">Portfolio company</span>
          <span className={`
            inline-flex items-center px-2 py-0.5 rounded border text-xs font-medium
            ${founder.linked_company.portfolio_health
              ? HEALTH_STYLES[founder.linked_company.portfolio_health]
              : 'text-zinc-400 bg-white border-zinc-200'
            }
          `}>
            {founder.linked_company.portfolio_health ?? 'Not set'}
          </span>
          <Link
            href={`/companies/${founder.linked_company.id}`}
            className="text-sm font-medium text-zinc-900 hover:text-zinc-600 transition-colors"
          >
            {founder.linked_company.name} →
          </Link>
        </div>
      )}

      <div className="border-t border-zinc-100" />

      <FounderEditForm founder={founder} />

    </div>
  )
}