import { Suspense } from "react";
import { cookies } from "next/headers";
import { serverFetch } from "@/lib/shared/server-fetch";
import { logger } from "@/lib/shared/logger";
import type { FormaPagamento } from "@/lib/types";
import { FormasPagamentoContent } from "./formas-pagamento-content";

async function getActiveTenantId(): Promise<string | undefined> {
  const jar = await cookies();
  return jar.get("academia-active-tenant-id")?.value;
}

async function Loader() {
  const tenantId = await getActiveTenantId();
  let data: FormaPagamento[] = [];
  try {
    if (tenantId) {
      data = await serverFetch<FormaPagamento[]>(
        "/api/v1/gerencial/financeiro/formas-pagamento",
        {
          query: { tenantId, apenasAtivas: false },
          next: { revalidate: 0 },
        }
      );
    }
  } catch (error) { logger.warn("[FormasPagamento] SSR fetch failed, falling back to client", { error }); }
  return <FormasPagamentoContent initialData={data} />;
}

export default function FormasPagamentoPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[60vh] items-center justify-center text-sm text-muted-foreground">
          Carregando...
        </div>
      }
    >
      <Loader />
    </Suspense>
  );
}
