import { Suspense } from "react";
import { cookies } from "next/headers";
import { serverFetch } from "@/lib/shared/server-fetch";
import { shouldBypassAuthenticatedSSRFetch } from "@/lib/shared/e2e-runtime";
import { logger } from "@/lib/shared/logger";
import type { NpsCampanha } from "@/lib/api/nps";
import { CampanhasContent } from "./campanhas-content";

export const dynamic = "force-dynamic";

async function CampanhasLoader() {
  const jar = await cookies();
  const tenantId = jar.get("academia-active-tenant-id")?.value;

  let data: NpsCampanha[] | null = null;

  if (tenantId && !shouldBypassAuthenticatedSSRFetch()) {
    try {
      data = await serverFetch<NpsCampanha[]>(
        "/api/v1/retencao/nps/campanhas",
        { query: { tenantId } },
      );
    } catch (error) {
      logger.warn("[NPS Campanhas] SSR fetch failed, falling back to client", {
        error,
      });
    }
  }

  return <CampanhasContent initialData={data} />;
}

export default function CampanhasPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[60vh] items-center justify-center text-sm text-muted-foreground animate-pulse">
          Carregando...
        </div>
      }
    >
      <CampanhasLoader />
    </Suspense>
  );
}
