import { serverFetch } from "@/lib/shared/server-fetch";
import { DashboardContent } from "./dashboard-content";
import { DashboardSkeleton } from "@/components/shared/dashboard-skeleton";
import { Suspense } from "react";
import { cookies } from "next/headers";
import type { DashboardData } from "@/lib/types";

function todayIso() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

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
  const date = todayIso();
  const tenantId = await getActiveTenantId();
  const data = tenantId ? await fetchDashboard(tenantId, date) : null;

  return <DashboardContent initialData={data} initialDate={date} />;
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <DashboardLoader />
    </Suspense>
  );
}
