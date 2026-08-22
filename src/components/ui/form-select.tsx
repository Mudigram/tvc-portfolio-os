// ─────────────────────────────────────────────────────────────
// FormSelect — native <select> wrapper
// Matches SelectTrigger (shadcn) visual language exactly:
// same border, radius, height, padding, chevron, and focus ring.
//
// Usage:
//   <FormSelect value={val} onChange={(e) => setVal(e.target.value)}>
//     <option value="a">Option A</option>
//   </FormSelect>
//
//   <FormSelect className="w-40"> — override width as needed
// ─────────────────────────────────────────────────────────────

import * as React from 'react'
import { cn } from '@/lib/utils'

function FormSelect({
  className,
  children,
  ...props
}: React.ComponentProps<'select'>) {
  return (
    <div className="relative w-full">
      <select
        data-slot="form-select"
        className={cn(
          // Match SelectTrigger exactly
          'h-9 w-full appearance-none rounded-md border border-zinc-200 bg-white pl-3 pr-8 text-sm text-zinc-900 outline-none transition-colors',
          // Focus — brand colour ring
          'focus:border-[#1a23bd] focus:ring-2 focus:ring-[#1a23bd]/15',
          // Disabled
          'disabled:cursor-not-allowed disabled:opacity-50',
          className
        )}
        {...props}
      >
        {children}
      </select>
      {/* Custom chevron — mirrors SelectTrigger's ChevronDownIcon */}
      <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 9l6 6 6-6" />
        </svg>
      </span>
    </div>
  )
}

export { FormSelect }
