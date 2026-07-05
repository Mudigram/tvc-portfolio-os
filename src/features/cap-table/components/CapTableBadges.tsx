// ─────────────────────────────────────────────────────────────
// Cap Table — Status badge components
// Pure presentational. No data fetching.
// ─────────────────────────────────────────────────────────────
import type { CapTableStatus, OwnershipStatus } from '../types'

// ── Cap table document freshness ─────────────────────────────
export function CapTableStatusBadge({ status }: { status: CapTableStatus }) {
  const config = {
    Green: {
      label: 'Up to date',
      classes: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
      dot: 'bg-emerald-500',
    },
    Amber: {
      label: 'Outdated',
      classes: 'bg-amber-50 text-amber-700 ring-amber-200',
      dot: 'bg-amber-400',
    },
    Red: {
      label: 'Missing',
      classes: 'bg-red-50 text-red-700 ring-red-200',
      dot: 'bg-red-500',
    },
  }[status]

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${config.classes}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${config.dot}`} />
      {config.label}
    </span>
  )
}

// ── TVC ownership movement direction ─────────────────────────
export function OwnershipStatusBadge({
  status,
}: {
  status: OwnershipStatus | null
}) {
  if (!status) {
    return (
      <span className="text-sm text-zinc-400">—</span>
    )
  }

  const config = {
    Increased: {
      label: 'Increased',
      classes: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
    },
    Maintained: {
      label: 'Maintained',
      classes: 'bg-zinc-100 text-zinc-600 ring-zinc-200',
    },
    Diluted: {
      label: 'Diluted',
      classes: 'bg-red-50 text-red-700 ring-red-200',
    },
  }[status]

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${config.classes}`}
    >
      {config.label}
    </span>
  )
}

// ── Alert flag pill ───────────────────────────────────────────
export function AlertPill({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-1 text-xs font-medium text-red-700 ring-1 ring-inset ring-red-200">
      <svg
        className="h-3 w-3"
        viewBox="0 0 12 12"
        fill="currentColor"
        aria-hidden="true"
      >
        <path d="M6 1a5 5 0 100 10A5 5 0 006 1zm0 3a.75.75 0 01.75.75v2.5a.75.75 0 01-1.5 0v-2.5A.75.75 0 016 4zm0 5.5a.75.75 0 110-1.5.75.75 0 010 1.5z" />
      </svg>
      {label}
    </span>
  )
}