import { Suspense } from "react";
import { serverFetch } from "@/lib/shared/server-fetch";

export const dynamic = "force-dynamic";
import { logger } from "@/lib/shared/logger";
import { SuspenseFallback } from "@/components/shared/suspense-fallback";
import { PlanosContent } from "./components/planos-content";
import type { PlanoPlataforma } from "@/lib/types";

async function Loader() {
  let planos: PlanoPlataforma[] = [];

  try {
    planos = await serverFetch<PlanoPlataforma[]>(
      "/api/v1/admin/financeiro/planos",
      { next: { revalidate: 0 } },
    );
  } catch (error) {
    logger.warn("[AdminPlanosPage] SSR fetch failed, falling back to client", {
      module: "AdminPlanosPage",
      error: error instanceof Error ? error.message : String(error),
    });
  }

  return <PlanosContent initialData={planos} />;
}

export default function AdminPlanosPage() {
  return (
    <Suspense fallback={<SuspenseFallback variant="section" />}>
      <Loader />
    </Suspense>
  );
}
