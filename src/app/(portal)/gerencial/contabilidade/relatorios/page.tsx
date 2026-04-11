import { Suspense } from "react";
import { serverFetch } from "@/lib/shared/server-fetch";
import { RelatoriosContent } from "./components/relatorios-content";
import { SuspenseFallback } from "@/components/shared/suspense-fallback";
import type { BalancoPatrimonial, FluxoCaixa } from "@/lib/types";
import { logger } from "@/lib/shared/logger";

export const dynamic = "force-dynamic";

async function Loader() {
  let balanco: BalancoPatrimonial | null = null;
  let fluxo: FluxoCaixa | null = null;

  try {
    const [balancoRes, fluxoRes] = await Promise.all([
      serverFetch<BalancoPatrimonial | null>("/api/v1/relatorios/balanco-patrimonial", {
        next: { revalidate: 0 },
      }),
      serverFetch<FluxoCaixa | null>("/api/v1/relatorios/fluxo-caixa", {
        next: { revalidate: 0 },
      }),
    ]);
    balanco = balancoRes ?? null;
    fluxo = fluxoRes ?? null;
  } catch (error) {
    logger.warn("[RelatoriosPage] SSR fetch failed, falling back to client", {
      module: "RelatoriosPage",
      error: error instanceof Error ? error.message : String(error),
    });
  }

  return <RelatoriosContent initialBalanco={balanco} initialFluxo={fluxo} />;
}

export default function RelatoriosPage() {
  return (
    <Suspense fallback={<SuspenseFallback variant="section" />}>
      <Loader />
    </Suspense>
  );
}
