import { Suspense } from "react";
import { serverFetch } from "@/lib/shared/server-fetch";
import { GlobalSecurityShell } from "@/backoffice/components/security/global-security-shell";
import { SuspenseFallback } from "@/components/shared/suspense-fallback";
import { CatalogoContent } from "./components/catalogo-content";
import type { CatalogoFuncionalidade, PerfilPadrao, GlobalAdminReviewBoard } from "@/lib/types";
import { logger } from "@/lib/shared/logger";

export const dynamic = "force-dynamic";

async function Loader() {
  let catalogo: CatalogoFuncionalidade[] = [];
  let perfis: PerfilPadrao[] = [];
  let board: GlobalAdminReviewBoard | null = null;

  try {
    const [catalogoRes, perfisRes] = await Promise.all([
      serverFetch<CatalogoFuncionalidade[]>("/api/v1/admin/seguranca/catalogo/list", {
        method: "POST",
        next: { revalidate: 0 },
      }),
      serverFetch<PerfilPadrao[]>("/api/v1/admin/seguranca/perfis/list", {
        method: "POST",
        next: { revalidate: 0 },
      }),
    ]);
    catalogo = Array.isArray(catalogoRes) ? catalogoRes : [];
    perfis = Array.isArray(perfisRes) ? perfisRes : [];
  } catch (error) {
    logger.warn("[AdminSegurancaCatalogoPage] SSR fetch failed, falling back to client", {
      module: "AdminSegurancaCatalogoPage",
      error: error instanceof Error ? error.message : String(error),
    });
  }

  // Review board can fail independently — non-critical
  try {
    board = await serverFetch<GlobalAdminReviewBoard>("/api/v1/admin/seguranca/review-board", {
      next: { revalidate: 60 },
    });
  } catch {
    board = {
      pendingReviews: [],
      expiringExceptions: [],
      recentChanges: [],
      broadAccess: [],
      orphanProfiles: [],
    };
  }

  return (
    <GlobalSecurityShell
      title="Seguranca avancada"
      description="Catalogo de funcionalidades, perfis-padrao com versionamento e gestao de excecoes."
    >
      <CatalogoContent
        initialCatalogo={catalogo}
        initialPerfis={perfis}
        initialBoard={board}
      />
    </GlobalSecurityShell>
  );
}

export default function AdminSegurancaCatalogoPage() {
  return (
    <Suspense fallback={<SuspenseFallback variant="section" />}>
      <Loader />
    </Suspense>
  );
}
