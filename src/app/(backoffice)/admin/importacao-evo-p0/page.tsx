"use client";

import { Suspense } from "react";
import { ImportacaoEvoP0Client } from "./components/ImportacaoEvoP0Client";

export const dynamic = "force-dynamic";

export default function ImportacaoEvoP0Page() {
  return (
    <Suspense
      fallback={
        <div className="space-y-6">
          <div>
            <h1 className="font-display text-2xl font-bold tracking-tight">Importação EVO</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Carregando parâmetros da importação...
            </p>
          </div>
        </div>
      }
    >
      <ImportacaoEvoP0Client />
    </Suspense>
  );
}
