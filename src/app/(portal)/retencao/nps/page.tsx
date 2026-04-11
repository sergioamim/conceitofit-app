import { Suspense } from "react";
import { serverFetch } from "@/lib/shared/server-fetch";
import { shouldBypassAuthenticatedSSRFetch } from "@/lib/shared/e2e-runtime";
import { logger } from "@/lib/shared/logger";
import { getServerActiveTenantId } from "@/lib/shared/server-session";
import type { NpsDashboard } from "@/lib/api/nps";
import { NpsDashboardContent } from "./nps-content";

export const dynamic = "force-dynamic";

async function NpsDashboardLoader() {
  const tenantId = await getServerActiveTenantId();

  let data: NpsDashboard | null = null;

  if (tenantId && !(await shouldBypassAuthenticatedSSRFetch())) {
    const hoje = new Date();
    const inicio = new Date(hoje.getFullYear(), hoje.getMonth(), 1)
      .toISOString()
      .slice(0, 10);
    const fim = hoje.toISOString().slice(0, 10);

    try {
      data = await serverFetch<NpsDashboard>(
        "/api/v1/retencao/nps/dashboard",
        { query: { tenantId, inicio, fim } },
      );
    } catch (error) {
      logger.warn("[NPS Dashboard] SSR fetch failed, falling back to client", {
        error,
      });
    }
  }

  return <NpsDashboardContent initialData={data} />;
}

export default function NpsDashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[60vh] items-center justify-center text-sm text-muted-foreground animate-pulse">
          Carregando...
        </div>
      }
    >
      <NpsDashboardLoader />
    </Suspense>
  );
}
