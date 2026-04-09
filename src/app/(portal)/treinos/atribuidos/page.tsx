import { Suspense } from "react";
import { cookies } from "next/headers";
import { serverFetch } from "@/lib/shared/server-fetch";
import { SuspenseFallback } from "@/components/shared/suspense-fallback";
import { TreinosAtribuidosContent } from "./components/treinos-atribuidos-content";
import { logger } from "@/lib/shared/logger";
import { shouldBypassAuthenticatedSSRFetch } from "@/lib/shared/e2e-runtime";
import type { Treino } from "@/lib/types";

type TreinosApiResponse =
  | Treino[]
  | { items?: Treino[]; content?: Treino[]; data?: Treino[] };

function extractItems(response: TreinosApiResponse): Treino[] {
  if (Array.isArray(response)) return response;
  return response.items ?? response.content ?? response.data ?? [];
}

async function Loader() {
  const jar = await cookies();
  const tenantId = jar.get("academia-active-tenant-id")?.value;
  let treinos: Treino[] = [];

  try {
    if (tenantId && !shouldBypassAuthenticatedSSRFetch()) {
      const response = await serverFetch<TreinosApiResponse>(
        "/api/v1/treinos",
        {
          query: { tenantId, tipoTreino: "CUSTOMIZADO", page: 0, size: 200 },
          next: { revalidate: 0 },
        },
      );
      treinos = extractItems(response);
    }
  } catch (error) {
    logger.warn("[TreinosAtribuidosPage] SSR fetch failed, falling back to client", {
      module: "TreinosAtribuidosPage",
      error: error instanceof Error ? error.message : String(error),
    });
  }

  return <TreinosAtribuidosContent initialData={treinos} />;
}

export default function TreinosAtribuidosPage() {
  return (
    <Suspense fallback={<SuspenseFallback variant="section" />}>
      <Loader />
    </Suspense>
  );
}
