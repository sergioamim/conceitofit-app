import { Suspense } from "react";
import { serverFetch } from "@/lib/shared/server-fetch";
import { logger } from "@/lib/shared/logger";
import type { Convenio, Plano } from "@/lib/types";
import { ConveniosContent } from "./convenios-content";
import { SuspenseFallback } from "@/components/shared/suspense-fallback";
import { shouldBypassAuthenticatedSSRFetch } from "@/lib/shared/e2e-runtime";
import { getServerActiveTenantId } from "@/lib/shared/server-session";

async function getActiveTenantId(): Promise<string | undefined> {
  return getServerActiveTenantId();
}

async function Loader() {
  const tenantId = await getActiveTenantId();
  let convenios: Convenio[] = [];
  let planos: Plano[] = [];

  try {
    if (tenantId && !(await shouldBypassAuthenticatedSSRFetch())) {
      const [cvs, pls] = await Promise.all([
        serverFetch<Convenio[]>("/api/v1/administrativo/convenios", {
          query: { tenantId, apenasAtivos: false },
          next: { revalidate: 0 },
        }),
        serverFetch<Plano[]>("/api/v1/comercial/planos", {
          query: { tenantId, apenasAtivos: false },
          next: { revalidate: 0 },
        }),
      ]);
      convenios = cvs;
      planos = pls;
    }
  } catch (error) {
    logger.warn("[ConveniosPage] SSR fetch failed, falling back to client", {
      module: "ConveniosPage",
      error: error instanceof Error ? error.message : String(error),
    });
  }

  return (
    <ConveniosContent
      initialData={convenios}
      initialPlanos={planos}
      tenantId={tenantId || ""}
    />
  );
}

export default function ConveniosPage() {
  return (
    <Suspense
      fallback={
        <SuspenseFallback variant="section" />
      }
    >
      <Loader />
    </Suspense>
  );
}
