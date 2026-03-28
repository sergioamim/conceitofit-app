import { Suspense } from "react";
import { cookies } from "next/headers";
import { serverFetch } from "@/lib/shared/server-fetch";
import type { ContaBancaria } from "@/lib/types";
import { ContasBancariasContent } from "./contas-bancarias-content";

async function getTenantData(): Promise<{ id: string; name: string }> {
  const jar = await cookies();
  return {
    id: jar.get("academia-active-tenant-id")?.value || "",
    name: jar.get("academia-active-tenant-name")?.value || "",
  };
}

async function Loader() {
  const { id: tenantId, name: tenantName } = await getTenantData();
  let data: ContaBancaria[] = [];

  try {
    if (tenantId) {
      data = await serverFetch<ContaBancaria[]>("/api/v1/administrativo/contas-bancarias", {
        query: { tenantId },
        next: { revalidate: 0 },
      });
    }
  } catch {
    /* fallback to client-side fetch */
  }

  return (
    <ContasBancariasContent
      initialData={data}
      tenantId={tenantId}
      tenantName={tenantName}
    />
  );
}

export default function ContasBancariasPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[60vh] items-center justify-center text-sm text-muted-foreground">
          Carregando contas bancárias...
        </div>
      }
    >
      <Loader />
    </Suspense>
  );
}
