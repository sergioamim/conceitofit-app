/**
 * Admin — Integrações Agregadores / Dashboard BI (AG-12).
 *
 * Dashboard visual consolidando métricas do mês por tenant:
 * check-ins validados, clientes únicos ativos, valor total, série diária,
 * distribuição por dia da semana, comparativo Wellhub vs TotalPass e
 * Top 20 Clientes.
 *
 * Auth: usa o guard do layout `(backoffice)/admin`.
 */

import { Suspense } from "react";
import { SuspenseFallback } from "@/components/shared/suspense-fallback";
import { AgregadoresDashboardView } from "./agregadores-dashboard-view";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Integrações — Dashboard Agregadores",
};

export default function AdminAgregadoresDashboardPage() {
  return (
    <div className="flex flex-col gap-6">
      <header className="space-y-2">
        <p className="text-sm font-medium text-gym-accent">
          Admin &gt; Integrações &gt; Agregadores &gt; Dashboard
        </p>
        <h1 className="text-3xl font-display font-bold">
          Dashboard Agregadores
        </h1>
        <p className="text-sm text-muted-foreground">
          Mapa de valores do mês para Wellhub e TotalPass — KPIs, séries
          temporais e Top Clientes por tenant.
        </p>
      </header>

      <Suspense fallback={<SuspenseFallback variant="section" />}>
        <AgregadoresDashboardView />
      </Suspense>
    </div>
  );
}
