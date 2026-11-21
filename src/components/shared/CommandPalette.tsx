'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Building2, User, Loader2 } from 'lucide-react'
import { useDebounce } from '@/hooks/use-debounce'
import { globalSearchAction, type GlobalSearchResult } from '@/features/search/actions/globalSearch.action'

// Mounted only while the palette is open (see the shell at the bottom of this
// file), so every open starts from an empty state by construction. Previously
// one component kept its state across close/open and an effect reset
// query/results/activeIndex afterwards - a second render on every open, and the
// previous search's results visible for a frame.
function PaletteBody({ onClose }: { onClose: () => void }) {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<GlobalSearchResult[]>([])
  // The query `results` belongs to. Pairing them turns "do we have an answer
  // for the current text?" into a single comparison instead of a loading flag
  // that can outlive the keystroke that set it.
  const [resultsFor, setResultsFor] = useState<string | null>(null)
  const [activeIndex, setActiveIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  const debouncedQuery = useDebounce(query, 300)
  const hasQuery = debouncedQuery.trim().length > 0

  const isCurrent = hasQuery && resultsFor === debouncedQuery
  // Not showing anything until the debounce settles AND the request for that
  // exact text returns. Replaces the old `loading` state, which the change
  // handler set to true and nothing cleared once the query was deleted back to
  // empty - the spinner could hang on an empty box.
  const searching = hasQuery && !isCurrent
  const visibleResults = isCurrent ? results : []

  useEffect(() => {
    // Runs after the input is committed to the DOM, so the ref is populated.
    // One frame of delay keeps focus out of the same paint as the backdrop;
    // unlike the previous setTimeout(50) it is cancelled if the palette closes
    // first, so it cannot fire against an unmounted input.
    const frame = requestAnimationFrame(() => inputRef.current?.focus())
    return () => cancelAnimationFrame(frame)
  }, [])

  useEffect(() => {
    if (!hasQuery) return

    let isMounted = true

    globalSearchAction(debouncedQuery)
      .then((data) => {
        if (!isMounted) return
        setResults(data)
        setResultsFor(debouncedQuery)
        setActiveIndex(0)
      })
      .catch(() => {
        // Server actions reject on network or serialisation failure. Recording
        // the query as answered shows "No results" rather than spinning
        // forever, and keeps the rejection handled.
        if (!isMounted) return
        setResults([])
        setResultsFor(debouncedQuery)
      })

    return () => {
      isMounted = false
    }
  }, [debouncedQuery, hasQuery])

  // Handle keyboard navigation inside the modal
  // Keyboard navigation has to address the list that is actually on screen,
  // which is `visibleResults` - `results` can still hold the previous query's
  // hits while a new request is in flight, and selecting one of those would
  // navigate to something the user never saw.
  const handleInputKeyDown = (e: React.KeyboardEvent) => {
    if (visibleResults.length === 0) return

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex((prev) => (prev + 1) % visibleResults.length)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex((prev) => (prev - 1 + visibleResults.length) % visibleResults.length)
    } else if (e.key === 'Enter') {
      e.preventDefault()
      const selected = visibleResults[activeIndex]
      if (selected) {
        handleSelect(selected)
      }
    }
  }

  const handleSelect = (item: GlobalSearchResult) => {
    onClose()
    router.push(item.href)
  }

  const companies = visibleResults.filter((r) => r.type === 'company')
  const founders = visibleResults.filter((r) => r.type === 'founder')

  let currentIndex = 0

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 sm:pt-32">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-zinc-900/40 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-xl overflow-hidden bg-white rounded-xl shadow-2xl ring-1 ring-zinc-200/50 mx-4">
        {/* Search Input */}
        <div className="flex items-center px-4 border-b border-zinc-100">
          <Search className="w-5 h-5 text-zinc-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            className="w-full px-4 py-4 text-base text-zinc-900 bg-transparent outline-none placeholder:text-zinc-400"
            placeholder="Search companies and founders..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleInputKeyDown}
          />
          {searching && <Loader2 className="w-4 h-4 text-zinc-400 animate-spin shrink-0" />}
          <kbd className="hidden sm:inline-block border border-zinc-200 bg-zinc-50 text-zinc-400 rounded px-2 py-0.5 text-[10px] font-mono font-medium ml-2">
            ESC
          </kbd>
        </div>

        {/* Results Area */}
        <div className="max-h-[60vh] overflow-y-auto overscroll-contain pb-2">
          {hasQuery && !searching && visibleResults.length === 0 && (
            <div className="p-6 text-center text-sm text-zinc-500">
              No results found for &quot;{query}&quot;
            </div>
          )}

          {!hasQuery && (
            <div className="p-6 text-center text-sm text-zinc-400">
              Start typing to search...
            </div>
          )}

          {/* Companies Group */}
          {companies.length > 0 && (
            <div className="pt-2">
              <div className="px-4 py-2 text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                Companies
              </div>
              <ul>
                {companies.map((item) => {
                  const isSelected = activeIndex === currentIndex
                  currentIndex++
                  return (
                    <li key={item.id}>
                      <button
                        onClick={() => handleSelect(item)}
                        onMouseEnter={() => setActiveIndex(currentIndex - 1)}
                        className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors
                          ${isSelected ? 'bg-[#1a23bd]/5 text-[#1a23bd]' : 'text-zinc-700 hover:bg-zinc-50'}`}
                      >
                        <Building2 className={`w-4 h-4 ${isSelected ? 'text-[#1a23bd]' : 'text-zinc-400'}`} />
                        <div>
                          <p className={`text-sm font-medium ${isSelected ? 'text-[#1a23bd]' : 'text-zinc-900'}`}>
                            {item.title}
                          </p>
                          {item.subtitle && (
                            <p className={`text-xs ${isSelected ? 'text-[#1a23bd]/70' : 'text-zinc-500'}`}>
                              {item.subtitle}
                            </p>
                          )}
                        </div>
                      </button>
                    </li>
                  )
                })}
              </ul>
            </div>
          )}

          {/* Founders Group */}
          {founders.length > 0 && (
            <div className="pt-2">
              <div className="px-4 py-2 text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                Founders
              </div>
              <ul>
                {founders.map((item) => {
                  const isSelected = activeIndex === currentIndex
                  currentIndex++
                  return (
                    <li key={item.id}>
                      <button
                        onClick={() => handleSelect(item)}
                        onMouseEnter={() => setActiveIndex(currentIndex - 1)}
                        className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors
                          ${isSelected ? 'bg-[#1a23bd]/5 text-[#1a23bd]' : 'text-zinc-700 hover:bg-zinc-50'}`}
                      >
                        <User className={`w-4 h-4 ${isSelected ? 'text-[#1a23bd]' : 'text-zinc-400'}`} />
                        <div>
                          <p className={`text-sm font-medium ${isSelected ? 'text-[#1a23bd]' : 'text-zinc-900'}`}>
                            {item.title}
                          </p>
                          {item.subtitle && (
                            <p className={`text-xs ${isSelected ? 'text-[#1a23bd]/70' : 'text-zinc-500'}`}>
                              {item.subtitle}
                            </p>
                          )}
                        </div>
                      </button>
                    </li>
                  )
                })}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export function CommandPalette() {
  // The shell holds exactly one piece of state. Everything searchable lives in
  // PaletteBody, which is *not mounted* while the palette is closed - that is
  // what gives a fresh state on each open, instead of an effect resetting four
  // things after the fact.
  //
  // The listeners have to live up here precisely because the body is gone when
  // closed: Cmd+K has to work from a closed palette. Escape is now unconditional
  // (setting `false` over `false` is a no-op for React), which lets the effect
  // drop `isOpen` from its dependencies - previously it tore down and re-added
  // both window listeners on every open and every close.
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setIsOpen((prev) => !prev)
      }
      if (e.key === 'Escape') {
        setIsOpen(false)
      }
    }

    const handleCustomOpen = () => setIsOpen(true)

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('open-command-palette', handleCustomOpen)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('open-command-palette', handleCustomOpen)
    }
  }, [])

  if (!isOpen) return null

  return <PaletteBody onClose={() => setIsOpen(false)} />
}
