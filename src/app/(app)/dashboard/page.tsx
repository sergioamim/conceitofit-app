import { serverFetch } from "@/lib/shared/server-fetch";
import { DashboardContent } from "./dashboard-content";
import { DashboardSkeleton } from "@/components/shared/dashboard-skeleton";
import { DemoBanner } from "@/components/shared/demo-banner";
import { Suspense } from "react";
import { cookies } from "next/headers";
import type { DashboardData } from "@/lib/types";
import { getBusinessTodayIso } from "@/lib/shared/business-date";

async function getActiveTenantId(): Promise<string | undefined> {
  const jar = await cookies();
  return jar.get("academia-active-tenant-id")?.value;
}

async function fetchDashboard(tenantId: string, referenceDate: string): Promise<DashboardData | null> {
  try {
    return await serverFetch<DashboardData>("/api/v1/academia/dashboard", {
      query: { tenantId, referenceDate, scope: "FULL" },
      next: { revalidate: 60 },
    });
  } catch {
    return null;
  }
}

async function DashboardLoader() {
  const date = getBusinessTodayIso();
  const tenantId = await getActiveTenantId();
  const data = tenantId ? await fetchDashboard(tenantId, date) : null;

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
