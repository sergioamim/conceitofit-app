import { Suspense } from "react";
import { serverFetch } from "@/lib/shared/server-fetch";

export const dynamic = "force-dynamic";
import { SuspenseFallback } from "@/components/shared/suspense-fallback";
import { CobrancasContent } from "./components/cobrancas-content";
import { logger } from "@/lib/shared/logger";
import { shouldBypassAuthenticatedSSRFetch } from "@/lib/shared/e2e-runtime";
import type { Cobranca, ContratoPlataforma } from "@/lib/types";

async function Loader() {
  let cobrancas: Cobranca[] = [];
  let contratos: ContratoPlataforma[] = [];

  try {
    if (!(await shouldBypassAuthenticatedSSRFetch())) {
      [cobrancas, contratos] = await Promise.all([
        serverFetch<Cobranca[]>("/api/v1/admin/financeiro/cobrancas", {
          next: { revalidate: 0 },
        }),
        serverFetch<ContratoPlataforma[]>("/api/v1/admin/financeiro/contratos", {
          next: { revalidate: 0 },
        }),
      ]);
    }
  } catch (error) {
    logger.warn("[AdminCobrancasPage] SSR fetch failed, falling back to client", {
      module: "AdminCobrancasPage",
      error: error instanceof Error ? error.message : String(error),
    });
  }

  return <CobrancasContent initialCobrancas={cobrancas} initialContratos={contratos} />;
}

export default function AdminCobrancasPage() {
  return (
    <Suspense fallback={<SuspenseFallback variant="section" />}>
      <Loader />
    </Suspense>
  );
}
