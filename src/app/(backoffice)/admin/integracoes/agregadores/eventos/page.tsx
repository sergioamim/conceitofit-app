/**
 * Admin — Integrações Agregadores / Monitor de eventos (AG-7.10).
 *
 * Listagem paginada dos eventos de webhook (`agregador_webhook_evento`) com
 * filtros e botão de reprocessar. O endpoint GET de listagem ainda não
 * existe no backend — a UI é renderizada completa e consome um stub que
 * retorna page vazia.
 *
 * TODO: AG-7.10.backend — criar endpoint GET que popule os itens.
 */

import { Suspense } from "react";
import { SuspenseFallback } from "@/components/shared/suspense-fallback";
import { AgregadoresEventosView } from "./agregadores-eventos-view";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Integrações — Agregadores / Monitor de eventos",
};

export default function AdminAgregadoresEventosPage() {
  return (
    <div className="flex flex-col gap-6">
      <header className="space-y-2">
        <p className="text-sm font-medium text-gym-accent">
          Admin &gt; Integrações &gt; Agregadores &gt; Eventos
        </p>
        <h1 className="text-3xl font-display font-bold">
          Monitor de eventos — Agregadores
        </h1>
        <p className="text-sm text-muted-foreground">
          Eventos recebidos via webhook dos parceiros (Wellhub / TotalPass) com
          filtros e ação de reprocessamento.
        </p>
      </header>

      <Suspense fallback={<SuspenseFallback variant="section" />}>
        <AgregadoresEventosView />
      </Suspense>
    </div>
  );
}
