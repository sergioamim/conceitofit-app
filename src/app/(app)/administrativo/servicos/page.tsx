import { Suspense } from "react";
import { cookies } from "next/headers";
import { serverFetch } from "@/lib/shared/server-fetch";
import type { Servico } from "@/lib/types";
import { ServicosContent } from "./servicos-content";

async function getActiveTenantId(): Promise<string | undefined> {
  const jar = await cookies();
  return jar.get("academia-active-tenant-id")?.value;
}

async function Loader() {
  const tenantId = await getActiveTenantId();
  let data: Servico[] = [];
  try {
    if (tenantId) {
      data = await serverFetch<Servico[]>("/api/v1/comercial/servicos", {
        query: { tenantId, apenasAtivos: false },
        next: { revalidate: 0 },
      });
    }
  } catch { /* fallback to client-side fetch */ }
  return <ServicosContent initialData={data} />;
}

export default function ServicosPage() {
  return (
    <Suspense fallback={<div className="flex min-h-[60vh] items-center justify-center text-sm text-muted-foreground">Carregando...</div>}>
      <Loader />
    </Suspense>
  );
}
