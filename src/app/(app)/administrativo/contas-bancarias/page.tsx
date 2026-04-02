import { Suspense } from "react";
import { cookies } from "next/headers";
import { serverFetch } from "@/lib/shared/server-fetch";
import { logger } from "@/lib/shared/logger";
import type { ContaBancaria } from "@/lib/types";
import { ContasBancariasContent } from "./contas-bancarias-content";
import { SuspenseFallback } from "@/components/shared/suspense-fallback";
import { shouldBypassAuthenticatedSSRFetch } from "@/lib/shared/e2e-runtime";

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
    if (tenantId && !shouldBypassAuthenticatedSSRFetch()) {
      data = await serverFetch<ContaBancaria[]>("/api/v1/administrativo/contas-bancarias", {
        query: { tenantId },
        next: { revalidate: 0 },
      });
    }
  } catch (error) {
    logger.warn("[ContasBancarias] SSR fetch failed, falling back to client", { error });
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
        <SuspenseFallback variant="section" />
      }
    >
      <Loader />
    </Suspense>
  );
}
