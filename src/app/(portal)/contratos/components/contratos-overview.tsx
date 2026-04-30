"use client";

import { useEffect, useMemo, useState } from "react";
import { Search as SearchIcon } from "lucide-react";
import type { ReactNode } from "react";
import type { ContratoCanalEvolucao, ContratoCanalOrigem } from "@/lib/api/contratos";
import {
  useContratosEvolucaoCanais,
  useContratosOrigemAlunos,
  useContratosSinaisRetencao,
} from "@/lib/query/use-contratos";
import { formatBRL } from "@/lib/formatters";
import { formatMonthLabel } from "@/lib/tenant/comercial/matriculas-insights";
import { useTenantContext } from "@/lib/tenant/hooks/use-session-context";
import { normalizeErrorMessage } from "@/lib/utils/api-error";
import { Donut } from "@/components/shared/financeiro-viz/donut";
import { Sparkline } from "@/components/shared/financeiro-viz/sparkline";
import { ListErrorState } from "@/components/shared/list-states";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type ContratosOverviewProps = {
  monthKey: string;
  className?: string;
};

const PLANO_COLORS = [
  "#6b8c1a",
  "#2563eb",
  "#a855f7",
  "#f97316",
  "#0ea5e9",
  "#e11d48",
  "#14b8a6",
  "#eab308",
  "#ec4899",
  "#64748b",
];

type CanalColorInput = {
  id?: string;
  tipo: string;
  cor: string | null;
  label?: string;
};

function formatInteger(value: number) {
  return value.toLocaleString("pt-BR");
}

function formatSignedPercentage(value: number) {
  if (!Number.isFinite(value)) return "0%";
  return `${value > 0 ? "+" : ""}${value.toFixed(1)}%`;
}

function planMomPct(serie: number[]) {
  if (serie.length < 2) return 0;
  const prev = serie[serie.length - 2] ?? 0;
  const cur = serie[serie.length - 1] ?? 0;
  if (prev <= 0) return 0;
  return ((cur - prev) / prev) * 100;
}

function planAvgTicket(alunos: number, mrr: number) {
  if (alunos <= 0) return 0;
  return mrr / alunos;
}

function getCanalKey(canal: CanalColorInput) {
  return canal.id ?? `${canal.tipo}-${canal.label ?? "sem-label"}`;
}

function buildCanalColorMap(canais: CanalColorInput[]) {
  const colors = new Map<string, string>();
  let planoIndex = 0;

  canais.forEach((canal) => {
    const key = getCanalKey(canal);
    if (colors.has(key)) return;
    if (canal.tipo === "PLANO") {
      colors.set(key, PLANO_COLORS[planoIndex % PLANO_COLORS.length]);
      planoIndex += 1;
      return;
    }
    colors.set(key, canal.cor ?? "#14b8a6");
  });

  return colors;
}

function resolveCanalColor(canal: CanalColorInput, colors?: Map<string, string>) {
  const key = getCanalKey(canal);
  const mappedColor = colors?.get(key);
  if (mappedColor) return mappedColor;
  if (canal.tipo === "PLANO") {
    return PLANO_COLORS[0];
  }
  return canal.cor ?? "#14b8a6";
}

function LoadingBlock({ className }: { className?: string }) {
  return (
    <div className={cn("space-y-3 rounded-3xl border border-border bg-card p-5", className)}>
      <Skeleton className="h-4 w-32" />
      <Skeleton className="h-28 w-full" />
      <Skeleton className="h-4 w-2/3" />
    </div>
  );
}

function ComingSoonButton({ children }: { children: ReactNode }) {
  return (
    <Button disabled title="Em breve" variant="outline" size="sm" className="border-border">
      {children}
    </Button>
  );
}

function EvolucaoLines({
  canais,
  meses,
  colors,
  focusCanalId,
}: {
  canais: ContratoCanalEvolucao[];
  meses: string[];
  colors: Map<string, string>;
  /** Quando definido, demais séries ficam enfraquecidas (protótipo dash-contratos). */
  focusCanalId: string | null;
}) {
  if (canais.length === 0 || meses.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border px-4 py-10 text-sm text-muted-foreground">
        Sem canais ativos para exibir evolução neste período.
      </div>
    );
  }

  const width = 640;
  const height = 190;
  const padding = 28;
  const innerWidth = width - padding * 2;
  const innerHeight = height - padding * 1.4;
  const maxValue = Math.max(1, ...canais.flatMap((canal) => canal.serie));
  const stepX = meses.length > 1 ? innerWidth / (meses.length - 1) : innerWidth;

  return (
    <svg width="100%" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Evolução de alunos por canal">
      {[0, 0.25, 0.5, 0.75, 1].map((tick) => (
        <line
          key={tick}
          x1={padding}
          x2={width - padding}
          y1={padding * 0.4 + innerHeight * (1 - tick)}
          y2={padding * 0.4 + innerHeight * (1 - tick)}
          stroke="var(--border)"
          strokeWidth="1"
          opacity=".35"
        />
      ))}
      {canais.map((canal, canalIndex) => {
        const color = resolveCanalColor(canal, colors);
        const points = canal.serie.map((value, index) => [
          padding + stepX * index,
          padding * 0.4 + innerHeight - (value / maxValue) * innerHeight,
        ]);
        const path = points.map((point, index) => `${index === 0 ? "M" : "L"}${point[0].toFixed(1)},${point[1].toFixed(1)}`).join(" ");
        const faded = Boolean(focusCanalId && canal.id !== focusCanalId);

        return (
          <g key={`${canal.id}-${canalIndex}`}>
            <path
              d={path}
              fill="none"
              stroke={color}
              strokeOpacity={faded ? 0.22 : 1}
              strokeWidth={faded ? 1.35 : 2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {!faded && points.length > 0 ? (
              <circle cx={points[points.length - 1][0]} cy={points[points.length - 1][1]} r="3" fill={color} />
            ) : null}
          </g>
        );
      })}
      {meses.map((mes, index) => (
        <text key={mes} x={padding + stepX * index} y={height - 6} textAnchor="middle" className="fill-muted-foreground" style={{ fontSize: 10.5 }}>
          {mes.slice(5)}/{mes.slice(2, 4)}
        </text>
      ))}
    </svg>
  );
}

function PlanoDashCard({
  canal,
  evolucao,
  colors,
  totalPlanAlunos,
  dimmed,
  onToggleFocus,
}: {
  canal: ContratoCanalOrigem;
  evolucao?: ContratoCanalEvolucao;
  colors: Map<string, string>;
  totalPlanAlunos: number;
  dimmed: boolean;
  onToggleFocus: () => void;
}) {
  const color = resolveCanalColor(canal, colors);
  const mom = evolucao ? planMomPct(evolucao.serie) : 0;
  const pctBar = totalPlanAlunos > 0 ? (canal.alunos / totalPlanAlunos) * 100 : 0;
  const declining = mom < -0.05;

  return (
    <button
      type="button"
      onClick={onToggleFocus}
      className={cn(
        "flex flex-col gap-1.5 rounded-lg border border-border bg-secondary/30 p-3 text-left transition-all hover:bg-secondary/60",
        declining && !dimmed && "border-gym-danger/35",
      )}
      style={{
        opacity: dimmed ? 0.38 : 1,
        outlineColor: dimmed ? undefined : `${color}80`,
      }}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="inline-block size-2 shrink-0 rounded-full" style={{ backgroundColor: color }} aria-hidden />
        {declining ? (
          <span className="rounded-full bg-rose-500/15 px-1.5 text-[9.5px] font-semibold text-rose-600 dark:text-rose-400">
            queda
          </span>
        ) : (
          <span />
        )}
      </div>
      <p className="line-clamp-2 text-[11px] font-semibold leading-tight">{canal.label}</p>
      <div className="flex items-baseline gap-1">
        <span className="font-display text-xl font-bold tabular-nums">{formatInteger(canal.alunos)}</span>
        <span className="text-[10px] text-muted-foreground">alunos</span>
      </div>
      {evolucao ? (
        <Sparkline data={evolucao.serie} fill={false} color={color} width={148} height={18} />
      ) : (
        <Skeleton className="h-[18px] w-full rounded-sm" />
      )}
      <div className="flex items-center justify-between text-[10.5px]">
        <span className="text-muted-foreground">{formatBRL(canal.mrr)}/mês</span>
        <span
          className={cn(
            "font-semibold tabular-nums",
            mom > 0 ? "text-emerald-600 dark:text-emerald-400" : mom < 0 ? "text-rose-500 dark:text-rose-400" : "text-muted-foreground",
          )}
        >
          {mom > 0 ? "+" : ""}
          {mom.toFixed(1)}%
        </span>
      </div>
      <div className="h-1 w-full overflow-hidden rounded-full bg-border/60">
        <div className="h-full rounded-full transition-[width]" style={{ width: `${pctBar}%`, background: color }} />
      </div>
    </button>
  );
}

export function ContratosOverview({ monthKey, className }: ContratosOverviewProps) {
  const { tenantId, tenantResolved } = useTenantContext();
  const visibleMonthLabel = monthKey ? formatMonthLabel(monthKey) : "mês de referência";
  const [planHighlightId, setPlanHighlightId] = useState<string | null>(null);
  const [planSearch, setPlanSearch] = useState("");
  const [planSort, setPlanSort] = useState<"vinculos" | "nome" | "preco" | "mom">("vinculos");

  const sinaisQuery = useContratosSinaisRetencao({ tenantId, tenantResolved, monthKey });
  const origemQuery = useContratosOrigemAlunos({ tenantId, tenantResolved, monthKey });
  const evolucaoQuery = useContratosEvolucaoCanais({ tenantId, tenantResolved, monthKey, meses: 6 });

  useEffect(() => {
    setPlanHighlightId(null);
    setPlanSearch("");
  }, [monthKey]);

  const awaitingSinais = sinaisQuery.isPending;
  const awaitingOrigem = origemQuery.isPending;
  const awaitingEvolucao = evolucaoQuery.isPending;
  const error = sinaisQuery.error ?? origemQuery.error ?? evolucaoQuery.error;

  const sinais = sinaisQuery.data;
  const origem = origemQuery.data;
  const evolucao = evolucaoQuery.data;

  const canalColors = useMemo(
    () => buildCanalColorMap([...(origem?.canais ?? []), ...(evolucao?.canais ?? [])]),
    [origem?.canais, evolucao?.canais],
  );

  const planCanals = useMemo(() => (origem?.canais ?? []).filter((c) => c.tipo === "PLANO"), [origem?.canais]);

  const totalPlanStudents = useMemo(() => planCanals.reduce((s, c) => s + c.alunos, 0), [planCanals]);

  const evolucaoPlanosOnly = useMemo(
    () => (evolucao?.canais ?? []).filter((c) => c.tipo === "PLANO"),
    [evolucao?.canais],
  );

  const evolucaoPorPlanoId = useMemo(() => {
    const m = new Map<string, ContratoCanalEvolucao>();
    evolucaoPlanosOnly.forEach((c) => m.set(c.id, c));
    return m;
  }, [evolucaoPlanosOnly]);

  const filteredSortedPlans = useMemo(() => {
    let list = [...planCanals];
    const q = planSearch.trim().toLowerCase();
    if (q) list = list.filter((p) => p.label.toLowerCase().includes(q));
    list.sort((a, b) => {
      if (planSort === "nome") return a.label.localeCompare(b.label);
      const evA = evolucaoPorPlanoId.get(a.id);
      const evB = evolucaoPorPlanoId.get(b.id);
      const momA = evA ? planMomPct(evA.serie) : 0;
      const momB = evB ? planMomPct(evB.serie) : 0;
      if (planSort === "mom") return momB - momA;
      if (planSort === "preco") {
        return planAvgTicket(b.alunos, b.mrr) - planAvgTicket(a.alunos, a.mrr);
      }
      return b.alunos - a.alunos;
    });
    return list;
  }, [planCanals, planSearch, planSort, evolucaoPorPlanoId]);

  const planCardsSorted = useMemo(() => [...planCanals].sort((a, b) => b.alunos - a.alunos), [planCanals]);

  const planDonutSegments = useMemo(
    () =>
      planCanals.map((canal) => ({
        id: canal.id,
        label: canal.label,
        value: canal.alunos,
        color: resolveCanalColor(canal, canalColors),
      })),
    [planCanals, canalColors],
  );

  const planosKinds = planCanals.length;
  const mrrPlanosDir = useMemo(() => planCanals.reduce((s, c) => s + c.mrr, 0), [planCanals]);
  const planosEmQueda = useMemo(
    () =>
      evolucaoPlanosOnly.filter((c) => {
        if (c.serie.length < 2) return false;
        const cur = c.serie[c.serie.length - 1] ?? 0;
        const prev = c.serie[c.serie.length - 2] ?? 0;
        return cur < prev;
      }).length,
    [evolucaoPlanosOnly],
  );

  const sortedLegendSegs = useMemo(() => [...planDonutSegments].sort((a, b) => b.value - a.value), [planDonutSegments]);

  function togglePlanHighlight(planId: string) {
    setPlanHighlightId((h) => (h === planId ? null : planId));
  }

  if (!monthKey) {
    return (
      <div className={cn("rounded-xl border border-border bg-card p-6 text-sm text-muted-foreground", className)}>
        Selecione um mês de referência para preparar a visão geral.
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

  const awaitingDashboardRow = awaitingSinais || awaitingOrigem || awaitingEvolucao;
  const totalPlanLabelDen = Math.max(totalPlanStudents, 1);

  return (
    <section className={cn("space-y-4", className)}>
      <div className="grid grid-cols-1 gap-3 pb-2 sm:grid-cols-2 xl:grid-cols-4">
        {awaitingDashboardRow ? (
          <>
            <LoadingBlock />
            <LoadingBlock />
            <LoadingBlock />
            <LoadingBlock />
          </>
        ) : (
          <>
            <div className="flex flex-col gap-0.5 rounded-xl border border-border bg-card px-4 py-3">
              <span className="text-[10.5px] font-semibold uppercase tracking-wider text-muted-foreground">Contratos ativos</span>
              <span className="font-display text-2xl font-bold leading-tight">
                {sinais ? formatInteger(sinais.alunosPlano) : "—"}
              </span>
              <span className="text-[11px] text-muted-foreground">
                {planosKinds} {planosKinds === 1 ? "tipo de plano" : "tipos de plano"}
              </span>
            </div>
            <div className="flex flex-col gap-0.5 rounded-xl border border-border bg-card px-4 py-3">
              <span className="text-[10.5px] font-semibold uppercase tracking-wider text-muted-foreground">MRR planos diretos</span>
              <span className="font-display text-2xl font-bold leading-tight text-[color:var(--gym-accent)]">{formatBRL(mrrPlanosDir)}</span>
              <span className="text-[11px] text-muted-foreground">Origem por plano (mês)</span>
            </div>
            <div className="flex flex-col gap-0.5 rounded-xl border border-border bg-card px-4 py-3">
              <span className="text-[10.5px] font-semibold uppercase tracking-wider text-muted-foreground">Crescimento MoM</span>
              <span
                className={cn(
                  "font-display text-2xl font-bold leading-tight",
                  (evolucao?.deltaPct ?? 0) >= 0 ? "text-gym-teal" : "text-gym-danger",
                )}
              >
                {evolucao ? formatSignedPercentage(evolucao.deltaPct) : "—"}
              </span>
              <span className="text-[11px] text-muted-foreground">vs. mês anterior (canais)</span>
            </div>
            <div className="flex flex-col gap-0.5 rounded-xl border border-border bg-card px-4 py-3">
              <span className="text-[10.5px] font-semibold uppercase tracking-wider text-muted-foreground">Planos em queda</span>
              <span className="font-display text-2xl font-bold leading-tight text-[color:var(--gym-warning)]">
                {formatInteger(planosEmQueda)}
              </span>
              <span className="text-[11px] text-muted-foreground">Série menor no último mês</span>
            </div>
          </>
        )}
      </div>

      <div className="rounded-xl border border-dashed border-border/80 bg-secondary/20 px-4 py-3 text-[11px] leading-relaxed text-muted-foreground">
        <span className="font-semibold text-foreground">Resumo da carteira: </span>
        {sinais ? (
          <>
            {formatInteger(sinais.alunosAtivos)} ativos ({sinais.dataReferenciaOperacional}) · {formatInteger(sinais.emRiscoChurn.quantidade)}{" "}
            risco churn · {formatInteger(sinais.diariasNoPeriodo)} diárias · receita total {formatBRL(sinais.receitaMes)}
            {typeof sinais.alunosContratoPersonal === "number" ? <> · {formatInteger(sinais.alunosContratoPersonal)} personal</> : null}
            {typeof sinais.alunosAgregadores === "number" ? <> · {formatInteger(sinais.alunosAgregadores)} via agreg.</> : null}
            . Contratos de agregador ficam na aba <strong className="text-foreground">Agregadores</strong>.
          </>
        ) : (
          "Sem dados agregados."
        )}
      </div>

      <div className="flex min-h-0 flex-col gap-3 lg:flex-row lg:gap-3">
        <div className="flex w-full shrink-0 flex-col gap-3 lg:w-[420px]">
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="mb-3 text-[11.5px] text-muted-foreground">Planos diretos · {visibleMonthLabel}</p>
            {awaitingOrigem ? (
              <Skeleton className="h-[160px] w-full rounded-lg" />
            ) : planDonutSegments.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
                Nenhum plano com alunos no período.
              </div>
            ) : (
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                <div className="relative mx-auto shrink-0">
                  <Donut segments={planDonutSegments} size={136} thickness={18} />
                  <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
                    <span className="text-[10px] uppercase tracking-wide text-muted-foreground">contratos</span>
                    <strong className="font-display text-2xl tabular-nums">{formatInteger(totalPlanStudents)}</strong>
                  </div>
                </div>
                <div className="min-w-0 flex-1 space-y-1">
                  <p className="mb-1 text-[11.5px] text-muted-foreground">Distribuição por plano</p>
                  {sortedLegendSegs.slice(0, 6).map((d) => {
                    const pct = ((d.value / totalPlanLabelDen) * 100).toFixed(1);
                    const faded = Boolean(planHighlightId && d.id && planHighlightId !== d.id);
                    return (
                      <button
                        key={d.id ?? d.label}
                        type="button"
                        className={cn(
                          "flex w-full cursor-pointer items-center gap-2 rounded px-1.5 py-0.5 text-left transition-colors hover:bg-secondary/60",
                          faded && "opacity-40",
                        )}
                        onClick={() => d.id && togglePlanHighlight(d.id)}
                      >
                        <span className="size-2 shrink-0 rounded-full" style={{ backgroundColor: d.color }} aria-hidden />
                        <span className="truncate text-[11px] font-medium">{d.label}</span>
                        <span className="ml-auto shrink-0 tabular-nums text-[11px] font-semibold">{formatInteger(d.value)}</span>
                        <span className="w-8 shrink-0 text-right tabular-nums text-[10.5px] text-muted-foreground">{pct}%</span>
                      </button>
                    );
                  })}
                  {sortedLegendSegs.length > 6 ? (
                    <span className="block pl-4 text-[10.5px] text-muted-foreground">
                      +{sortedLegendSegs.length - 6} outros planos
                    </span>
                  ) : null}
                </div>
              </div>
            )}
          </div>

          <div className="flex max-h-[min(460px,55vh)] min-h-[200px] flex-col overflow-hidden rounded-xl border border-border bg-card">
            <div className="flex shrink-0 items-center gap-2 border-b border-border px-3 py-2.5">
              <div className="relative min-w-0 flex-1">
                <SearchIcon className="pointer-events-none absolute left-2 top-1/2 size-3 -translate-y-1/2 text-muted-foreground" aria-hidden />
                <Input
                  value={planSearch}
                  onChange={(e) => setPlanSearch(e.target.value)}
                  placeholder="Buscar plano..."
                  className="h-9 border-border bg-secondary/60 pl-7 text-[12px]"
                />
              </div>
              <select
                value={planSort}
                onChange={(e) => setPlanSort(e.target.value as typeof planSort)}
                className="shrink-0 rounded-md border border-border bg-secondary/60 px-2 py-1.5 text-[11.5px] outline-none"
              >
                <option value="vinculos">↓ Alunos</option>
                <option value="preco">↓ Ticket médio</option>
                <option value="mom">↓ MoM</option>
                <option value="nome">A–Z</option>
              </select>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto">
              {awaitingOrigem ? (
                <Skeleton className="m-3 h-32 rounded-lg" />
              ) : filteredSortedPlans.length === 0 ? (
                <p className="px-4 py-8 text-center text-[12px] text-muted-foreground">Nenhum plano encontrado.</p>
              ) : (
                filteredSortedPlans.map((p) => {
                  const evPl = evolucaoPorPlanoId.get(p.id);
                  const mom = evPl ? planMomPct(evPl.serie) : 0;
                  const color = resolveCanalColor(p, canalColors);
                  const pctLinha = totalPlanStudents > 0 ? (p.alunos / totalPlanStudents) * 100 : 0;
                  const rowFaded = Boolean(planHighlightId && planHighlightId !== p.id);
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => togglePlanHighlight(p.id)}
                      className={cn(
                        "group flex w-full cursor-pointer items-center gap-3 border-b border-border/50 px-3 py-2.5 text-left transition-colors hover:bg-secondary/40",
                        rowFaded && "opacity-40",
                      )}
                    >
                      <span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: color }} aria-hidden />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-baseline justify-between gap-2">
                          <span className="truncate text-[12px] font-medium">{p.label}</span>
                          <span className="shrink-0 tabular-nums text-[12.5px] font-bold">{formatInteger(p.alunos)}</span>
                        </div>
                        <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-border/60">
                          <div className="h-full rounded-full" style={{ width: `${pctLinha}%`, background: color }} />
                        </div>
                      </div>
                      <div className="shrink-0">
                        {evPl ? (
                          <Sparkline data={evPl.serie} fill={false} color={color} width={52} height={20} />
                        ) : (
                          <Skeleton className="h-5 w-[52px]" />
                        )}
                      </div>
                      <span
                        className={cn(
                          "w-12 shrink-0 text-right text-[10.5px] font-semibold tabular-nums",
                          mom > 0 ? "text-emerald-600 dark:text-emerald-400" : mom < 0 ? "text-rose-500 dark:text-rose-400" : "text-muted-foreground",
                        )}
                      >
                        {mom > 0 ? "+" : ""}
                        {mom.toFixed(1)}%
                      </span>
                    </button>
                  );
                })
              )}
            </div>
            <div className="shrink-0 border-t border-border px-3 py-2 text-[10.5px] text-muted-foreground">
              {filteredSortedPlans.length} de {planCanals.length} planos
            </div>
          </div>
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-3">
          <div className="rounded-xl border border-border bg-card p-4">
            <div className="mb-1 flex flex-wrap items-start justify-between gap-2">
              <div>
                <h3 className="text-[13px] font-semibold">Evolução de alunos — últimos 6 meses</h3>
                <p className="text-[11.5px] text-muted-foreground">
                  Por plano · use a lista à esquerda para destacar um canal no gráfico
                </p>
              </div>
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 text-[11px] font-semibold tabular-nums",
                  (evolucao?.deltaPct ?? 0) >= 0
                    ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                    : "bg-rose-500/15 text-rose-700 dark:text-rose-300",
                )}
              >
                {evolucao ? formatSignedPercentage(evolucao.deltaPct) : "—"} MoM
              </span>
            </div>
            <div className="mt-2">
              {awaitingEvolucao ? (
                <Skeleton className="h-48 w-full rounded-lg" />
              ) : (
                <EvolucaoLines
                  canais={evolucaoPlanosOnly}
                  meses={evolucao?.meses ?? []}
                  colors={canalColors}
                  focusCanalId={planHighlightId}
                />
              )}
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3">
              <h3 className="text-[13px] font-semibold">Detalhe por plano</h3>
              <span className="text-[11px] text-muted-foreground">{planCanals.length} planos cadastrados</span>
              <ComingSoonButton>Solicitar novo plano</ComingSoonButton>
            </div>
            <div
              className="grid gap-2 overflow-y-auto p-3"
              style={{ gridTemplateColumns: "repeat(auto-fill, minmax(168px, 1fr))", maxHeight: 320 }}
            >
              {awaitingOrigem ? (
                <>
                  <Skeleton className="h-36 rounded-lg" />
                  <Skeleton className="h-36 rounded-lg" />
                  <Skeleton className="h-36 rounded-lg" />
                </>
              ) : planCardsSorted.length === 0 ? (
                <div className="col-span-full rounded-lg border border-dashed border-border py-10 text-center text-sm text-muted-foreground">
                  Nenhum plano para exibir.
                </div>
              ) : (
                planCardsSorted.map((canal) => (
                  <PlanoDashCard
                    key={canal.id}
                    canal={canal}
                    evolucao={evolucaoPorPlanoId.get(canal.id)}
                    colors={canalColors}
                    totalPlanAlunos={totalPlanLabelDen}
                    dimmed={Boolean(planHighlightId && planHighlightId !== canal.id)}
                    onToggleFocus={() => togglePlanHighlight(canal.id)}
                  />
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-border bg-card shadow-sm">
        <div className="border-b border-border px-5 py-4">
          <h2 className="font-display text-lg font-bold">Ações para esta semana</h2>
          <p className="text-sm text-muted-foreground">Priorizadas por impacto na retenção, a partir dos sinais agregados.</p>
        </div>
        <div className="divide-y divide-border">
          <ActionRow
            severity="alta"
            title={sinais ? `Retomar ${formatInteger(sinais.emRiscoChurn.quantidade)} alunos sem acesso` : "Retomar alunos sem acesso"}
            description={
              sinais
                ? `Ref. ${sinais.dataReferenciaOperacional}: sem entrada na academia há mais de ${sinais.emRiscoChurn.diasLimite} dias`
                : "Sinal indisponível para o mês."
            }
            impact={sinais ? `Receita do mês ${formatBRL(sinais.receitaMes)}` : "—"}
            cta="Criar campanha"
          />
          <ActionRow
            severity="média"
            title={sinais ? `Acompanhar ${formatInteger(sinais.diariasNoPeriodo)} diárias do período` : "Acompanhar diárias do período"}
            description="Vendas/avulsos de vigência única ficam agrupadas separadamente da carteira recorrente."
            impact={sinais ? `${formatInteger(sinais.alunosContratoPersonal)} contratos personal` : "—"}
            cta="Ver canais"
          />
          <ActionRow
            severity="média"
            title="Auditar canais com queda"
            description="Use a evolução por canal para priorizar auditoria operacional."
            impact={evolucao ? `${formatSignedPercentage(evolucao.deltaPct)} MoM` : "—"}
            cta="Abrir auditoria"
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <ComingSoonButton>Disparar campanha</ComingSoonButton>
        <ComingSoonButton>Criar campanha</ComingSoonButton>
      </div>
    </section>
  );
}

function ActionRow({
  severity,
  title,
  description,
  impact,
  cta,
}: {
  severity: "alta" | "média";
  title: string;
  description: string;
  impact: string;
  cta: string;
}) {
  return (
    <div className="flex flex-col gap-3 px-5 py-4 md:flex-row md:items-center md:justify-between">
      <div className="flex items-start gap-3">
        <span className={cn("mt-1 size-2.5 rounded-full", severity === "alta" ? "bg-gym-warning" : "bg-gym-accent")} />
        <div>
          <p className="text-sm font-semibold">{title}</p>
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-3 text-xs">
        <span className="text-muted-foreground">{impact}</span>
        <ComingSoonButton>{cta}</ComingSoonButton>
      </div>
    </div>
  );
}
