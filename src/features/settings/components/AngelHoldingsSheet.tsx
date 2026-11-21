'use client'

import { useState, useEffect, useTransition, useMemo } from 'react'
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
  getAllEcosystemCompaniesAction,
  linkAngelExposureAction,
  unlinkAngelExposureAction,
  createAndLinkAngelHoldingAction,
} from '../actions/settings.actions'
import type {
  ManagedUser,
  AngelHolding,
  EcosystemCompany,
} from '../types'
import {
  Building2,
  Plus,
  Trash2,
  Search,
  ChevronDown,
  Layers,
  Sparkles,
  CheckCircle2,
} from 'lucide-react'

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

function formatPct(n: number | null): string {
  if (n == null || n === 0) return '—'
  return `${n.toFixed(2)}%`
}

export function AngelHoldingsSheet({
  user,
  isOpen,
  onClose,
}: AngelHoldingsSheetProps) {
  const [holdings, setHoldings] = useState<AngelHolding[]>([])
  const [companies, setCompanies] = useState<EcosystemCompany[]>([])
  const [loading, setLoading] = useState(!!user && isOpen)
  const [error, setError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  // Company Combobox & Search State
  const [selectedCompany, setSelectedCompany] = useState<EcosystemCompany | null>(null)
  const [isCompanyDropdownOpen, setIsCompanyDropdownOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  // Holding Investment Form State
  const [entryMode, setEntryMode] = useState<'existing' | 'new'>('new')
  const [selectedExistingExposureId, setSelectedExistingExposureId] = useState('')
  const [amountInvested, setAmountInvested] = useState('')
  const [exposureType, setExposureType] = useState('SAFE')
  const [instrumentName, setInstrumentName] = useState('')
  const [ownershipPct, setOwnershipPct] = useState('')
  const [issueDate, setIssueDate] = useState(() => new Date().toISOString().split('T')[0])

  // Session Reset when opening for a new angel user
  const sessionKey = `${user?.id ?? ''}|${isOpen}`
  const [lastSession, setLastSession] = useState(sessionKey)
  if (sessionKey !== lastSession) {
    setLastSession(sessionKey)
    setHoldings([])
    setCompanies([])
    setSelectedCompany(null)
    setIsCompanyDropdownOpen(false)
    setSearchQuery('')
    setSelectedExistingExposureId('')
    setAmountInvested('')
    setOwnershipPct('')
    setError(null)
    setSuccessMsg(null)
    setLoading(true)
  }

  // Fetch holdings and all ecosystem companies
  useEffect(() => {
    if (!user || !isOpen) return

    let isMounted = true

    Promise.all([
      getAngelHoldingsAction(user.id),
      getAllEcosystemCompaniesAction(),
    ])
      .then(([holdingsData, companiesData]) => {
        if (!isMounted) return
        setHoldings(holdingsData)
        setCompanies(companiesData)
      })
      .catch((err) => {
        if (!isMounted) return
        setError(err?.message ?? 'Failed to load angel portfolio data.')
      })
      .finally(() => {
        if (isMounted) setLoading(false)
      })

    return () => {
      isMounted = false
    }
  }, [user, isOpen])

  // Filter companies by search query
  const filteredCompanies = useMemo(() => {
    if (!searchQuery.trim()) return companies
    const q = searchQuery.toLowerCase().trim()
    return companies.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.sector && c.sector.toLowerCase().includes(q)) ||
        (c.stage && c.stage.toLowerCase().includes(q))
    )
  }, [companies, searchQuery])

  // Linked company IDs to prevent duplicate mappings
  const linkedCompanyIds = useMemo(() => {
    return new Set(holdings.map((h) => h.company_id))
  }, [holdings])

  // Submit Handler: Link existing or create new holding
  function handleAssignHolding() {
    if (!user || !selectedCompany) return
    setError(null)
    setSuccessMsg(null)

    startTransition(async () => {
      if (entryMode === 'existing' && selectedExistingExposureId) {
        // Link to existing exposure
        const res = await linkAngelExposureAction(user.id, selectedExistingExposureId)
        if (res.success) {
          setSuccessMsg(`Linked ${selectedCompany.name} position to this angel.`)
          resetHoldingForm()
          const updated = await getAngelHoldingsAction(user.id)
          setHoldings(updated)
        } else {
          setError(res.error ?? 'Failed to link position.')
        }
      } else {
        // Create new position with check size and link
        const amount = parseFloat(amountInvested)
        if (isNaN(amount) || amount <= 0) {
          setError('Please specify a valid investment check size.')
          return
        }

        const res = await createAndLinkAngelHoldingAction({
          angelUserId: user.id,
          companyId: selectedCompany.id,
          amountInvested: amount,
          exposureType,
          instrumentName: instrumentName.trim() || `${exposureType} Position`,
          ownershipPct: ownershipPct ? parseFloat(ownershipPct) : null,
          issueDate: issueDate || null,
        })

        if (res.success) {
          setSuccessMsg(`Successfully created & assigned ${formatCurrency(amount)} ${exposureType} in ${selectedCompany.name}.`)
          resetHoldingForm()
          const [updatedHoldings, updatedCompanies] = await Promise.all([
            getAngelHoldingsAction(user.id),
            getAllEcosystemCompaniesAction(),
          ])
          setHoldings(updatedHoldings)
          setCompanies(updatedCompanies)
        } else {
          setError(res.error ?? 'Failed to create and assign holding.')
        }
      }
    })
  }

  function resetHoldingForm() {
    setSelectedCompany(null)
    setSelectedExistingExposureId('')
    setAmountInvested('')
    setInstrumentName('')
    setOwnershipPct('')
    setEntryMode('new')
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
        className="w-full sm:max-w-2xl lg:max-w-3xl p-0 flex flex-col bg-white overflow-hidden shadow-2xl border-l border-zinc-200"
      >
        {/* Header */}
        <SheetHeader className="p-6 border-b border-zinc-100 bg-zinc-50/60">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 text-xs">
              Angel Investor Portfolio
            </Badge>
            <span className="text-xs text-zinc-400">·</span>
            <span className="text-xs text-zinc-600 font-mono truncate">
              {user?.email}
            </span>
          </div>
          <SheetTitle className="text-lg font-bold text-zinc-900 mt-1">
            Manage Portfolio Holdings
          </SheetTitle>
          <SheetDescription className="text-xs text-zinc-500">
            Assign investment positions and check sizes to this angel across all {companies.length} portfolio companies.
          </SheetDescription>
        </SheetHeader>

        {/* Content Body — zero horizontal overflow */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-6 space-y-6">
          {error && (
            <div className="rounded-xl bg-red-50 border border-red-200 p-3.5 text-xs text-red-700 font-medium">
              {error}
            </div>
          )}
          {successMsg && (
            <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3.5 text-xs text-emerald-800 font-medium flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* ── Section 1: Add / Assign Company Holding ────────────────── */}
          <div className="p-5 rounded-2xl border border-blue-100 bg-gradient-to-b from-blue-50/50 to-white shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold text-zinc-900 uppercase tracking-wide flex items-center gap-1.5">
                <Plus className="w-3.5 h-3.5 text-[#1a23bd]" />
                Assign Company Investment
              </p>
              <span className="text-[11px] font-semibold text-zinc-400">
                {companies.length} Ecosystem Companies Available
              </span>
            </div>

            {/* Custom Rounded Searchable Company Combobox */}
            <div className="space-y-1.5 relative">
              <label className="text-xs font-semibold text-zinc-600 uppercase tracking-wider block">
                Select Company
              </label>

              <button
                type="button"
                onClick={() => setIsCompanyDropdownOpen(!isCompanyDropdownOpen)}
                className="w-full rounded-xl border border-zinc-200 bg-white p-3 text-xs flex items-center justify-between shadow-2xs hover:border-zinc-300 focus:outline-none focus:ring-2 focus:ring-[#1a23bd]/20 transition-all text-left cursor-pointer"
              >
                {selectedCompany ? (
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center font-bold text-[#1a23bd] text-xs shrink-0">
                      {selectedCompany.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-zinc-900 truncate">{selectedCompany.name}</p>
                        {linkedCompanyIds.has(selectedCompany.id) && (
                          <span className="text-[10px] bg-amber-50 text-amber-700 border border-amber-200 px-1.5 py-0.2 rounded font-semibold">
                            Already In Portfolio
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-zinc-500 truncate mt-0.5">
                        {[selectedCompany.sector, selectedCompany.stage, selectedCompany.country].filter(Boolean).join(' · ') || 'Portfolio Company'}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2.5 text-zinc-400">
                    <Building2 className="w-4 h-4 text-zinc-400 shrink-0" />
                    <span>Search or select from all {companies.length} portfolio companies...</span>
                  </div>
                )}

                <div className="flex items-center gap-1.5 shrink-0 ml-2">
                  {selectedCompany && (
                    <span className="text-[11px] font-semibold text-[#1a23bd] hover:underline mr-1">
                      Change
                    </span>
                  )}
                  <ChevronDown
                    className={`w-4 h-4 text-zinc-400 transition-transform duration-200 ${
                      isCompanyDropdownOpen ? 'rotate-180' : ''
                    }`}
                  />
                </div>
              </button>

              {/* Searchable Dropdown Popover */}
              {isCompanyDropdownOpen && (
                <div className="absolute top-full left-0 right-0 mt-1.5 rounded-xl border border-zinc-200 bg-white shadow-xl z-50 p-2.5 space-y-2 flex flex-col">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      autoFocus
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder={`Search ${companies.length} companies by name, sector, or stage...`}
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-lg pl-8 pr-3 py-2 text-xs text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-[#1a23bd]"
                    />
                  </div>

                  <div className="overflow-y-auto max-h-60 divide-y divide-zinc-50 space-y-0.5">
                    {filteredCompanies.length === 0 ? (
                      <p className="p-4 text-center text-xs text-zinc-400">
                        No companies found matching "{searchQuery}".
                      </p>
                    ) : (
                      filteredCompanies.map((c) => {
                        const isSelected = selectedCompany?.id === c.id
                        const isAlreadyLinked = linkedCompanyIds.has(c.id)

                        return (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => {
                              setSelectedCompany(c)
                              setIsCompanyDropdownOpen(false)
                              setSearchQuery('')
                              if (c.existing_positions.length > 0) {
                                setEntryMode('existing')
                                setSelectedExistingExposureId(c.existing_positions[0].id)
                              } else {
                                setEntryMode('new')
                                setSelectedExistingExposureId('')
                              }
                            }}
                            className={`w-full flex items-center justify-between p-2.5 rounded-lg text-left text-xs hover:bg-zinc-50 transition-colors cursor-pointer ${
                              isSelected ? 'bg-blue-50/70 font-semibold' : ''
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <span className="w-6 h-6 rounded bg-zinc-100 border border-zinc-200/80 flex items-center justify-center font-bold text-[10px] text-zinc-700 shrink-0">
                                {c.name.slice(0, 2).toUpperCase()}
                              </span>
                              <div className="min-w-0">
                                <p className="truncate text-zinc-900 font-medium">{c.name}</p>
                                <p className="text-[10px] text-zinc-400 truncate">
                                  {[c.sector, c.stage].filter(Boolean).join(' · ') || 'Portfolio Asset'}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0 ml-2">
                              {isAlreadyLinked && (
                                <span className="text-[10px] text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.2 rounded font-medium">
                                  Holding Active
                                </span>
                              )}
                              {c.existing_positions.length > 0 && (
                                <span className="text-[10px] text-blue-700 bg-blue-50 border border-blue-100 px-1.5 py-0.2 rounded font-medium">
                                  {c.existing_positions.length} on ledger
                                </span>
                              )}
                            </div>
                          </button>
                        )
                      })
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Investment Form when Company is Selected */}
            {selectedCompany && (
              <div className="space-y-4 pt-3 border-t border-blue-100/60">
                {/* Mode Selector (if existing positions are available) */}
                {selectedCompany.existing_positions.length > 0 && (
                  <div className="flex items-center gap-2 pb-1">
                    <span className="text-xs font-semibold text-zinc-600">Method:</span>
                    <div className="flex items-center gap-1 bg-zinc-100 p-0.5 rounded-lg text-xs">
                      <button
                        type="button"
                        onClick={() => setEntryMode('existing')}
                        className={`px-2.5 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                          entryMode === 'existing'
                            ? 'bg-white text-zinc-900 shadow-2xs'
                            : 'text-zinc-500 hover:text-zinc-800'
                        }`}
                      >
                        Link Existing Position
                      </button>
                      <button
                        type="button"
                        onClick={() => setEntryMode('new')}
                        className={`px-2.5 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                          entryMode === 'new'
                            ? 'bg-white text-zinc-900 shadow-2xs'
                            : 'text-zinc-500 hover:text-zinc-800'
                        }`}
                      >
                        + Record Custom Check Size
                      </button>
                    </div>
                  </div>
                )}

                {entryMode === 'existing' && selectedCompany.existing_positions.length > 0 ? (
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-zinc-600 block">
                      Choose Ledger Position
                    </label>
                    <div className="space-y-1.5">
                      {selectedCompany.existing_positions.map((pos) => (
                        <label
                          key={pos.id}
                          className={`flex items-center justify-between p-3 rounded-xl border text-xs cursor-pointer transition-colors ${
                            selectedExistingExposureId === pos.id
                              ? 'bg-blue-50/70 border-blue-300 text-blue-950 font-semibold'
                              : 'bg-white border-zinc-200 hover:bg-zinc-50 text-zinc-800'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <input
                              type="radio"
                              name="exposure_position"
                              value={pos.id}
                              checked={selectedExistingExposureId === pos.id}
                              onChange={() => setSelectedExistingExposureId(pos.id)}
                              className="text-[#1a23bd] focus:ring-[#1a23bd]"
                            />
                            <span>
                              {pos.instrument_name || pos.exposure_type}
                            </span>
                          </div>
                          <span className="font-bold text-zinc-900 tabular-nums">
                            {formatCurrency(pos.amount_invested)}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="font-semibold text-zinc-600 block mb-1">
                        Check Size / Invested Amount ($) <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        value={amountInvested}
                        onChange={(e) => setAmountInvested(e.target.value)}
                        placeholder="e.g. 50000"
                        className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-[#1a23bd]"
                      />
                    </div>

                    <div>
                      <label className="font-semibold text-zinc-600 block mb-1">
                        Security / Instrument Type
                      </label>
                      <select
                        value={exposureType}
                        onChange={(e) => setExposureType(e.target.value)}
                        className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-[#1a23bd] cursor-pointer"
                      >
                        <option value="SAFE">SAFE (Simple Agreement for Future Equity)</option>
                        <option value="Equity">Direct Equity / Preferred Shares</option>
                        <option value="Convertible Note">Convertible Promissory Note</option>
                        <option value="Advisory Equity">Advisory Option / Equity</option>
                      </select>
                    </div>

                    <div>
                      <label className="font-semibold text-zinc-600 block mb-1">
                        Ownership % (Optional)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={ownershipPct}
                        onChange={(e) => setOwnershipPct(e.target.value)}
                        placeholder="e.g. 2.5"
                        className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-[#1a23bd]"
                      />
                    </div>

                    <div>
                      <label className="font-semibold text-zinc-600 block mb-1">
                        Investment / Issue Date
                      </label>
                      <input
                        type="date"
                        value={issueDate}
                        onChange={(e) => setIssueDate(e.target.value)}
                        className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-[#1a23bd]"
                      />
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-2 pt-2">
                  <Button
                    size="sm"
                    onClick={handleAssignHolding}
                    disabled={
                      isPending ||
                      (entryMode === 'existing' && !selectedExistingExposureId) ||
                      (entryMode === 'new' && (!amountInvested || parseFloat(amountInvested) <= 0))
                    }
                    className="bg-[#1a23bd] hover:bg-[#151ca3] text-white text-xs gap-1.5 shadow-2xs"
                  >
                    {isPending ? (
                      <>
                        <Spinner size="xs" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Plus className="w-3.5 h-3.5" />
                        {entryMode === 'existing' ? 'Link Holding' : 'Add to Angel Portfolio'}
                      </>
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={resetHoldingForm}
                    className="text-xs text-zinc-500"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* ── Section 2: Current Holdings Roster ─────────────────────── */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold text-zinc-800 uppercase tracking-wider">
                Assigned Company Holdings ({holdings.length})
              </p>
              {holdings.length > 0 && (
                <p className="text-xs text-zinc-500 font-medium">
                  Total Deployed:{' '}
                  <span className="text-zinc-900 font-bold tabular-nums">
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
                <span className="text-xs">Loading investor holdings...</span>
              </div>
            ) : holdings.length === 0 ? (
              <div className="text-center py-10 px-4 rounded-2xl border border-dashed border-zinc-200 bg-zinc-50/50">
                <Building2 className="w-8 h-8 text-zinc-300 mx-auto mb-2" />
                <p className="text-xs font-semibold text-zinc-700">No holdings assigned yet</p>
                <p className="text-[11px] text-zinc-400 mt-1 max-w-sm mx-auto">
                  Use the company search above to assign investment check sizes or link ledger positions to this angel investor.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-zinc-100 border border-zinc-200/90 rounded-2xl bg-white overflow-hidden shadow-2xs">
                {holdings.map((holding) => (
                  <div
                    key={holding.id}
                    className="p-4 flex items-center justify-between gap-4 hover:bg-zinc-50/60 transition-colors"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-zinc-100 border border-zinc-200/70 flex items-center justify-center shrink-0 text-zinc-700 font-bold text-xs shadow-2xs">
                        {holding.company_name.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-xs font-bold text-zinc-900 truncate">
                            {holding.company_name}
                          </p>
                          <Badge
                            variant="outline"
                            className="text-[10px] py-0 px-1.5 font-semibold text-zinc-600 bg-zinc-50 border-zinc-200"
                          >
                            {holding.exposure_type}
                          </Badge>
                          {holding.ownership_pct && holding.ownership_pct > 0 ? (
                            <span className="text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-100 px-1.5 py-0.2 rounded tabular-nums">
                              {formatPct(holding.ownership_pct)}
                            </span>
                          ) : null}
                        </div>
                        <p className="text-[11px] text-zinc-400 truncate mt-0.5">
                          {holding.instrument_name || 'Standard Holding'}
                          {holding.issue_date ? ` · Issued ${holding.issue_date}` : ''}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 shrink-0">
                      <div className="text-right">
                        <p className="text-sm font-bold text-zinc-900 tabular-nums">
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
                        className="p-2 rounded-lg text-zinc-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
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
          <span className="font-medium">TVCLabs Portfolio OS · Angel Governance</span>
          <Button variant="outline" size="sm" onClick={onClose} className="text-xs">
            Close
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
