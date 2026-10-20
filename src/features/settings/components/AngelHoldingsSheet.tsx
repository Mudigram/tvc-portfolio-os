'use client'

import { useState, useEffect, useTransition } from 'react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Spinner } from '@/components/ui/spinner'
import {
  getAngelHoldingsAction,
  getAvailableExposuresAction,
  linkAngelExposureAction,
  unlinkAngelExposureAction,
} from '../actions/settings.actions'
import type { ManagedUser, AngelHolding, AvailableExposure } from '../types'
import { Building2, Plus, Trash2 } from 'lucide-react'

interface AngelHoldingsSheetProps {
  user: ManagedUser | null
  isOpen: boolean
  onClose: () => void
}

function formatCurrency(n: number): string {
  if (n === 0) return '$0'
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(n)
}

export function AngelHoldingsSheet({
  user,
  isOpen,
  onClose,
}: AngelHoldingsSheetProps) {
  const [holdings, setHoldings] = useState<AngelHolding[]>([])
  const [available, setAvailable] = useState<AvailableExposure[]>([])
  const [selectedExposureId, setSelectedExposureId] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  // Load holdings whenever the user changes or sheet opens
  useEffect(() => {
    if (!user || !isOpen) return

    let isMounted = true
    setLoading(true)
    setError(null)
    setSuccessMsg(null)
    setSelectedExposureId('')

    Promise.all([
      getAngelHoldingsAction(user.id),
      getAvailableExposuresAction(),
    ])
      .then(([holdingsData, availableData]) => {
        if (!isMounted) return
        setHoldings(holdingsData)
        setAvailable(availableData)
      })
      .catch((err) => {
        if (!isMounted) return
        setError(err?.message ?? 'Failed to load angel holdings.')
      })
      .finally(() => {
        if (isMounted) setLoading(false)
      })

    return () => {
      isMounted = false
    }
  }, [user, isOpen])

  // Filter available positions: exclude ones already linked to this angel
  const linkedExposureIds = new Set(holdings.map((h) => h.exposure_id))
  const unlinkedPositions = available.filter(
    (pos) => !linkedExposureIds.has(pos.id)
  )

  function handleLink() {
    if (!user || !selectedExposureId) return
    setError(null)
    setSuccessMsg(null)

    startTransition(async () => {
      const res = await linkAngelExposureAction(user.id, selectedExposureId)
      if (res.success) {
        setSuccessMsg('Holding linked successfully.')
        setSelectedExposureId('')
        // Refresh holdings list
        const updated = await getAngelHoldingsAction(user.id)
        setHoldings(updated)
      } else {
        setError(res.error ?? 'Could not link holding.')
      }
    })
  }

  function handleUnlink(exposureId: string, companyName: string) {
    if (!user) return
    if (
      !confirm(
        `Remove ${companyName} from this angel's portal view? The underlying company exposure record will not be deleted.`
      )
    ) {
      return
    }

    setError(null)
    setSuccessMsg(null)

    startTransition(async () => {
      const res = await unlinkAngelExposureAction(user.id, exposureId)
      if (res.success) {
        setSuccessMsg(`Unlinked ${companyName}.`)
        const updated = await getAngelHoldingsAction(user.id)
        setHoldings(updated)
      } else {
        setError(res.error ?? 'Could not unlink holding.')
      }
    })
  }

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-xl p-0 flex flex-col bg-white overflow-hidden shadow-2xl border-l border-zinc-200"
      >
        {/* Header */}
        <SheetHeader className="p-6 border-b border-zinc-100 bg-zinc-50/50">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 text-xs">
              Angel Investor
            </Badge>
            <span className="text-xs text-zinc-400">·</span>
            <span className="text-xs text-zinc-500 font-mono truncate">
              {user?.email}
            </span>
          </div>
          <SheetTitle className="text-lg font-bold text-zinc-900 mt-1">
            Manage Portfolio Holdings
          </SheetTitle>
          <SheetDescription className="text-xs text-zinc-500">
            Link and unlink company positions visible to this angel in their personal investor portal.
          </SheetDescription>
        </SheetHeader>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-xs text-red-700">
              {error}
            </div>
          )}
          {successMsg && (
            <div className="rounded-lg bg-emerald-50 border border-emerald-200 px-4 py-3 text-xs text-emerald-700">
              {successMsg}
            </div>
          )}

          {/* Add holding section */}
          <div className="p-4 rounded-xl border border-blue-100 bg-blue-50/30 space-y-3">
            <p className="text-xs font-semibold text-zinc-900 flex items-center gap-1.5">
              <Plus className="w-3.5 h-3.5 text-[#1a23bd]" />
              Assign Position to Angel
            </p>
            <div className="flex flex-col sm:flex-row gap-2">
              <select
                value={selectedExposureId}
                onChange={(e) => setSelectedExposureId(e.target.value)}
                disabled={loading || isPending || unlinkedPositions.length === 0}
                className="flex-1 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs text-zinc-800 focus:border-[#1a23bd] focus:outline-none focus:ring-1 focus:ring-[#1a23bd]"
              >
                <option value="">
                  {unlinkedPositions.length === 0
                    ? 'No additional positions available'
                    : 'Select a company position...'}
                </option>
                {unlinkedPositions.map((pos) => (
                  <option key={pos.id} value={pos.id}>
                    {pos.company_name} — {pos.instrument_name || pos.exposure_type}{' '}
                    ({formatCurrency(pos.amount_invested)})
                  </option>
                ))}
              </select>
              <Button
                size="sm"
                onClick={handleLink}
                disabled={!selectedExposureId || isPending}
                className="bg-[#1a23bd] hover:bg-[#151ca3] text-white shrink-0 text-xs"
              >
                {isPending ? 'Linking...' : 'Link Holding'}
              </Button>
            </div>
            <p className="text-[11px] text-zinc-400">
              Links an existing position recorded on the company master ledger to this angel.
            </p>
          </div>

          {/* Current holdings list */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-zinc-700 uppercase tracking-wider">
                Assigned Company Holdings ({holdings.length})
              </p>
              {holdings.length > 0 && (
                <p className="text-xs text-zinc-400 font-medium">
                  Total Deployed:{' '}
                  <span className="text-zinc-900 font-semibold">
                    {formatCurrency(
                      holdings.reduce((sum, h) => sum + h.amount_invested, 0)
                    )}
                  </span>
                </p>
              )}
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center p-12 text-zinc-400 gap-2">
                <Spinner className="w-5 h-5 text-[#1a23bd]" />
                <span className="text-xs">Loading holdings...</span>
              </div>
            ) : holdings.length === 0 ? (
              <div className="text-center py-10 px-4 rounded-xl border border-dashed border-zinc-200 bg-zinc-50/50">
                <Building2 className="w-8 h-8 text-zinc-300 mx-auto mb-2" />
                <p className="text-xs font-medium text-zinc-700">No holdings assigned</p>
                <p className="text-[11px] text-zinc-400 mt-1 max-w-xs mx-auto">
                  Use the dropdown above to assign company investment positions to this angel investor.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-zinc-100 border border-zinc-200/80 rounded-xl bg-white overflow-hidden shadow-xs">
                {holdings.map((holding) => (
                  <div
                    key={holding.id}
                    className="p-3.5 flex items-center justify-between gap-3 hover:bg-zinc-50/60 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-zinc-100 border border-zinc-200/60 flex items-center justify-center shrink-0 text-zinc-600 font-bold text-xs">
                        {holding.company_name.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-xs font-semibold text-zinc-900 truncate">
                            {holding.company_name}
                          </p>
                          <Badge
                            variant="outline"
                            className="text-[10px] py-0 px-1.5 font-normal text-zinc-500 bg-zinc-50"
                          >
                            {holding.exposure_type}
                          </Badge>
                        </div>
                        <p className="text-[11px] text-zinc-400 truncate">
                          {holding.instrument_name || 'Standard Position'}
                          {holding.issue_date ? ` · ${holding.issue_date}` : ''}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 shrink-0">
                      <div className="text-right">
                        <p className="text-xs font-semibold text-zinc-900 tabular-nums">
                          {formatCurrency(holding.amount_invested)}
                        </p>
                        <p className="text-[10px] text-zinc-400">Cost Basis</p>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          handleUnlink(holding.exposure_id, holding.company_name)
                        }
                        disabled={isPending}
                        title="Unlink position from angel"
                        className="p-1.5 rounded-md text-zinc-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-zinc-100 bg-zinc-50 flex items-center justify-between text-xs text-zinc-500">
          <span>TVCLabs Portfolio OS</span>
          <Button variant="outline" size="sm" onClick={onClose} className="text-xs">
            Close
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
