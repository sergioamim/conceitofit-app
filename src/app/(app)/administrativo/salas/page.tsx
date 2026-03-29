import { Suspense } from "react";
import { cookies } from "next/headers";
import { serverFetch } from "@/lib/shared/server-fetch";
import { logger } from "@/lib/shared/logger";
import type { Sala } from "@/lib/types";
import { SalasContent } from "./salas-content";

async function getActiveTenantId(): Promise<string | undefined> {
  const jar = await cookies();
  return jar.get("academia-active-tenant-id")?.value;
}

async function Loader() {
  const tenantId = await getActiveTenantId();
  let data: Sala[] = [];
  try {
    if (tenantId) {
      data = await serverFetch<Sala[]>("/api/v1/administrativo/salas", {
        query: { tenantId, apenasAtivas: false },
        next: { revalidate: 0 },
      });
    }
  } catch (error) { logger.warn("[Salas] SSR fetch failed, falling back to client", { error }); }
  return <SalasContent initialData={data} />;
}

export default function SalasPage() {
  return (
    <Suspense fallback={<div className="flex min-h-[60vh] items-center justify-center text-sm text-muted-foreground">Carregando...</div>}>
      <Loader />
    </Suspense>
  );
}
