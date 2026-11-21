'use client'

import Link from 'next/link'
import type { AngelProfileData } from '@/features/angel-portfolio/types'
import { ShieldCheck, UserCheck, Briefcase, KeyRound, Building2, ArrowUpRight } from 'lucide-react'

interface AngelProfileViewProps {
  profile: AngelProfileData
}

function formatCurrencyFull(n: number): string {
  if (n === 0) return '$0'
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(n)
}

function formatDate(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export function AngelProfileView({ profile }: AngelProfileViewProps) {
  const { user, holder, portfolio_overview } = profile

  return (
    <div className="space-y-6 max-w-4xl pb-16">

      {/* Page header */}
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold text-zinc-500 mb-1">
          <Link href="/portfolio" className="hover:text-zinc-900 transition-colors">
            My Portfolio
          </Link>
          <span>/</span>
          <span className="text-zinc-800">Account Profile</span>
        </div>
        <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">
          Investor Profile &amp; Entity Standing
        </h1>
        <p className="text-xs sm:text-sm text-zinc-600 mt-1">
          Your account identity, legal holding structure, and portfolio standing across TVCLabs.
        </p>
      </div>

      {/* Identity & Legal Entity Card */}
      <div className="bg-white rounded-2xl border border-zinc-200/90 p-5 sm:p-6 shadow-xs space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-800 font-bold text-lg shadow-2xs">
              {holder?.name ? holder.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() : 'AG'}
            </div>
            <div>
              <h2 className="text-lg font-bold text-zinc-900 tracking-tight">
                {holder?.name ?? 'Angel Investor'}
              </h2>
              <p className="text-xs text-zinc-600 font-mono mt-0.5">
                {user.email}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              Verified Syndicate Angel
            </span>
          </div>
        </div>

        <div className="border-t border-zinc-100" />

        {/* Account & Entity Details Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
              Holder Entity Name
            </p>
            <p className="text-sm font-bold text-zinc-900">
              {holder?.name ?? '—'}
            </p>
          </div>

          <div className="space-y-1">
            <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
              Entity Type
            </p>
            <p className="text-sm font-semibold text-zinc-800">
              {holder?.holder_type ? `${holder.holder_type}` : 'Syndicate Investor'}
            </p>
          </div>

          <div className="space-y-1">
            <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
              System Access Role
            </p>
            <p className="text-sm font-semibold text-zinc-800">
              {user.role}
            </p>
          </div>

          <div className="space-y-1">
            <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
              Member Since
            </p>
            <p className="text-sm font-medium text-zinc-700">
              {formatDate(user.created_at)}
            </p>
          </div>

          <div className="space-y-1">
            <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
              Last Login
            </p>
            <p className="text-sm font-medium text-zinc-700">
              {formatDate(user.last_sign_in_at)}
            </p>
          </div>

          <div className="space-y-1">
            <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
              Syndicate Standing
            </p>
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-blue-800 bg-blue-50 px-2.5 py-1 rounded-md border border-blue-200">
              <UserCheck className="w-3.5 h-3.5 text-blue-700" /> Active &amp; Good Standing
            </span>
          </div>
        </div>
      </div>

      {/* Portfolio Standing Snapshot */}
      <div className="bg-white rounded-2xl border border-zinc-200/90 p-5 sm:p-6 shadow-xs space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Briefcase className="w-4 h-4 text-zinc-600" />
            <h2 className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
              Portfolio Standing Overview
            </h2>
          </div>
          <Link
            href="/portfolio"
            className="inline-flex items-center gap-1 text-xs font-semibold text-blue-700 hover:text-blue-900 transition-colors"
          >
            <span>View Portfolio</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="bg-zinc-50/70 border border-zinc-200/60 rounded-xl p-4">
            <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
              Total Capital Deployed
            </p>
            <p className="text-xl font-bold text-zinc-900 mt-1 tabular-nums">
              {formatCurrencyFull(portfolio_overview.total_invested)}
            </p>
          </div>

          <div className="bg-zinc-50/70 border border-zinc-200/60 rounded-xl p-4">
            <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
              Portfolio Companies
            </p>
            <p className="text-xl font-bold text-zinc-900 mt-1 tabular-nums">
              {portfolio_overview.companies_count}
            </p>
          </div>

          <div className="bg-zinc-50/70 border border-zinc-200/60 rounded-xl p-4 col-span-2 lg:col-span-1">
            <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
              Active Instruments
            </p>
            <p className="text-xl font-bold text-zinc-900 mt-1 tabular-nums">
              {portfolio_overview.instruments_count}
            </p>
          </div>
        </div>

        {/* Sectors and Instruments Tags */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-3 border-t border-zinc-100">
          <div className="space-y-2">
            <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
              Sectors Represented
            </p>
            <div className="flex flex-wrap gap-1.5">
              {portfolio_overview.sectors.length > 0 ? (
                portfolio_overview.sectors.map((s) => (
                  <span
                    key={s}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-100 text-xs font-medium text-zinc-800"
                  >
                    <Building2 className="w-3 h-3 text-zinc-500" />
                    {s}
                  </span>
                ))
              ) : (
                <span className="text-xs text-zinc-500">None</span>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
              Instrument Types
            </p>
            <div className="flex flex-wrap gap-1.5">
              {portfolio_overview.instruments.length > 0 ? (
                portfolio_overview.instruments.map((inst) => (
                  <span
                    key={inst}
                    className="inline-flex items-center px-2.5 py-1 rounded-lg bg-blue-50 text-xs font-semibold text-blue-800 border border-blue-200"
                  >
                    {inst}
                  </span>
                ))
              ) : (
                <span className="text-xs text-zinc-500">None</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Security & Support Info */}
      <div className="bg-white rounded-2xl border border-zinc-200/90 p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2.5">
          <KeyRound className="w-4 h-4 text-zinc-600" />
          <h2 className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
            Security &amp; TVCLabs Relations
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-1">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
              Sign-In Credentials
            </p>
            <p className="text-xs text-zinc-700 leading-relaxed">
              Configured with secure <span className="font-semibold text-zinc-900">Password</span> sign-in and <span className="font-semibold text-zinc-900">Magic Link</span> email access.
            </p>
          </div>

          <div className="space-y-1">
            <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
              Allocation &amp; Wire Support
            </p>
            <p className="text-xs text-zinc-700 leading-relaxed">
              To update your legal entity name, wire instructions, or co-investment pro-rata preferences, contact your TVCLabs portfolio manager at{' '}
              <a href="mailto:invest@tvclabs.com" className="text-blue-700 underline font-semibold hover:text-blue-900">
                invest@tvclabs.com
              </a>.
            </p>
          </div>
        </div>
      </div>

    </div>
  )
}