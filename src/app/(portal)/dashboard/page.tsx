import { serverFetch } from "@/lib/shared/server-fetch";
import { logger } from "@/lib/shared/logger";
import { DashboardContent } from "./dashboard-content";
import { DashboardSkeleton } from "@/components/shared/dashboard-skeleton";
import { DemoBanner } from "@/components/shared/demo-banner";
import { Suspense } from "react";
import type { DashboardData } from "@/lib/types";
import { getBusinessTodayIso } from "@/lib/business-date";
import { shouldBypassAuthenticatedSSRFetch } from "@/lib/shared/e2e-runtime";
import { getServerActiveTenantId } from "@/lib/shared/server-session";

async function getActiveTenantId(): Promise<string | undefined> {
  return getServerActiveTenantId();
}

async function fetchDashboard(tenantId: string, referenceDate: string): Promise<DashboardData | null> {
  try {
    return await serverFetch<DashboardData>("/api/v1/academia/dashboard", {
      query: { tenantId, referenceDate, scope: "CLIENTES" },
      next: { revalidate: 60 },
    });
  } catch (error) {
    logger.warn("[Dashboard] SSR fetch failed, falling back to client", { error });
    return null;
  }
}

async function DashboardLoader() {
  const date = getBusinessTodayIso();
  const tenantId = await getActiveTenantId();
  const data =
    tenantId && !(await shouldBypassAuthenticatedSSRFetch())
      ? await fetchDashboard(tenantId, date)
      : null;

  return <DashboardContent initialData={data} initialDate={date} />;
}

export default function DashboardPage() {
  return (
    <>
      <Suspense fallback={null}>
        <DemoBanner />
      </Suspense>
      <Suspense fallback={<DashboardSkeleton />}>
        <DashboardLoader />
      </Suspense>
    </>
  );
}
