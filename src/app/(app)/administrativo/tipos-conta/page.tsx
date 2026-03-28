import { Suspense } from "react";
import { cookies } from "next/headers";
import { serverFetch } from "@/lib/shared/server-fetch";
import type { TipoContaPagar } from "@/lib/types";
import { TiposContaContent } from "./tipos-conta-content";

async function getActiveTenantId(): Promise<string | undefined> {
  const jar = await cookies();
  return jar.get("academia-active-tenant-id")?.value;
}

async function Loader() {
  const tenantId = await getActiveTenantId();
  let data: TipoContaPagar[] = [];
  try {
    if (tenantId) {
      data = await serverFetch<TipoContaPagar[]>(
        "/api/v1/gerencial/financeiro/tipos-conta-pagar",
        {
          query: { tenantId, apenasAtivos: true },
          next: { revalidate: 0 },
        }
      );
    }
  } catch { /* fallback to client-side fetch */ }
  return <TiposContaContent initialData={data} />;
}

export default function TiposContaPage() {
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
