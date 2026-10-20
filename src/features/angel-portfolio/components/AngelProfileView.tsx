'use client'

import Link from 'next/link'
import type { AngelProfileData } from '@/features/angel-portfolio/types'
import { ShieldCheck, UserCheck, Briefcase, KeyRound, Building2 } from 'lucide-react'

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
    <div className="space-y-8 max-w-4xl">

      {/* Page header */}
      <div>
        <div className="flex items-center gap-2 text-[11px] lg:text-xs text-zinc-400 mb-1">
          <Link href="/portfolio" className="hover:text-zinc-700 transition-colors">
            My Portfolio
          </Link>
          <span>·</span>
          <span className="text-zinc-600">Account Profile</span>
        </div>
        <h1 className="text-xl lg:text-2xl font-bold text-zinc-900 tracking-tight">
          Investor Profile
        </h1>
        <p className="text-sm text-zinc-500 mt-1">
          Your account identity, legal holding structure, and portfolio standing across TVCLabs.
        </p>
      </div>

      {/* Identity & Legal Entity Card */}
      <div className="bg-white rounded-xl border border-zinc-200/80 p-6 shadow-xs space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-700 font-bold text-lg">
              {holder?.name ? holder.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() : 'AG'}
            </div>
            <div>
              <h2 className="text-lg font-semibold text-zinc-900">
                {holder?.name ?? 'Angel Investor'}
              </h2>
              <p className="text-xs text-zinc-500 font-mono mt-0.5">
                {user.email}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
              <ShieldCheck className="w-3.5 h-3.5" />
              Verified Angel
            </span>
          </div>
        </div>

        <div className="border-t border-zinc-100" />

        {/* Account & Entity Details Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="space-y-1">
            <p className="text-xs font-medium text-zinc-400 uppercase tracking-wide">
              Holder Entity Name
            </p>
            <p className="text-sm font-semibold text-zinc-800">
              {holder?.name ?? '—'}
            </p>
          </div>

          <div className="space-y-1">
            <p className="text-xs font-medium text-zinc-400 uppercase tracking-wide">
              Entity Type
            </p>
            <p className="text-sm font-semibold text-zinc-800">
              {holder?.holder_type ? `${holder.holder_type}` : 'Syndicate Investor'}
            </p>
          </div>

          <div className="space-y-1">
            <p className="text-xs font-medium text-zinc-400 uppercase tracking-wide">
              System Access Role
            </p>
            <p className="text-sm font-semibold text-zinc-800">
              {user.role}
            </p>
          </div>

          <div className="space-y-1">
            <p className="text-xs font-medium text-zinc-400 uppercase tracking-wide">
              Member Since
            </p>
            <p className="text-sm text-zinc-700">
              {formatDate(user.created_at)}
            </p>
          </div>

          <div className="space-y-1">
            <p className="text-xs font-medium text-zinc-400 uppercase tracking-wide">
              Last Login
            </p>
            <p className="text-sm text-zinc-700">
              {formatDate(user.last_sign_in_at)}
            </p>
          </div>

          <div className="space-y-1">
            <p className="text-xs font-medium text-zinc-400 uppercase tracking-wide">
              Syndicate Standing
            </p>
            <span className="inline-flex items-center gap-1 text-xs font-medium text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
              <UserCheck className="w-3 h-3" /> Active &amp; Good Standing
            </span>
          </div>
        </div>
      </div>

      {/* Portfolio Standing Snapshot */}
      <div className="bg-white rounded-xl border border-zinc-200/80 p-6 shadow-xs space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Briefcase className="w-4 h-4 text-zinc-500" />
            <h2 className="text-sm font-semibold text-zinc-900 uppercase tracking-wider">
              Portfolio Standing Overview
            </h2>
          </div>
          <Link
            href="/portfolio"
            className="text-xs font-medium text-blue-600 hover:text-blue-700 transition-colors"
          >
            View Portfolio &rarr;
          </Link>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="bg-zinc-50/70 border border-zinc-100 rounded-lg p-4">
            <p className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider">
              Total Capital Deployed
            </p>
            <p className="text-xl font-bold text-zinc-900 mt-1 tabular-nums">
              {formatCurrencyFull(portfolio_overview.total_invested)}
            </p>
          </div>

          <div className="bg-zinc-50/70 border border-zinc-100 rounded-lg p-4">
            <p className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider">
              Portfolio Companies
            </p>
            <p className="text-xl font-bold text-zinc-900 mt-1 tabular-nums">
              {portfolio_overview.companies_count}
            </p>
          </div>

          <div className="bg-zinc-50/70 border border-zinc-100 rounded-lg p-4 col-span-2 lg:col-span-1">
            <p className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider">
              Active Instruments
            </p>
            <p className="text-xl font-bold text-zinc-900 mt-1 tabular-nums">
              {portfolio_overview.instruments_count}
            </p>
          </div>
        </div>

        {/* Sectors and Instruments Tags */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2 border-t border-zinc-100">
          <div className="space-y-2">
            <p className="text-xs font-medium text-zinc-400 uppercase tracking-wide">
              Sectors Represented
            </p>
            <div className="flex flex-wrap gap-1.5">
              {portfolio_overview.sectors.length > 0 ? (
                portfolio_overview.sectors.map((s) => (
                  <span
                    key={s}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-zinc-100 text-xs font-medium text-zinc-700"
                  >
                    <Building2 className="w-3 h-3 text-zinc-400" />
                    {s}
                  </span>
                ))
              ) : (
                <span className="text-xs text-zinc-400">None</span>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-medium text-zinc-400 uppercase tracking-wide">
              Instrument Types
            </p>
            <div className="flex flex-wrap gap-1.5">
              {portfolio_overview.instruments.length > 0 ? (
                portfolio_overview.instruments.map((inst) => (
                  <span
                    key={inst}
                    className="inline-flex items-center px-2.5 py-1 rounded-md bg-blue-50 text-xs font-medium text-blue-700 border border-blue-100"
                  >
                    {inst}
                  </span>
                ))
              ) : (
                <span className="text-xs text-zinc-400">None</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Security & Authentication Info */}
      <div className="bg-white rounded-xl border border-zinc-200/80 p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2.5">
          <KeyRound className="w-4 h-4 text-zinc-500" />
          <h2 className="text-sm font-semibold text-zinc-900 uppercase tracking-wider">
            Security &amp; Authentication
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-1">
          <div className="space-y-1">
            <p className="text-xs font-medium text-zinc-400 uppercase tracking-wide">
              Sign-In Credentials
            </p>
            <p className="text-xs text-zinc-600 leading-relaxed">
              Configured with secure <span className="font-medium text-zinc-800">Password</span> sign-in and <span className="font-medium text-zinc-800">Magic Link</span> email access.
            </p>
          </div>

          <div className="space-y-1">
            <p className="text-xs font-medium text-zinc-400 uppercase tracking-wide">
              Need to update details?
            </p>
            <p className="text-xs text-zinc-600 leading-relaxed">
              To update your legal entity name, allocation instruments, or wire details, reach out to your TVCLabs portfolio manager at{' '}
              <a href="mailto:invest@tvclabs.com" className="text-blue-600 underline font-medium">
                invest@tvclabs.com
              </a>.
            </p>
          </div>
        </div>
      </div>

    </div>
  )
}