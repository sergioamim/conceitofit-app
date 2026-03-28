import { Suspense } from "react";
import { serverFetch } from "@/lib/shared/server-fetch";
import { AdminDashboardContent } from "./admin-dashboard-content";
import type {
  Academia,
  GlobalAdminSecurityOverview,
  MetricasOperacionaisGlobal,
  Tenant,
} from "@/lib/types";

function AdminDashboardSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <div className="space-y-2">
        <div className="h-4 w-24 animate-pulse rounded bg-secondary" />
        <div className="h-8 w-72 animate-pulse rounded bg-secondary" />
        <div className="h-4 w-96 animate-pulse rounded bg-secondary" />
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-32 animate-pulse rounded-xl border border-border bg-card" />
        ))}
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-28 animate-pulse rounded-xl border border-border bg-card/60" />
        ))}
      </div>
    </div>
  );
}

interface AdminEnvelope<T> {
  data?: T;
  content?: T;
}

function extractData<T>(envelope: AdminEnvelope<T> | T): T {
  if (envelope && typeof envelope === "object" && ("data" in envelope || "content" in envelope)) {
    const wrapped = envelope as AdminEnvelope<T>;
    return (wrapped.data ?? wrapped.content ?? envelope) as T;
  }
  return envelope as T;
}

async function fetchAdminData() {
  let academias: Academia[] = [];
  let unidades: Tenant[] = [];
  let seguranca: GlobalAdminSecurityOverview = { totalUsers: 0, activeMemberships: 0, defaultUnitsConfigured: 0, eligibleForNewUnits: 0 };
  let metricas: MetricasOperacionaisGlobal | null = null;
  let error: string | null = null;
  let operationalError: string | null = null;

  try {
    const [academiasRes, unidadesRes, segurancaRes] = await Promise.all([
      serverFetch<AdminEnvelope<Academia[]> | Academia[]>("/api/v1/admin/academias", {
        next: { revalidate: 120 },
      }),
      serverFetch<AdminEnvelope<Tenant[]> | Tenant[]>("/api/v1/admin/unidades", {
        next: { revalidate: 120 },
      }),
      serverFetch<AdminEnvelope<GlobalAdminSecurityOverview> | GlobalAdminSecurityOverview>(
        "/api/v1/admin/seguranca/overview",
        { next: { revalidate: 120 } }
      ),
    ]);

    const rawAcademias = extractData(academiasRes);
    academias = Array.isArray(rawAcademias) ? rawAcademias : [];

    const rawUnidades = extractData(unidadesRes);
    unidades = Array.isArray(rawUnidades) ? rawUnidades : [];

    const rawSeguranca = extractData(segurancaRes);
    const seg = rawSeguranca as GlobalAdminSecurityOverview;
    seguranca = {
      totalUsers: seg?.totalUsers ?? 0,
      activeMemberships: seg?.activeMemberships ?? 0,
      defaultUnitsConfigured: seg?.defaultUnitsConfigured ?? 0,
      eligibleForNewUnits: seg?.eligibleForNewUnits ?? 0,
    };
  } catch (e) {
    error = e instanceof Error ? e.message : "Erro ao carregar dados do backoffice";
  }

  try {
    const metricasRes = await serverFetch<AdminEnvelope<MetricasOperacionaisGlobal> | MetricasOperacionaisGlobal>(
      "/api/v1/admin/metricas/operacionais/global",
      { next: { revalidate: 120 } }
    );
    metricas = extractData(metricasRes);
  } catch (e) {
    operationalError = e instanceof Error ? e.message : "Erro ao carregar métricas operacionais";
  }

  return { academias, unidades, seguranca, metricas, error, operationalError };
}

async function AdminDashboardLoader() {
  const { academias, unidades, seguranca, metricas, error, operationalError } = await fetchAdminData();

  const stats = {
    totalAcademias: academias.length,
    totalUnidades: unidades.length,
    totalAdmins: seguranca.totalUsers,
    elegiveisNovasUnidades: seguranca.eligibleForNewUnits,
  };

  if (error) {
    return (
      <div className="flex flex-col gap-6">
        <header className="space-y-2">
          <p className="text-sm font-medium text-gym-accent">Administração</p>
          <h1 className="text-3xl font-display font-bold leading-tight">Dashboard do backoffice</h1>
        </header>
        <div className="rounded-xl border border-gym-danger/30 bg-gym-danger/10 px-4 py-3 text-sm text-gym-danger">
          {error}
        </div>
      </div>
    );
  }

  return (
    <AdminDashboardContent
      stats={stats}
      metricas={metricas}
      operationalError={operationalError}
    />
  );
}

export default function AdminHomePage() {
  return (
    <Suspense fallback={<AdminDashboardSkeleton />}>
      <AdminDashboardLoader />
    </Suspense>
  );
}
