import { Suspense } from "react";
import { serverFetch } from "@/lib/shared/server-fetch";

export const dynamic = "force-dynamic";
import { SuspenseFallback } from "@/components/shared/suspense-fallback";
import { TransacoesContent } from "./components/transacoes-content";
import { logger } from "@/lib/shared/logger";
import { shouldBypassAuthenticatedSSRFetch } from "@/lib/shared/e2e-runtime";
import { getServerActiveTenantId } from "@/lib/shared/server-session";
import type { FinancialTransaction } from "@/lib/types";

async function Loader() {
  const tenantId = await getServerActiveTenantId();
  let transacoes: FinancialTransaction[] = [];

  try {
    if (tenantId && !(await shouldBypassAuthenticatedSSRFetch())) {
      transacoes = await serverFetch<FinancialTransaction[]>(
        "/api/v1/financial/transactions",
        {
          query: { tenantId },
          next: { revalidate: 0 },
        },
      );
    }
  } catch (error) {
    logger.warn("[TransacoesPage] SSR fetch failed, falling back to client", {
      module: "TransacoesPage",
      error: error instanceof Error ? error.message : String(error),
    });
  }

  return <TransacoesContent initialData={transacoes} />;
}

export default function TransacoesPage() {
  return (
    <Suspense fallback={<SuspenseFallback variant="section" />}>
      <Loader />
    </Suspense>
  );
}
