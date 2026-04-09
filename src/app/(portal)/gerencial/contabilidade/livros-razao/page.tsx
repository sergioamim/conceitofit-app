import { Suspense } from "react";
import { cookies } from "next/headers";
import { serverFetch } from "@/lib/shared/server-fetch";

export const dynamic = "force-dynamic";
import { SuspenseFallback } from "@/components/shared/suspense-fallback";
import { LivrosRazaoContent } from "./components/livros-razao-content";
import { logger } from "@/lib/shared/logger";
import { shouldBypassAuthenticatedSSRFetch } from "@/lib/shared/e2e-runtime";
import type { Ledger } from "@/lib/types";

async function Loader() {
  const jar = await cookies();
  const tenantId = jar.get("academia-active-tenant-id")?.value;
  let ledgers: Ledger[] = [];

  try {
    if (tenantId && !shouldBypassAuthenticatedSSRFetch()) {
      ledgers = await serverFetch<Ledger[]>("/api/v1/financial/ledgers", {
        query: { tenantId },
        next: { revalidate: 0 },
      });
    }
  } catch (error) {
    logger.warn("[LivrosRazaoPage] SSR fetch failed, falling back to client", {
      module: "LivrosRazaoPage",
      error: error instanceof Error ? error.message : String(error),
    });
  }

  return <LivrosRazaoContent initialData={ledgers} />;
}

export default function LivrosRazaoPage() {
  return (
    <Suspense fallback={<SuspenseFallback variant="section" />}>
      <Loader />
    </Suspense>
  );
}
