import { Suspense } from "react";
import { cookies } from "next/headers";
import { serverFetch } from "@/lib/shared/server-fetch";
import { logger } from "@/lib/shared/logger";
import type { Convenio, Plano } from "@/lib/types";
import { ConveniosContent } from "./convenios-content";

async function getActiveTenantId(): Promise<string | undefined> {
  const jar = await cookies();
  return jar.get("academia-active-tenant-id")?.value;
}

async function Loader() {
  const tenantId = await getActiveTenantId();
  let convenios: Convenio[] = [];
  let planos: Plano[] = [];

  try {
    if (tenantId) {
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
    logger.warn("[Convenios] SSR fetch failed, falling back to client", { error });
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
        <div className="flex min-h-[60vh] items-center justify-center text-sm text-muted-foreground">
          Carregando convênios...
        </div>
      }
    >
      <Loader />
    </Suspense>
  );
}
