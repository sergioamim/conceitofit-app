import { Suspense } from "react";
import { serverFetch } from "@/lib/shared/server-fetch";

export const dynamic = "force-dynamic";
import { SuspenseFallback } from "@/components/shared/suspense-fallback";
import { ContratosContent } from "./components/contratos-content";
import { logger } from "@/lib/shared/logger";
import { shouldBypassAuthenticatedSSRFetch } from "@/lib/shared/e2e-runtime";
import type { Academia, ContratoPlataforma, PlanoPlataforma } from "@/lib/types";

async function Loader() {
  let contratos: ContratoPlataforma[] = [];
  let academias: Academia[] = [];
  let planos: PlanoPlataforma[] = [];

  try {
    if (!(await shouldBypassAuthenticatedSSRFetch())) {
      [contratos, academias, planos] = await Promise.all([
        serverFetch<ContratoPlataforma[]>("/api/v1/admin/financeiro/contratos", {
          next: { revalidate: 0 },
        }),
        serverFetch<Academia[]>("/api/v1/admin/academias", {
          next: { revalidate: 0 },
        }),
        serverFetch<PlanoPlataforma[]>("/api/v1/admin/financeiro/planos", {
          next: { revalidate: 0 },
        }),
      ]);
    }
  } catch (error) {
    logger.warn("[AdminContratosPage] SSR fetch failed, falling back to client", {
      module: "AdminContratosPage",
      error: error instanceof Error ? error.message : String(error),
    });
  }

  return (
    <ContratosContent
      initialContratos={contratos}
      initialAcademias={academias}
      initialPlanos={planos}
    />
  );
}

export default function AdminContratosPage() {
  return (
    <Suspense fallback={<SuspenseFallback variant="section" />}>
      <Loader />
    </Suspense>
  );
}
