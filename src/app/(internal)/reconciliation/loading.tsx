import { Skeleton } from '@/components/ui/skeleton'

export default function ReconciliationLoading() {
  return (
    <div className="space-y-8 max-w-[1200px] mx-auto py-2 animate-pulse">
      {/* Header skeleton */}
      <div className="border-b border-zinc-100 pb-6 space-y-2">
        <Skeleton className="h-7 w-72 rounded-md" />
        <Skeleton className="h-4 w-96 rounded-md" />
      </div>

      {/* Summary strip skeleton */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="p-4 sm:p-5 rounded-2xl border border-zinc-200/80 bg-white shadow-xs space-y-2">
            <Skeleton className="h-3 w-28 rounded" />
            <Skeleton className="h-8 w-20 rounded-md" />
          </div>
        ))}
      </div>

      {/* Progress bar skeleton */}
      <div className="p-5 rounded-2xl border border-zinc-200/80 bg-white shadow-xs space-y-2.5">
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-44 rounded" />
          <Skeleton className="h-4 w-12 rounded" />
        </div>
        <Skeleton className="h-2 w-full rounded-full" />
      </div>

      {/* Accordion groups skeleton */}
      <div className="space-y-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="p-5 rounded-2xl border border-zinc-200/80 bg-white shadow-xs flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Skeleton className="w-2.5 h-2.5 rounded-full" />
              <div className="space-y-1">
                <Skeleton className="h-4 w-32 rounded" />
                <Skeleton className="h-3 w-24 rounded" />
              </div>
            </div>
            <Skeleton className="h-5 w-20 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  )
}
