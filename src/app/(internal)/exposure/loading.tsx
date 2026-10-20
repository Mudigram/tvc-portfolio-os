import { Skeleton } from '@/components/ui/skeleton'

export default function ExposureLoading() {
  return (
    <div className="space-y-8 max-w-[1600px] mx-auto animate-pulse">
      {/* Header skeleton */}
      <div className="border-b border-zinc-200 pb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-7 w-64 rounded-md" />
          <Skeleton className="h-4 w-96 rounded-md" />
        </div>
        <Skeleton className="h-10 w-52 rounded-xl" />
      </div>

      {/* Summary bar skeleton */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 p-5 sm:p-6 rounded-2xl border border-zinc-200/80 bg-white shadow-xs">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-3 w-24 rounded" />
            <Skeleton className="h-8 w-32 rounded-md" />
          </div>
        ))}
      </div>

      {/* Table skeleton */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-36 rounded" />
          <Skeleton className="h-4 w-48 rounded" />
        </div>
        <div className="rounded-xl border border-zinc-200/80 bg-white overflow-hidden p-4 space-y-3 shadow-xs">
          <Skeleton className="h-10 w-full rounded-md" />
          {[1, 2, 3, 4, 5].map((row) => (
            <Skeleton key={row} className="h-12 w-full rounded-md" />
          ))}
        </div>
      </div>
    </div>
  )
}
