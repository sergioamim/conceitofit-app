import { Suspense } from "react";
import { serverFetch } from "@/lib/shared/server-fetch";
import { shouldBypassAuthenticatedSSRFetch } from "@/lib/shared/e2e-runtime";
import { logger } from "@/lib/shared/logger";
import { getServerActiveTenantId } from "@/lib/shared/server-session";
import type { NpsEnvio } from "@/lib/api/nps";
import { EnviosContent } from "./envios-content";

export const dynamic = "force-dynamic";

async function EnviosLoader() {
  const tenantId = await getServerActiveTenantId();

  let data: NpsEnvio[] | null = null;

  if (tenantId && !(await shouldBypassAuthenticatedSSRFetch())) {
    try {
      data = await serverFetch<NpsEnvio[]>(
        "/api/v1/retencao/nps/envios",
        { query: { tenantId } },
      );
    } catch (error) {
      logger.warn("[NPS Envios] SSR fetch failed, falling back to client", {
        error,
      });
    }
  }

  return <EnviosContent initialData={data} />;
}

export default function EnviosPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[60vh] items-center justify-center text-sm text-muted-foreground animate-pulse">
          Carregando...
        </div>
      }
    >
      <EnviosLoader />
    </Suspense>
  );
}
