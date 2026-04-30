"use client";

import { AlertTriangle, CalendarRange, TrendingUp, Users, WalletCards } from "lucide-react";
import type { LucideIcon } from "lucide-react";
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

function KpiCard({
  icon: Icon,
  label,
  value,
  description,
  tone = "accent",
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  description: string;
  tone?: "accent" | "teal" | "warning";
}) {
  const toneClasses = {
    accent: "border-gym-accent/30 bg-gym-accent/10 text-gym-accent",
    teal: "border-gym-teal/30 bg-gym-teal/10 text-gym-teal",
    warning: "border-gym-warning/30 bg-gym-warning/10 text-gym-warning",
  };

  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
      <span className={cn("flex size-9 items-center justify-center rounded-xl border", toneClasses[tone])}>
        <Icon className="size-4" />
      </span>
      <div className="mt-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">{label}</p>
        <p className="mt-1 font-display text-3xl font-bold tracking-tight">{value}</p>
        <p className="mt-1 text-xs text-muted-foreground">{description}</p>
      </div>
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
}: {
  canais: ContratoCanalEvolucao[];
  meses: string[];
  colors: Map<string, string>;
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
        const area = `${path} L${padding + innerWidth},${padding * 0.4 + innerHeight} L${padding},${padding * 0.4 + innerHeight} Z`;

        return (
          <g key={canal.id}>
            {canalIndex === 0 ? <path d={area} fill={color} opacity=".12" /> : null}
            <path d={path} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            {points.length > 0 ? <circle cx={points[points.length - 1][0]} cy={points[points.length - 1][1]} r="3" fill={color} /> : null}
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

function CanalCard({
  canal,
  evolucao,
  colors,
}: {
  canal: ContratoCanalOrigem;
  evolucao?: ContratoCanalEvolucao;
  colors: Map<string, string>;
}) {
  const color = resolveCanalColor(canal, colors);

  return (
    <div className="rounded-2xl border border-border bg-secondary/30 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <span
            className="inline-flex items-center gap-2 rounded-md border px-2 py-1 text-[11px] font-semibold"
            style={{ borderColor: `${color}40`, backgroundColor: `${color}14`, color }}
          >
            <span className="size-1.5 rounded-full" style={{ backgroundColor: color }} />
            {canal.tipo === "PLANO" ? "Plano" : "Agregador"} · {canal.label}
          </span>
          <div className="mt-3 font-display text-3xl font-bold tabular-nums">{formatInteger(canal.alunos)}</div>
          <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">alunos</p>
        </div>
        <span className="rounded-full bg-gym-teal/15 px-2.5 py-1 text-[11px] font-semibold text-gym-teal">
          Ativo
        </span>
      </div>
      <div className="mt-4">
        {evolucao ? (
          <Sparkline data={evolucao.serie} color={color} width={240} height={32} className="w-full" />
        ) : (
          <Skeleton className="h-8 w-full" />
        )}
      </div>
      <div className="mt-4 flex items-center justify-between border-t border-border/60 pt-3 text-xs">
        <span className="text-muted-foreground">{formatBRL(canal.mrr)} no mês</span>
        <span className="font-semibold text-foreground">{canal.percentual.toFixed(0)}% da carteira</span>
      </div>
    </div>
  );
}

export function ContratosOverview({ monthKey, className }: ContratosOverviewProps) {
  const { tenantId, tenantResolved } = useTenantContext();
  const visibleMonthLabel = monthKey ? formatMonthLabel(monthKey) : "mês de referência";
  const sinaisQuery = useContratosSinaisRetencao({ tenantId, tenantResolved, monthKey });
  const origemQuery = useContratosOrigemAlunos({ tenantId, tenantResolved, monthKey });
  const evolucaoQuery = useContratosEvolucaoCanais({ tenantId, tenantResolved, monthKey, meses: 6 });
  const awaitingSinais = sinaisQuery.isPending;
  const awaitingOrigem = origemQuery.isPending;
  const awaitingEvolucao = evolucaoQuery.isPending;
  const error = sinaisQuery.error ?? origemQuery.error ?? evolucaoQuery.error;

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

  const sinais = sinaisQuery.data;
  const origem = origemQuery.data;
  const evolucao = evolucaoQuery.data;
  const canalColors = buildCanalColorMap([...(origem?.canais ?? []), ...(evolucao?.canais ?? [])]);
  const origemSegments = (origem?.canais ?? []).map((canal) => ({
    label: canal.label,
    value: canal.alunos,
    color: resolveCanalColor(canal, canalColors),
  }));

  return (
    <section className={cn("space-y-4", className)}>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {awaitingSinais ? (
          <>
            <LoadingBlock />
            <LoadingBlock />
            <LoadingBlock />
            <LoadingBlock />
          </>
        ) : (
          <>
            <KpiCard
              icon={Users}
              label="Alunos ativos"
              value={sinais ? formatInteger(sinais.alunosAtivos) : "—"}
              description={
                sinais
                  ? `Ref. ${sinais.dataReferenciaOperacional}: ${formatInteger(sinais.alunosPlano)} plano direto · ${formatInteger(sinais.alunosContratoPersonal)} personal · ${formatInteger(sinais.alunosAgregadores)} agreg.`
                  : "Sem dados para o mês"
              }
            />
            <KpiCard
              icon={WalletCards}
              label="Receita do mês"
              value={sinais ? formatBRL(sinais.receitaMes) : "—"}
              description="Soma planos vendidos + agregadores"
              tone="teal"
            />
            <KpiCard
              icon={AlertTriangle}
              label="Em risco de churn"
              value={sinais ? formatInteger(sinais.emRiscoChurn.quantidade) : "—"}
              description={
                sinais
                  ? `Carteira na ${sinais.dataReferenciaOperacional}: sem acesso à academia há mais de ${sinais.emRiscoChurn.diasLimite} dias corridos`
                  : "Sem dados para o mês"
              }
              tone="warning"
            />
            <KpiCard
              icon={CalendarRange}
              label="Diárias no período"
              value={sinais ? formatInteger(sinais.diariasNoPeriodo) : "—"}
              description="Plano tipo avulso (AVULSO) ou vigência de um dia calendarístico"
              tone="accent"
            />
          </>
        )}
      </div>

      <div className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-3xl border border-border bg-card p-5 shadow-sm">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-gym-accent">Origem dos contratos</p>
            <h2 className="font-display text-xl font-bold">{visibleMonthLabel}</h2>
            <p className="text-sm text-muted-foreground">
              Contratos não diários por plano vs. agregadores — diárias e planos AVULSO ficam fora deste gráfico.
            </p>
          </div>
          {awaitingOrigem ? (
            <Skeleton className="mt-5 h-48 w-full" />
          ) : origemSegments.length === 0 ? (
            <p className="mt-5 rounded-2xl border border-dashed border-border px-4 py-8 text-sm text-muted-foreground">
              Sem origem de alunos para o mês selecionado.
            </p>
          ) : (
            <div className="mt-5 grid gap-4 md:grid-cols-[180px_minmax(0,1fr)] md:items-center">
              <div className="relative mx-auto flex size-44 items-center justify-center">
                <Donut segments={origemSegments} size={176} thickness={20} className="size-44" />
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="text-[11px] uppercase tracking-wide text-muted-foreground">contratos</span>
                  <strong className="font-display text-3xl">{formatInteger(origem?.totalAlunos ?? 0)}</strong>
                </div>
              </div>
              <div className="space-y-2">
                {(origem?.canais ?? []).map((canal) => {
                  const color = resolveCanalColor(canal, canalColors);
                  return (
                    <div key={canal.id} className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-background px-4 py-3">
                      <div className="flex items-center gap-3">
                        <span className="size-3 rounded-full" style={{ backgroundColor: color }} />
                        <span className="text-sm font-semibold">{canal.label}</span>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold">{formatInteger(canal.alunos)}</p>
                        <p className="text-xs text-muted-foreground">{canal.percentual.toFixed(0)}%</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div className="rounded-3xl border border-border bg-card p-5 shadow-sm">
          <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-gym-accent">Evolução de contratos</p>
              <h2 className="font-display text-xl font-bold">Últimos 6 meses por canal</h2>
              <p className="text-sm text-muted-foreground">Série agregada no backend para detectar quedas.</p>
            </div>
            <span className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold", (evolucao?.deltaPct ?? 0) >= 0 ? "bg-gym-teal/15 text-gym-teal" : "bg-gym-danger/15 text-gym-danger")}>
              <TrendingUp className="size-3.5" />
              {evolucao ? formatSignedPercentage(evolucao.deltaPct) : "—"}
            </span>
          </div>
          <div className="mt-4">
            {awaitingEvolucao ? (
              <Skeleton className="h-48 w-full" />
            ) : (
              <EvolucaoLines canais={evolucao?.canais ?? []} meses={evolucao?.meses ?? []} colors={canalColors} />
            )}
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-border bg-card shadow-sm">
        <div className="flex flex-col gap-3 border-b border-border px-5 py-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="font-display text-lg font-bold">Meus contratos & canais</h2>
            <p className="text-sm text-muted-foreground">Planos vendidos e agregadores integrados.</p>
          </div>
          <ComingSoonButton>Solicitar novo canal</ComingSoonButton>
        </div>
        <div className="grid gap-3 p-4 md:grid-cols-2 xl:grid-cols-3">
          {awaitingOrigem ? (
            <>
              <LoadingBlock />
              <LoadingBlock />
              <LoadingBlock />
            </>
          ) : (origem?.canais ?? []).length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border px-4 py-8 text-sm text-muted-foreground md:col-span-2 xl:col-span-3">
              Nenhum canal ativo encontrado para o mês selecionado.
            </div>
          ) : (
            (origem?.canais ?? []).map((canal) => (
              <CanalCard
                key={canal.id}
                canal={canal}
                evolucao={(evolucao?.canais ?? []).find((item) => item.id === canal.id)}
                colors={canalColors}
              />
            ))
          )}
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
