import { Suspense } from "react";
import { cookies } from "next/headers";
import { serverFetch } from "@/lib/shared/server-fetch";
import { shouldBypassAuthenticatedSSRFetch } from "@/lib/shared/e2e-runtime";
import { logger } from "@/lib/shared/logger";
import type { DashboardRetencao } from "@/lib/api/crm";
import { RetencaoContent } from "./retencao-content";

export const dynamic = "force-dynamic";

async function RetencaoLoader() {
  const jar = await cookies();
  const tenantId = jar.get("academia-active-tenant-id")?.value;

  let data: DashboardRetencao | null = null;

  if (tenantId && !shouldBypassAuthenticatedSSRFetch()) {
    try {
      data = await serverFetch<DashboardRetencao>(
        "/api/v1/crm/dashboard/retencao",
        { query: { tenantId } },
      );
    } catch (error) {
      logger.warn("[CRM Retencao] SSR fetch failed, falling back to client", {
        error,
      });
    }
  }

  return <RetencaoContent initialData={data} />;
}

export default function RetencaoPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[60vh] items-center justify-center text-sm text-muted-foreground animate-pulse">
          Carregando...
        </div>
      }
    >
      <RetencaoLoader />
    </Suspense>
  );
}
