"use client";

import { useMemo } from "react";
import type { ContratoCanalEvolucao, ContratoCanalOrigem } from "@/lib/api/contratos";
import {
  useContratosEvolucaoCanais,
  useContratosOrigemAlunos,
  useContratosSinaisRetencao,
} from "@/lib/query/use-contratos";
import { formatBRL } from "@/lib/formatters";
import { useTenantContext } from "@/lib/tenant/hooks/use-session-context";
import { normalizeErrorMessage } from "@/lib/utils/api-error";
import { Sparkline } from "@/components/shared/financeiro-viz/sparkline";
import { ListErrorState } from "@/components/shared/list-states";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

type ContratosAgregadoresViewProps = {
  monthKey: string;
  className?: string;
};

function formatInteger(value: number) {
  return value.toLocaleString("pt-BR");
}

function formatSignedPct(value: number) {
  if (!Number.isFinite(value)) return "0%";
  return `${value > 0 ? "+" : ""}${value.toFixed(1)}%`;
}

function resolveCanalColor(canal: ContratoCanalOrigem) {
  return canal.cor ?? "#14b8a6";
}

export function ContratosAgregadoresView({ monthKey, className }: ContratosAgregadoresViewProps) {
  const { tenantId, tenantResolved } = useTenantContext();
  const sinaisQuery = useContratosSinaisRetencao({ tenantId, tenantResolved, monthKey });
  const origemQuery = useContratosOrigemAlunos({ tenantId, tenantResolved, monthKey });
  const evolucaoQuery = useContratosEvolucaoCanais({ tenantId, tenantResolved, monthKey, meses: 6 });

  const pending = sinaisQuery.isPending || origemQuery.isPending || evolucaoQuery.isPending;
  const error = sinaisQuery.error ?? origemQuery.error ?? evolucaoQuery.error;

  const agregCanais = useMemo(
    () => (origemQuery.data?.canais ?? []).filter((c) => c.tipo === "AGREGADOR"),
    [origemQuery.data?.canais],
  );

  const agregEvo = useMemo(
    () => (evolucaoQuery.data?.canais ?? []).filter((c) => c.tipo === "AGREGADOR"),
    [evolucaoQuery.data?.canais],
  );

  const mrrAgreg = useMemo(() => agregCanais.reduce((s, c) => s + c.mrr, 0), [agregCanais]);

  /** MoM oficial: mesmo snapshot do backend (`distinctComAgregador`), não soma séries por canal (evitar duplicar aluno em 2+ agregadores). */
  const momAgreg =
    typeof evolucaoQuery.data?.deltaPctAgregadores === "number"
      ? evolucaoQuery.data.deltaPctAgregadores
      : 0;

  if (!monthKey) {
    return (
      <div className={cn("rounded-xl border border-border bg-card p-6 text-sm text-muted-foreground", className)}>
        Selecione um mês de referência.
      </div>
    );
  }

  if (error) {
    return (
      <ListErrorState
        error={normalizeErrorMessage(error)}
        onRetry={() => {
          void sinaisQuery.refetch();
          void origemQuery.refetch();
          void evolucaoQuery.refetch();
        }}
      />
    );
  }

  const sinais = sinaisQuery.data;
  const totalVinculos = sinais?.alunosAgregadores ?? 0;

  const kpiRow = [
    {
      label: "Alunos via agregadores",
      value: pending ? "…" : formatInteger(totalVinculos),
      sub: `${agregCanais.length} ${agregCanais.length === 1 ? "canal" : "canais"}`,
    },
    {
      label: "Receita agregadores",
      value: pending ? "…" : formatBRL(mrrAgreg),
      sub: "Soma MRR dos canais no mês",
      accent: "var(--gym-accent)" as const,
    },
    {
      label: "Participação na carteira",
      value:
        pending || !sinais
          ? "…"
          : sinais.alunosAtivos > 0
            ? `${((sinais.alunosAgregadores / sinais.alunosAtivos) * 100).toFixed(0)}%`
            : "0%",
      sub: "Alunos agreg. / total ativos",
    },
    {
      label: "Crescimento MoM",
      value: pending ? "…" : formatSignedPct(momAgreg),
      sub: "vs. mês anterior — alunos distintos nos agregadores",
      accent:
        momAgreg >= 0 ? ("var(--gym-teal)" as const) : ("var(--gym-danger)" as const),
    },
  ];

  return (
    <div className={cn("flex flex-col gap-4", className)}>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {kpiRow.map((k) => (
          <div key={k.label} className="flex flex-col gap-0.5 rounded-xl border border-border bg-card px-4 py-3">
            <span className="text-[10.5px] font-semibold uppercase tracking-wider text-muted-foreground">{k.label}</span>
            <span
              className="font-display text-2xl font-bold leading-tight"
              style={k.accent ? { color: k.accent } : undefined}
            >
              {k.value}
            </span>
            <span className="text-[11px] text-muted-foreground">{k.sub}</span>
          </div>
        ))}
      </div>

      <div className="min-h-0 flex-1">
        <h3 className="mb-2 px-0.5 text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">
          Contratos de canal
        </h3>
        <div className="flex flex-col gap-2.5">
          {pending ? (
            <>
              <Skeleton className="h-36 w-full rounded-xl" />
              <Skeleton className="h-36 w-full rounded-xl" />
            </>
          ) : agregCanais.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border px-4 py-10 text-center text-sm text-muted-foreground">
              Nenhum agregador com alunos neste mês.
            </div>
          ) : (
            agregCanais.map((ag) => {
              const color = resolveCanalColor(ag);
              const evo = agregEvo.find((item) => item.id === ag.id);
              const mom =
                evo && evo.serie.length >= 2
                  ? (() => {
                      const prev = evo.serie[evo.serie.length - 2] ?? 0;
                      const cur = evo.serie[evo.serie.length - 1] ?? 0;
                      return prev > 0 ? ((cur - prev) / prev) * 100 : 0;
                    })()
                  : 0;
              const pct =
                totalVinculos > 0 ? ((ag.alunos / totalVinculos) * 100).toFixed(0) : "0";

              return (
                <div
                  key={ag.id}
                  className="overflow-hidden rounded-xl border border-border bg-card transition-colors"
                  style={{
                    borderColor: `${color}50`,
                  }}
                >
                  <div className="h-1 w-full" style={{ background: color }} />
                  <div className="p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <div
                          className="flex size-10 shrink-0 items-center justify-center rounded-lg font-display text-sm font-bold text-white"
                          style={{ background: color }}
                          aria-hidden
                        >
                          {ag.label
                            .split(/\s+/)
                            .map((w) => w[0])
                            .filter(Boolean)
                            .join("")
                            .slice(0, 2)
                            .toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="font-display text-sm font-bold leading-tight">{ag.label}</p>
                          <p className="text-[11px] text-muted-foreground">
                            {formatInteger(ag.alunos)} alunos · {pct}% do agreg.
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-display text-lg font-bold tabular-nums">{formatBRL(ag.mrr)}</p>
                        <p className="text-[10.5px] text-muted-foreground">no mês</p>
                      </div>
                    </div>
                    {evo ? (
                      <div className="mt-3">
                        <Sparkline data={evo.serie} color={color} width={280} height={22} className="w-full max-w-md" />
                      </div>
                    ) : null}
                    <p
                      className={cn(
                        "mt-2 text-right text-[10.5px] font-semibold tabular-nums",
                        mom > 0 && "text-emerald-600 dark:text-emerald-400",
                        mom < 0 && "text-rose-500 dark:text-rose-400",
                        mom === 0 && "text-muted-foreground",
                      )}
                    >
                      {mom > 0 ? "+" : ""}
                      {mom.toFixed(1)}% MoM
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
