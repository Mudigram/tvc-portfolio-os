'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Building2, User, Loader2 } from 'lucide-react'
import { useDebounce } from '@/hooks/use-debounce'
import { globalSearchAction, type GlobalSearchResult } from '@/features/search/actions/globalSearch.action'

export function CommandPalette() {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<GlobalSearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  const debouncedQuery = useDebounce(query, 300)

  // Toggle on Cmd+K or Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setIsOpen((prev) => !prev)
      }
      if (e.key === 'Escape' && isOpen) {
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
  }, [isOpen])

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setQuery('')
      setResults([])
      setActiveIndex(0)
      // Slight delay to allow modal to render before focusing
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [isOpen])

  // Perform search
  useEffect(() => {
    if (!debouncedQuery.trim()) {
      setResults([])
      setLoading(false)
      return
    }

    let isMounted = true
    setLoading(true)
    
    globalSearchAction(debouncedQuery)
      .then((data) => {
        if (isMounted) {
          setResults(data)
          setActiveIndex(0)
        }
      })
      .finally(() => {
        if (isMounted) setLoading(false)
      })

    return () => {
      isMounted = false
    }
  }, [debouncedQuery])

  // Handle keyboard navigation inside the modal
  const handleInputKeyDown = (e: React.KeyboardEvent) => {
    if (results.length === 0) return

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex((prev) => (prev + 1) % results.length)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex((prev) => (prev - 1 + results.length) % results.length)
    } else if (e.key === 'Enter') {
      e.preventDefault()
      const selected = results[activeIndex]
      if (selected) {
        handleSelect(selected)
      }
    }
  }

  const handleSelect = (item: GlobalSearchResult) => {
    setIsOpen(false)
    router.push(item.href)
  }

  if (!isOpen) return null

  const companies = results.filter((r) => r.type === 'company')
  const founders = results.filter((r) => r.type === 'founder')

  let currentIndex = 0

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 sm:pt-32">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-zinc-900/40 backdrop-blur-sm transition-opacity" 
        onClick={() => setIsOpen(false)}
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
            onChange={(e) => {
              setQuery(e.target.value)
              setLoading(true) // Immediately show loading state
            }}
            onKeyDown={handleInputKeyDown}
          />
          {loading && <Loader2 className="w-4 h-4 text-zinc-400 animate-spin shrink-0" />}
          <kbd className="hidden sm:inline-block border border-zinc-200 bg-zinc-50 text-zinc-400 rounded px-2 py-0.5 text-[10px] font-mono font-medium ml-2">
            ESC
          </kbd>
        </div>

        {/* Results Area */}
        <div className="max-h-[60vh] overflow-y-auto overscroll-contain pb-2">
          {query.trim() !== '' && results.length === 0 && !loading && (
            <div className="p-6 text-center text-sm text-zinc-500">
              No results found for &quot;{query}&quot;
            </div>
          )}

          {query.trim() === '' && !loading && (
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
