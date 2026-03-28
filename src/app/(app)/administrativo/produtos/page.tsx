import { Suspense } from "react";
import { cookies } from "next/headers";
import { serverFetch } from "@/lib/shared/server-fetch";
import type { Produto } from "@/lib/types";
import { ProdutosContent } from "./produtos-content";

async function getActiveTenantId(): Promise<string | undefined> {
  const jar = await cookies();
  return jar.get("academia-active-tenant-id")?.value;
}

async function Loader() {
  const tenantId = await getActiveTenantId();
  let data: Produto[] = [];
  try {
    if (tenantId) {
      data = await serverFetch<Produto[]>("/api/v1/comercial/produtos", {
        query: { tenantId, apenasAtivos: false },
        next: { revalidate: 0 },
      });
    }
  } catch { /* fallback to client-side fetch */ }
  return <ProdutosContent initialData={data} />;
}

export default function ProdutosPage() {
  return (
    <Suspense fallback={<div className="flex min-h-[60vh] items-center justify-center text-sm text-muted-foreground">Carregando...</div>}>
      <Loader />
    </Suspense>
  );
}
