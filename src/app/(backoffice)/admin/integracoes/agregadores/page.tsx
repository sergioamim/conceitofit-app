/**
 * Admin — Integrações Agregadores (Wellhub / TotalPass).
 *
 * ADR-012 — UI Admin Agregadores (AG-7.7 + AG-7.8).
 *
 * Auth: o layout `(backoffice)/admin` já aplica guard de role PLATAFORMA
 * (via `hasElevatedAccess` + `canAccessElevatedModules`). Esta página vive
 * sob o shell do backoffice, portanto não precisa de guard próprio.
 *
 * Regra:
 * - sem `?tenantId` → renderiza seletor de tenants (AG-7.7)
 * - com `?tenantId` → renderiza dashboard do tenant com cards (AG-7.8)
 */

import { Suspense } from "react";
import { SuspenseFallback } from "@/components/shared/suspense-fallback";
import { AgregadoresAdminView } from "./agregadores-admin-view";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Integrações — Agregadores",
};

export default function AdminAgregadoresPage() {
  return (
    <div className="flex flex-col gap-6">
      <header className="space-y-2">
        <p className="text-sm font-medium text-gym-accent">
          Admin &gt; Integrações &gt; Agregadores
        </p>
        <h1 className="text-3xl font-display font-bold">
          Agregadores (Wellhub / TotalPass)
        </h1>
        <p className="text-sm text-muted-foreground">
          Configuração por tenant de integrações B2B com agregadores de
          benefícios.
        </p>
      </header>

      <Suspense fallback={<SuspenseFallback variant="section" />}>
        <AgregadoresAdminView />
      </Suspense>
    </div>
  );
}
