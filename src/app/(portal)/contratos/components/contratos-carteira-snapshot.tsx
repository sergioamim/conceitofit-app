"use client";

import { useEffect, useMemo, useState } from "react";
import { useContratosCarteiraSnapshot } from "@/lib/query/use-contratos";
import { useTenantContext } from "@/lib/tenant/hooks/use-session-context";
import { formatMonthLabel } from "@/lib/tenant/comercial/matriculas-insights";
import { normalizeErrorMessage } from "@/lib/utils/api-error";
import { ListErrorState } from "@/components/shared/list-states";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { DiariasMesHighlight } from "./diarias-mes-highlight";
import { cn } from "@/lib/utils";

function toIsoDateLocal(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

type ContratosCarteiraSnapshotProps = {
  className?: string;
};

export function ContratosCarteiraSnapshot({ className }: ContratosCarteiraSnapshotProps) {
  const { tenantId, tenantResolved } = useTenantContext();
  const [dataIso, setDataIso] = useState("");

  useEffect(() => {
    const t = window.setTimeout(() => setDataIso(toIsoDateLocal(new Date())), 0);
    return () => window.clearTimeout(t);
  }, []);

  const query = useContratosCarteiraSnapshot({ tenantId, tenantResolved, dataIso });
  const mesLegenda = useMemo(
    () => (dataIso ? formatMonthLabel(dataIso.slice(0, 7)) : "mês de referência"),
    [dataIso],
  );

  if (!dataIso) {
    return (
      <div className={cn("rounded-xl border border-border bg-card p-6", className)}>
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (query.error) {
    return (
      <ListErrorState
        error={normalizeErrorMessage(query.error)}
        onRetry={() => void query.refetch()}
        className={className}
      />
    );
  }

  const d = query.data;

  return (
    <section className={cn("space-y-4", className)}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="font-display text-xl font-bold">Carteira na data</h2>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Contratos vigentes no dia selecionado, excluindo vínculos com duração de exatamente 1 dia (diárias).
          </p>
        </div>
        <div>
          <label htmlFor="carteira-data-ref" className="mb-1 block text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
            Data de referência
          </label>
          <Input
            id="carteira-data-ref"
            type="date"
            value={dataIso}
            max={toIsoDateLocal(new Date())}
            onChange={(e) => setDataIso(e.target.value)}
            className="h-10 w-full min-w-[11rem] border-border bg-background sm:w-auto"
          />
        </div>
      </div>

      {query.isLoading && !d ? (
        <Skeleton className="h-40 w-full rounded-3xl" />
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          <div className="rounded-3xl border border-border bg-card p-5 shadow-sm">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-gym-accent">Contratos ativos (base)</p>
            <p className="mt-3 font-display text-4xl font-bold tabular-nums tracking-tight">
              {(d?.contratosAtivosExcetoDiarias ?? 0).toLocaleString("pt-BR")}
            </p>
            <p className="mt-2 text-xs text-muted-foreground">{d?.notaContratosBase}</p>
          </div>
          <DiariasMesHighlight
            quantidade={d?.diariasNoMesCompetencia ?? 0}
            mesLegenda={mesLegenda}
            notaTooltip={d?.notaDiarias}
          />
        </div>
      )}
    </section>
  );
}
