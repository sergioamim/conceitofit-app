import { Skeleton } from "@/components/ui/skeleton";

export function MetricCardSkeleton() {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-start justify-between gap-2">
        <Skeleton className="h-3 w-32" />
        <Skeleton className="size-4 rounded-full" />
      </div>
      <Skeleton className="mt-2 h-8 w-20" />
      <Skeleton className="mt-2 h-3 w-40" />
    </div>
  );
}

export function DashboardSkeleton({ hideTabs = false }: { hideTabs?: boolean }) {
  return (
    <div role="status" aria-live="polite" className="space-y-6">
      <span className="sr-only">Carregando dashboard…</span>
      <div className="flex items-start justify-between gap-4">
        <div>
          <Skeleton className="h-8 w-40" />
          <Skeleton className="mt-2 h-4 w-64" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-[170px]" />
        </div>
      </div>

      {!hideTabs && (
        <div className="inline-flex rounded-lg border border-border bg-card p-1 gap-1">
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-8 w-24" />
        </div>
      )}

      {/* Metric Cards Skeleton */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
        <MetricCardSkeleton />
        <MetricCardSkeleton />
        <MetricCardSkeleton />
        <MetricCardSkeleton />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        {/* Box 1 */}
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="mb-4 flex items-center justify-between">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-3 w-20" />
          </div>
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <Skeleton className="h-6 w-16 rounded-full" />
              </div>
            ))}
          </div>
        </div>

        {/* Box 2 */}
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="mb-4 flex items-center justify-between">
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-3 w-20" />
          </div>
          <div className="divide-y divide-border">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between py-3">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-3 w-32" />
                </div>
                <Skeleton className="h-6 w-20 rounded-full" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
