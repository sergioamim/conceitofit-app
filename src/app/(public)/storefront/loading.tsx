export default function StorefrontLoading() {
  return (
    <main>
      {/* Hero skeleton */}
      <div className="flex min-h-[420px] items-center justify-center bg-gradient-to-br from-gym-accent/5 via-background to-background">
        <div className="mx-auto max-w-3xl space-y-4 px-6 text-center">
          <div className="mx-auto h-10 w-80 animate-pulse rounded-lg bg-secondary" />
          <div className="mx-auto h-5 w-64 animate-pulse rounded bg-secondary" />
          <div className="mx-auto flex justify-center gap-3 pt-4">
            <div className="h-12 w-32 animate-pulse rounded-lg bg-secondary" />
            <div className="h-12 w-32 animate-pulse rounded-lg bg-secondary" />
          </div>
        </div>
      </div>

      {/* Planos skeleton */}
      <div className="py-16">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mx-auto mb-10 h-8 w-48 animate-pulse rounded bg-secondary" />
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-72 animate-pulse rounded-2xl border border-border bg-card" />
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
