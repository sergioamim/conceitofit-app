import { Suspense } from "react";
import { serverFetch } from "@/lib/shared/server-fetch";
import { SaasDashboardContent } from "./saas-dashboard-content";
import type {
  SaasMetricsResponse,
  SaasOnboardingResponse,
  SaasSeriesResponse,
} from "@/backoffice/api/admin-saas-metrics";

function SaasSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <div className="space-y-2">
        <div className="h-4 w-32 animate-pulse rounded bg-secondary" />
        <div className="h-8 w-80 animate-pulse rounded bg-secondary" />
      </div>
      <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-28 animate-pulse rounded-xl border border-border bg-card/60" />
        ))}
      </div>
      <div className="h-64 animate-pulse rounded-xl border border-border bg-card/60" />
    </div>
  );
}

interface Envelope<T> {
  data?: T;
  content?: T;
}

function extract<T>(envelope: Envelope<T> | T): T {
  if (envelope && typeof envelope === "object" && ("data" in envelope || "content" in envelope)) {
    const w = envelope as Envelope<T>;
    return (w.data ?? w.content ?? envelope) as T;
  }
  return envelope as T;
}

async function SaasLoader() {
  let metrics: SaasMetricsResponse | null = null;
  let series: SaasSeriesResponse | null = null;
  let onboarding: SaasOnboardingResponse | null = null;
  let error: string | null = null;

  try {
    const [metricsRes, seriesRes, onboardingRes] = await Promise.all([
      serverFetch<Envelope<SaasMetricsResponse> | SaasMetricsResponse>(
        "/api/v1/admin/metrics/saas",
        { next: { revalidate: 120 } },
      ),
      serverFetch<Envelope<SaasSeriesResponse> | SaasSeriesResponse>(
        "/api/v1/admin/metrics/saas/series",
        { next: { revalidate: 120 } },
      ),
      serverFetch<Envelope<SaasOnboardingResponse> | SaasOnboardingResponse>(
        "/api/v1/admin/metrics/saas/onboarding",
        { next: { revalidate: 120 } },
      ),
    ]);

    metrics = extract(metricsRes);
    series = extract(seriesRes);
    onboarding = extract(onboardingRes);
  } catch (e) {
    error = e instanceof Error ? e.message : "Erro ao carregar métricas SaaS";
  }

  return (
    <SaasDashboardContent
      metrics={metrics}
      series={series}
      onboarding={onboarding}
      error={error}
    />
  );
}

export default function SaasMetricsPage() {
  return (
    <Suspense fallback={<SaasSkeleton />}>
      <SaasLoader />
    </Suspense>
  );
}
