'use client'

import { useState, useMemo, useRef, useEffect } from 'react'
import type { HolderOption } from '../services/holders.service'
import type { HolderType } from '../types'

const HOLDER_TYPES: HolderType[] = ['Founder', 'Investor', 'Advisor', 'Employee']

const inputClass =
  'w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 ' +
  'placeholder:text-zinc-400 focus:border-[#1a23bd] focus:outline-none ' +
  'focus:ring-2 focus:ring-[#1a23bd]/20'

const selectClass =
  'w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 ' +
  'focus:border-[#1a23bd] focus:outline-none focus:ring-2 focus:ring-[#1a23bd]/20'

interface Props {
  holders: HolderOption[]
  tvcHolderIds: string[]
}

export function HolderPicker({ holders = [], tvcHolderIds = [] }: Props) {
  const [query, setQuery] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [selected, setSelected] = useState<HolderOption | null>(null)
  const [creatingNew, setCreatingNew] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // Close dropdown on outside click safely
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  // TVCLabs entities pinned first, then filtered matches by name
  const filtered = useMemo(() => {
    const tvcEntities = holders.filter((h) => tvcHolderIds.includes(h.id))
    const others = holders.filter((h) => !tvcHolderIds.includes(h.id))

    const q = query.trim().toLowerCase()
    const matchedOthers = q
      ? others.filter((h) => h.name.toLowerCase().includes(q))
      : others

    const matchedTvc = q
      ? tvcEntities.filter((h) => h.name.toLowerCase().includes(q))
      : tvcEntities

    return [...matchedTvc, ...matchedOthers]
  }, [holders, tvcHolderIds, query])

  const hasExactMatch = useMemo(() => {
    return filtered.some((h) => h.name.toLowerCase() === query.trim().toLowerCase())
  }, [filtered, query])

  function handleSelect(holder: HolderOption) {
    setSelected(holder)
    setQuery(holder.name)
    setCreatingNew(false)
    setIsOpen(false)
  }

  function handleStartCreate() {
    setCreatingNew(true)
    setSelected(null)
    setIsOpen(false)
  }

  function handleClearSelection() {
    setSelected(null)
    setCreatingNew(false)
    setQuery('')
  }

  return (
    <div className="space-y-3">
      {/* ── Search / selected state ──────────────────────────── */}
      {!creatingNew && (
        <div className="relative" ref={containerRef}>
          <input
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              if (selected) setSelected(null) // Only clear if something was actually selected
              setIsOpen(true)
            }}
            onFocus={() => setIsOpen(true)}
            placeholder="Search holders by name…"
            className={inputClass}
            autoComplete="off"
          />

          <input
            type="hidden"
            name="holder_id"
            value={selected?.id ?? ''}
          />

          {selected && (
            <p className="text-xs text-emerald-600 mt-1.5 font-medium">
              ✓ {selected.name}
              {tvcHolderIds.includes(selected.id) && ' (TVCLabs entity)'}
            </p>
          )}

          {/* Dropdown */}
          {isOpen && (
            <div className="absolute z-10 mt-1 w-full rounded-lg border border-zinc-200 bg-white shadow-lg max-h-64 overflow-y-auto">
              {filtered.length === 0 && query.trim() === '' && (
                <p className="px-3 py-3 text-xs text-zinc-400">
                  Start typing to search holders…
                </p>
              )}

              {filtered.map((holder) => (
                <button
                  key={holder.id}
                  type="button"
                  onClick={() => handleSelect(holder)}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-zinc-50 transition-colors flex items-center justify-between gap-2"
                >
                  <span className="text-zinc-900">{holder.name}</span>
                  <span className="text-xs text-zinc-400 shrink-0">
                    {tvcHolderIds.includes(holder.id) ? 'TVCLabs entity' : holder.holder_type}
                  </span>
                </button>
              ))}

              {query.trim() !== '' && !hasExactMatch && (
                <button
                  type="button"
                  onClick={handleStartCreate}
                  className="w-full text-left px-3 py-2.5 text-sm text-[#1a23bd] hover:bg-blue-50 transition-colors border-t border-zinc-100 font-medium"
                >
                  + Add &ldquo;{query.trim()}&rdquo; as a new holder
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── Inline create-new-holder fields ──────────────────── */}
      {creatingNew && (
        <div className="rounded-lg border border-[#1a23bd]/20 bg-blue-50/40 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-[#1a23bd] uppercase tracking-wide">
              New holder
            </p>
            <button
              type="button"
              onClick={handleClearSelection}
              className="text-xs text-zinc-400 hover:text-zinc-700"
            >
              Cancel
            </button>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-zinc-500 uppercase tracking-wide">
                Name
              </label>
              <input
                type="text"
                name="new_holder_name"
                defaultValue={query}
                placeholder="Full name"
                className={inputClass}
                required
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-zinc-500 uppercase tracking-wide">
                Holder type
              </label>
              <select name="new_holder_type" className={selectClass} required>
                <option value="">Select type</option>
                {HOLDER_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <label className="text-xs font-medium text-zinc-500 uppercase tracking-wide">
                Email (optional)
              </label>
              <input
                type="type"
                name="new_holder_email"
                placeholder="name@example.com"
                className={inputClass}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}