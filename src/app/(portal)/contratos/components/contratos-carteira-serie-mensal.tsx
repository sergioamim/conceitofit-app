"use client";

import { TrendingUp } from "lucide-react";
import { useContratosCarteiraSerieMensal } from "@/lib/query/use-contratos";
import { useTenantContext } from "@/lib/tenant/hooks/use-session-context";
import { formatMonthLabel } from "@/lib/tenant/comercial/matriculas-insights";
import { normalizeErrorMessage } from "@/lib/utils/api-error";
import { ListErrorState } from "@/components/shared/list-states";
import { Skeleton } from "@/components/ui/skeleton";
import { DiariasMesHighlight } from "./diarias-mes-highlight";
import { cn } from "@/lib/utils";

type ContratosCarteiraSerieMensalProps = {
  monthKey: string;
  className?: string;
};

function formatSignedPercentage(value: number) {
  if (!Number.isFinite(value)) return "0%";
  return `${value > 0 ? "+" : ""}${value.toFixed(1)}%`;
}

function SerieDiariaChart({ serie }: { serie: { data: string; contratosAtivosExcetoDiarias: number }[] }) {
  if (serie.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border px-4 py-10 text-sm text-muted-foreground">
        Sem pontos da série para este mês.
      </div>
    );
  }

  const width = 720;
  const height = 200;
  const pad = 32;
  const innerW = width - pad * 2;
  const innerH = height - pad * 1.5;
  const values = serie.map((p) => p.contratosAtivosExcetoDiarias);
  const maxV = Math.max(1, ...values);
  const minV = Math.min(...values);
  const span = Math.max(1, maxV - minV);
  const stepX = serie.length > 1 ? innerW / (serie.length - 1) : innerW;
  const points = serie.map((p, i) => {
    const x = pad + stepX * i;
    const y = pad * 0.5 + innerH - ((p.contratosAtivosExcetoDiarias - minV) / span) * innerH;
    return [x, y] as const;
  });
  const path = points.map((pt, i) => `${i === 0 ? "M" : "L"}${pt[0].toFixed(1)},${pt[1].toFixed(1)}`).join(" ");

  return (
    <svg width="100%" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Contratos ativos por dia no mês">
      {[0, 0.25, 0.5, 0.75, 1].map((tick) => (
        <line
          key={tick}
          x1={pad}
          x2={width - pad}
          y1={pad * 0.5 + innerH * (1 - tick)}
          y2={pad * 0.5 + innerH * (1 - tick)}
          stroke="var(--border)"
          strokeWidth="1"
          opacity=".35"
        />
      ))}
      <path d={path} fill="none" stroke="var(--gym-accent, #6b8c1a)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      {points.length > 0 ? (
        <circle cx={points[points.length - 1][0]} cy={points[points.length - 1][1]} r="3.5" fill="var(--gym-accent, #6b8c1a)" />
      ) : null}
      {serie.map((p, index) => {
        if (index !== 0 && index !== serie.length - 1 && serie.length > 14 && index % 3 !== 0) return null;
        const x = pad + stepX * index;
        return (
          <text key={p.data} x={x} y={height - 6} textAnchor="middle" className="fill-muted-foreground" style={{ fontSize: 10 }}>
            {p.data.slice(8, 10)}/{p.data.slice(5, 7)}
          </text>
        );
      })}
    </svg>
  );
}

export function ContratosCarteiraSerieMensal({ monthKey, className }: ContratosCarteiraSerieMensalProps) {
  const { tenantId, tenantResolved } = useTenantContext();
  const query = useContratosCarteiraSerieMensal({ tenantId, tenantResolved, monthKey });

  const visibleMonthLabel = monthKey ? formatMonthLabel(monthKey) : "";

  if (!monthKey) {
    return (
      <div className={cn("rounded-xl border border-border bg-card p-6 text-sm text-muted-foreground", className)}>
        Selecione um mês de referência.
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
      <div>
        <h2 className="font-display text-xl font-bold">Carteira durante o mês</h2>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          Um ponto por dia: contratos vigentes excluindo diárias (1 dia). Média, mínimo, máximo e variação 1º versus último dia do mês.
        </p>
      </div>

      {query.isLoading && !d ? (
        <Skeleton className="h-72 w-full rounded-3xl" />
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <div className="rounded-2xl border border-border bg-card p-4 shadow-sm lg:col-span-1">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">Mês</p>
              <p className="mt-2 font-display text-lg font-bold">{visibleMonthLabel}</p>
              <span
                className={cn(
                  "mt-3 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold",
                  (d?.variacaoPrimeiroUltimoPct ?? 0) >= 0 ? "bg-gym-teal/15 text-gym-teal" : "bg-gym-danger/15 text-gym-danger",
                )}
              >
                <TrendingUp className="size-3.5" />
                {d ? formatSignedPercentage(d.variacaoPrimeiroUltimoPct) : "—"}
              </span>
              <p className="mt-1 text-[11px] text-muted-foreground">var. 1º → último dia</p>
            </div>
            <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">Média / dia</p>
              <p className="mt-2 font-display text-2xl font-bold tabular-nums">
                {d ? d.mediaContratosPorDia.toLocaleString("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: 2 }) : "—"}
              </p>
            </div>
            <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">Mínimo</p>
              <p className="mt-2 font-display text-2xl font-bold tabular-nums">
                {d ? d.minContratos.toLocaleString("pt-BR") : "—"}
              </p>
            </div>
            <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">Máximo</p>
              <p className="mt-2 font-display text-2xl font-bold tabular-nums">
                {d ? d.maxContratos.toLocaleString("pt-BR") : "—"}
              </p>
            </div>
            <DiariasMesHighlight
              quantidade={d?.totalDiariasNoMes ?? 0}
              mesLegenda={visibleMonthLabel}
              notaTooltip={d?.notaDiarias}
            />
          </div>

          <div className="rounded-3xl border border-border bg-card p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-gym-accent">Série diária</p>
            <div className="mt-4 overflow-x-auto">
              <SerieDiariaChart serie={d?.serieDiaria ?? []} />
            </div>
            <p className="mt-4 text-xs text-muted-foreground">{d?.notaContratosBase}</p>
          </div>
        </>
      )}
    </section>
  );
}
