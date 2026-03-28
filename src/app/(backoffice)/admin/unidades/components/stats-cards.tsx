"use client";

import { UnidadesWorkspace } from "../hooks/use-unidades-workspace";

interface StatsCardsProps {
  workspace: UnidadesWorkspace;
}

export function StatsCards({ workspace }: StatsCardsProps) {
  const { loading, unidades, onboardingPendente, onboardingPronto, resolveAcademiaId } = workspace;

  return (
    <div className="grid gap-3 md:grid-cols-3">
      <div className="rounded-xl border border-border bg-card p-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Total de unidades</p>
        <p className="mt-2 text-2xl font-bold text-gym-accent">{loading ? "…" : unidades.length}</p>
      </div>
      <div className="rounded-xl border border-border bg-card p-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Academias atendidas</p>
        <p className="mt-2 text-2xl font-bold text-gym-teal">
          {loading ? "…" : new Set(unidades.map((item) => resolveAcademiaId(item)).filter(Boolean)).size}
        </p>
      </div>
      <div className="rounded-xl border border-border bg-card p-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Onboarding ativo</p>
        <p className="mt-2 text-2xl font-bold text-gym-warning">{loading ? "…" : onboardingPendente}</p>
        <p className="mt-1 text-xs text-muted-foreground">Prontas: {loading ? "…" : onboardingPronto}</p>
      </div>
    </div>
  );
}
