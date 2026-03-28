import { Suspense } from "react";
import { cookies } from "next/headers";
import { serverFetch } from "@/lib/shared/server-fetch";
import type { BandeiraCartao } from "@/lib/types";
import { BandeirasContent } from "./bandeiras-content";

async function getActiveTenantId(): Promise<string | undefined> {
  const jar = await cookies();
  return jar.get("academia-active-tenant-id")?.value;
}

async function Loader() {
  const tenantId = await getActiveTenantId();
  let data: BandeiraCartao[] = [];
  try {
    if (tenantId) {
      data = await serverFetch<BandeiraCartao[]>("/api/v1/comercial/bandeiras-cartao", {
        query: { tenantId, apenasAtivas: false },
        next: { revalidate: 0 },
      });
    }
  } catch {
    /* fallback to client-side fetch handles it via initialData=[] */
  }
  return <BandeirasContent initialData={data} />;
}

export default function BandeirasPage() {
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
