import { Suspense } from "react";
import { cookies } from "next/headers";
import { serverFetch } from "@/lib/shared/server-fetch";
import { logger } from "@/lib/shared/logger";
import type { Atividade } from "@/lib/types";
import { AtividadesContent } from "./atividades-content";

async function getActiveTenantId(): Promise<string | undefined> {
  const jar = await cookies();
  return jar.get("academia-active-tenant-id")?.value;
}

async function Loader() {
  const tenantId = await getActiveTenantId();
  let data: Atividade[] = [];
  try {
    if (tenantId) {
      data = await serverFetch<Atividade[]>("/api/v1/administrativo/atividades", {
        query: { tenantId, apenasAtivas: true },
        next: { revalidate: 0 },
      });
    }
  } catch (error) {
    logger.warn("[Atividades] SSR fetch failed, falling back to client", { error });
  }
  return <AtividadesContent initialData={data} tenantId={tenantId || ""} />;
}

export default function AtividadesPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[60vh] items-center justify-center text-sm text-muted-foreground">
          Carregando atividades...
        </div>
      }
    >
      <Loader />
    </Suspense>
  );
}
