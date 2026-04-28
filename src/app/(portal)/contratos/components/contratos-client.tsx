"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Activity,
  BarChart3,
  Building2,
  CircleAlert,
  FileSignature,
  Plus,
  RefreshCcw,
  ShieldCheck,
  WalletCards,
  XCircle,
} from "lucide-react";
import {
  buildMonthKeyFromDate,
  formatDateLabel,
  formatMonthLabel,
} from "@/lib/tenant/comercial/matriculas-insights";
import type { ContratoDashboardMensalPlano } from "@/lib/api/contratos";
import {
  resolveContratoStatusFromPlano,
  resolveFluxoComercialStatus,
  STATUS_CONTRATO_LABEL,
  STATUS_FLUXO_COMERCIAL_LABEL,
} from "@/lib/tenant/comercial/plano-flow";
import { useTenantContext } from "@/lib/tenant/hooks/use-session-context";
import { useContratos, useRenovarContrato, useCancelarContrato } from "@/lib/query/use-contratos";
import { normalizeErrorMessage } from "@/lib/utils/api-error";
import { formatBRL } from "@/lib/formatters";
import { useConfirmDialog } from "@/hooks/use-confirm-dialog";
import { ListErrorState } from "@/components/shared/list-states";
import { BiMetricCard } from "@/components/shared/bi-metric-card";
import { Donut } from "@/components/shared/financeiro-viz/donut";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 20;
const PLAN_COLORS = [
  "var(--color-chart-1)",
  "var(--color-chart-2)",
  "var(--color-chart-3)",
  "var(--color-chart-4)",
  "var(--color-chart-5)",
];

const ASSINATURA_STATUS_LABEL: Record<string, string> = {
  ATIVA: "Recorrente",
  PENDENTE: "Pendente",
  CANCELADA: "Cancelada",
  SUSPENSA: "Suspensa",
  VENCIDA: "Vencida",
  INADIMPLENTE: "Inadimplente",
  TRIAL: "Trial",
};

type ActionItemTone = "accent" | "warning" | "neutral";

type ActionItem = {
  id: string;
  title: string;
  description: string;
  tone: ActionItemTone;
};

function formatPercentage(value: number) {
  return `${value.toFixed(0)}%`;
}

function getBadgeClass(kind: "contrato" | "fluxo", value: string | undefined) {
  if (kind === "contrato") {
    if (value === "ASSINADO") return "bg-gym-teal/15 text-gym-teal";
    if (value === "PENDENTE_ASSINATURA") return "bg-gym-warning/15 text-gym-warning";
    return "bg-muted text-muted-foreground";
  }

  if (value === "ATIVO") return "bg-gym-teal/15 text-gym-teal";
  if (value === "AGUARDANDO_ASSINATURA") return "bg-amber-500/15 text-amber-400";
  if (value === "AGUARDANDO_PAGAMENTO") return "bg-gym-warning/15 text-gym-warning";
  if (value === "CANCELADO") return "bg-gym-danger/15 text-gym-danger";
  if (value === "VENCIDO") return "bg-muted text-muted-foreground";
  return "bg-muted text-muted-foreground";
}

function getAssinaturaBadgeClass(status: string): string {
  if (status === "ATIVA") return "bg-gym-teal/15 text-gym-teal";
  if (status === "PENDENTE" || status === "TRIAL") return "bg-gym-warning/15 text-gym-warning";
  if (status === "CANCELADA" || status === "INADIMPLENTE") return "bg-gym-danger/15 text-gym-danger";
  if (status === "SUSPENSA" || status === "VENCIDA") return "bg-muted text-muted-foreground";
  return "bg-muted text-muted-foreground";
}

function buildActionItems(input: {
  pendingSignatureCount: number;
  activePercentage: number;
  topPlan?: ContratoDashboardMensalPlano;
  monthLabel: string;
}): ActionItem[] {
  const items: ActionItem[] = [];

  if (input.pendingSignatureCount > 0) {
    items.push({
      id: "pending-signature",
      title: "Cobrar assinatura pendente",
      description: `${input.pendingSignatureCount} contrato(s) ainda aguardam assinatura em ${input.monthLabel}.`,
      tone: "warning",
    });
  }

  if (input.topPlan && input.topPlan.percentual >= 45) {
    items.push({
      id: "top-plan",
      title: "Monitorar concentracao da carteira",
      description: `${input.topPlan.planoNome} responde por ${formatPercentage(input.topPlan.percentual)} da carteira ativa do recorte.`,
      tone: "accent",
    });
  }

  if (input.activePercentage < 85) {
    items.push({
      id: "active-ratio",
      title: "Revisar contratos fora do status ativo",
      description: `A carteira ativa esta em ${formatPercentage(input.activePercentage)} no mes e pede revisao operacional.`,
      tone: "warning",
    });
  }

  if (items.length === 0) {
    items.push({
      id: "healthy",
      title: "Carteira estavel no tenant ativo",
      description: "Sem alertas criticos no resumo mensal atual. Mantenha o acompanhamento das renovacoes e da assinatura digital.",
      tone: "neutral",
    });
  }

  return items.slice(0, 3);
}

function getActionToneClasses(tone: ActionItemTone) {
  if (tone === "warning") {
    return "border-gym-warning/30 bg-gym-warning/10 text-gym-warning";
  }
  if (tone === "accent") {
    return "border-gym-accent/30 bg-gym-accent/10 text-gym-accent";
  }
  return "border-border bg-secondary/40 text-muted-foreground";
}

export function ContratosClient() {
  const { confirm, ConfirmDialog } = useConfirmDialog();
  const {
    tenantId,
    tenantName,
    tenantResolved,
    broadAccess,
    canAccessElevatedModules,
  } = useTenantContext();
  const [feedback, setFeedback] = useState<string | null>(null);
  const [actionId, setActionId] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [selectedMonthKey, setSelectedMonthKey] = useState("");

  useEffect(() => {
    setSelectedMonthKey(buildMonthKeyFromDate(new Date()));
  }, []);

  const { data: dashboard, isLoading: loading, error: queryError, refetch } = useContratos({
    tenantId,
    tenantResolved,
    monthKey: selectedMonthKey,
    page,
  });

  const error = queryError ? normalizeErrorMessage(queryError) : null;
  const renovarMutation = useRenovarContrato();
  const cancelarMutation = useCancelarContrato();

  useEffect(() => {
    setPage(0);
    setFeedback(null);
    setActionId(null);
  }, [tenantId]);

  const visibleRows = dashboard?.contratos?.items ?? [];
  const activeGroups = dashboard?.carteiraAtivaPorPlano;
  const summary = dashboard?.resumo;
  const visibleMonthLabel = formatMonthLabel(dashboard?.mes || selectedMonthKey);
  const hasNextPage = dashboard ? page + 1 < dashboard.contratos.totalPages : false;
  const showingFrom = visibleRows.length === 0 ? 0 : page * PAGE_SIZE + 1;
  const showingTo = visibleRows.length === 0 ? 0 : page * PAGE_SIZE + visibleRows.length;
  const coverageNotice = "Fonte: dashboard mensal operacional da unidade ativa.";

  const sortedGroups = useMemo(
    () => [...(activeGroups ?? [])].sort((left, right) => right.quantidade - left.quantidade),
    [activeGroups],
  );

  const planSegments = useMemo(
    () =>
      sortedGroups.map((group, index) => ({
        label: group.planoNome,
        value: group.quantidade,
        color: PLAN_COLORS[index % PLAN_COLORS.length],
      })),
    [sortedGroups],
  );

  const topPlan = sortedGroups[0];
  const contractScopeLabel = tenantResolved ? tenantName : "Unidade ativa";
  const showGlobalHint = Boolean(broadAccess || canAccessElevatedModules);

  const actionItems = useMemo(
    () =>
      buildActionItems({
        pendingSignatureCount: summary?.pendentesAssinatura ?? 0,
        activePercentage: summary?.percentualAtivos ?? 0,
        topPlan,
        monthLabel: visibleMonthLabel,
      }),
    [summary?.pendentesAssinatura, summary?.percentualAtivos, topPlan, visibleMonthLabel],
  );

  return (
    <div className="space-y-6">
      {ConfirmDialog}

      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-2 rounded-full border border-gym-accent/30 bg-gym-accent/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-gym-accent">
              <Building2 className="size-3.5" />
              Unidade atual
            </span>
            <span className="inline-flex items-center rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-foreground">
              {contractScopeLabel}
            </span>
            {showGlobalHint ? (
              <span className="inline-flex items-center rounded-full border border-border bg-secondary px-3 py-1 text-xs text-muted-foreground">
                Visao global segue fluxo separado
              </span>
            ) : null}
          </div>

          <div>
            <h1 className="font-display text-2xl font-bold tracking-tight">Contratos e assinaturas</h1>
            <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
              Leitura operacional do tenant ativo com foco na carteira da unidade, contratos vigentes e proximos pontos de atencao.
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="min-w-[220px]">
            <label
              htmlFor="contratos-month-filter"
              className="mb-1 block text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground"
            >
              Mes de referencia
            </label>
            <Input
              id="contratos-month-filter"
              type="month"
              value={selectedMonthKey}
              onChange={(event) => {
                setPage(0);
                setSelectedMonthKey(event.target.value);
              }}
              className="border-border bg-card"
            />
          </div>
          <Link href="/vendas/nova">
            <Button>
              <Plus className="size-4" />
              Nova contratacao
            </Button>
          </Link>
        </div>
      </div>

      {showGlobalHint ? (
        <div className="rounded-2xl border border-border bg-card px-4 py-3 text-sm text-muted-foreground">
          Mesmo para perfis com acesso ampliado, esta tela permanece no escopo da unidade ativa. Consultas cross-tenant ficam em uma experiencia dedicada e somente leitura.
        </div>
      ) : null}

      {feedback ? (
        <div className="rounded-md border border-gym-teal/30 bg-gym-teal/10 px-4 py-3 text-sm text-gym-teal">
          {feedback}
        </div>
      ) : null}

      {error ? <ListErrorState error={error} onRetry={() => void refetch()} /> : null}

      <section className="grid gap-4 xl:grid-cols-[1.45fr_0.95fr]">
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <BiMetricCard
              icon={WalletCards}
              label={`Contratos em ${visibleMonthLabel}`}
              value={loading && !summary ? "…" : String(summary?.totalContratos ?? 0)}
              description="Total consolidado do mes selecionado"
              tone="accent"
            />
            <BiMetricCard
              icon={Activity}
              label="Receita contratada"
              value={formatBRL(summary?.receitaContratada ?? 0)}
              description="Somatorio da carteira da unidade"
              tone="teal"
            />
            <BiMetricCard
              icon={ShieldCheck}
              label="Carteira ativa"
              value={formatPercentage(summary?.percentualAtivos ?? 0)}
              description={`${summary?.contratosAtivos ?? 0} contrato(s) ativos no mes`}
              tone="accent"
            />
            <BiMetricCard
              icon={FileSignature}
              label="Pendentes de assinatura"
              value={String(summary?.pendentesAssinatura ?? 0)}
              description="Contratos que ainda dependem de assinatura"
              tone={(summary?.pendentesAssinatura ?? 0) > 0 ? "warning" : "accent"}
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="rounded-3xl border border-border bg-card p-5 shadow-sm">
              <div className="flex items-center gap-2">
                <BarChart3 className="size-4 text-gym-accent" />
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-gym-accent">
                  Radar operacional
                </p>
              </div>

              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <InsightPanel
                  title="Leitura do mes"
                  description={summary?.insight ?? "Nenhum insight disponível para o mês selecionado."}
                />
                <InsightPanel
                  title="Plano lider"
                  description={
                    topPlan
                      ? `${topPlan.planoNome} concentra ${formatPercentage(topPlan.percentual)} da carteira ativa e ${formatBRL(topPlan.valor)} no recorte.`
                      : "Sem carteira ativa agrupada por plano neste periodo."
                  }
                />
              </div>

              <div className="mt-4 space-y-3">
                {actionItems.map((item) => (
                  <div
                    key={item.id}
                    className={cn(
                      "rounded-2xl border px-4 py-3",
                      getActionToneClasses(item.tone),
                    )}
                  >
                    <p className="text-sm font-semibold">{item.title}</p>
                    <p className="mt-1 text-sm text-current/80">{item.description}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-border bg-card p-5 shadow-sm">
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-gym-accent">
                  Distribuicao ativa
                </p>
                <h2 className="font-display text-xl font-bold">Carteira por plano</h2>
                <p className="text-sm text-muted-foreground">
                  Composicao dos contratos ativos da unidade em {visibleMonthLabel}.
                </p>
              </div>

              <div className="mt-5 grid gap-4 md:grid-cols-[200px_minmax(0,1fr)] md:items-center">
                <div className="relative mx-auto flex size-44 items-center justify-center">
                  <Donut segments={planSegments} size={176} thickness={20} className="size-44" />
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                    <span className="text-[11px] uppercase tracking-wide text-muted-foreground">ativos</span>
                    <strong className="font-display text-3xl">{summary?.contratosAtivos ?? 0}</strong>
                  </div>
                </div>

                <div className="space-y-3">
                  {sortedGroups.length === 0 ? (
                    <p className="rounded-2xl border border-dashed border-border px-4 py-6 text-sm text-muted-foreground">
                      Nenhum contrato ativo para compor a distribuicao deste mes.
                    </p>
                  ) : (
                    sortedGroups.map((group, index) => (
                      <div
                        key={`${group.planoId ?? group.planoNome}-${index}`}
                        className="rounded-2xl border border-border bg-background px-4 py-3"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <span
                              className="size-3 rounded-full"
                              style={{ backgroundColor: PLAN_COLORS[index % PLAN_COLORS.length] }}
                              aria-hidden="true"
                            />
                            <div>
                              <p className="text-sm font-semibold">{group.planoNome}</p>
                              <p className="text-xs text-muted-foreground">
                                {group.quantidade} contrato(s) ativos
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-semibold">{formatPercentage(group.percentual)}</p>
                            <p className="text-xs text-muted-foreground">{formatBRL(group.valor)}</p>
                          </div>
                        </div>
                        <div className="mt-3 h-2 rounded-full bg-secondary">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${Math.min(100, Math.max(0, group.percentual))}%`,
                              backgroundColor: PLAN_COLORS[index % PLAN_COLORS.length],
                            }}
                          />
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center gap-2">
            <Building2 className="size-4 text-gym-accent" />
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-gym-accent">
              Escopo da tela
            </p>
          </div>

          <div className="mt-4 space-y-4">
            <div className="rounded-2xl border border-border bg-secondary/40 p-4">
              <p className="text-sm font-semibold text-foreground">Tenant ativo</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Todas as metricas e a listagem abaixo consideram apenas a unidade ativa desta sessao.
              </p>
            </div>

            <div className="rounded-2xl border border-border bg-background p-4">
              <p className="text-sm font-semibold text-foreground">Unidade carregada</p>
              <p className="mt-1 font-display text-xl font-bold">{contractScopeLabel}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Mes monitorado: {visibleMonthLabel}. Ticket medio atual: {formatBRL(summary?.ticketMedio ?? 0)}.
              </p>
            </div>

            <div className="rounded-2xl border border-border bg-background p-4">
              <div className="flex items-start gap-3">
                <CircleAlert className="mt-0.5 size-4 text-gym-warning" />
                <div>
                  <p className="text-sm font-semibold text-foreground">Regra de produto</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    A visao multi-tenant nao entra como variacao desta rota. Para perfis com acesso global, a leitura cross-tenant deve acontecer em fluxo dedicado e separado.
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-background p-4">
              <p className="text-sm font-semibold text-foreground">Sinalizacao operacional</p>
              <ul className="mt-2 space-y-2 text-sm text-muted-foreground">
                <li>Sem filtros multi-tenant no estado padrao desta tela.</li>
                <li>Acoes de renovar e cancelar continuam restritas ao tenant ativo.</li>
                <li>Qualquer leitura global deve indicar escopo e origem dos dados explicitamente.</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex flex-col gap-2 rounded-2xl border border-border bg-card px-4 py-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="font-display text-lg font-bold">Contratos recentes de {visibleMonthLabel}</h2>
            <p className="text-sm text-muted-foreground">
              Carteira listada do mais recente para o mais antigo no tenant ativo.
            </p>
          </div>
          <p className="text-xs text-muted-foreground">{coverageNotice}</p>
        </div>

        <div className="overflow-hidden rounded-2xl border border-border bg-card">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-secondary/70">
                <th scope="col" className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Cliente
                </th>
                <th scope="col" className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Plano e cobranca
                </th>
                <th scope="col" className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Vigencia
                </th>
                <th scope="col" className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Situacao
                </th>
                <th scope="col" className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Acoes
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {visibleRows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-sm text-muted-foreground">
                    {loading ? "Carregando contratos..." : "Nenhum contrato recente encontrado no mes selecionado"}
                  </td>
                </tr>
              ) : null}

              {visibleRows.map((row) => {
                const contratoStatus = resolveContratoStatusFromPlano(row.plano, row.contratoStatus);
                const fluxoStatus = resolveFluxoComercialStatus({
                  matricula: row,
                  pagamento: row.pagamento,
                  plano: row.plano,
                });
                const canCancel = row.status === "ATIVA";
                const canRenew = row.status === "VENCIDA" || row.status === "CANCELADA";

                return (
                  <tr key={row.id} className="align-top">
                    <td className="px-4 py-4 text-sm">
                      <div className="font-semibold text-foreground">
                        {row.aluno?.nome ?? "Cliente nao identificado"}
                      </div>
                      <div className="mt-1 text-xs text-muted-foreground">
                        Inicio em {formatDateLabel(row.dataInicio)}
                      </div>
                    </td>

                    <td className="px-4 py-4 text-sm">
                      <div className="font-medium text-foreground">
                        {row.plano?.nome ?? "Plano nao encontrado"}
                      </div>
                      <div className="mt-1 text-xs text-muted-foreground">
                        {formatBRL(row.valorPago)} · {row.pagamento?.formaPagamento ?? row.formaPagamento}
                      </div>
                      <div className="mt-1 text-xs text-muted-foreground">
                        {row.pagamento?.status ?? "Sem cobranca"} · {formatBRL(row.pagamento?.valorFinal ?? row.valorPago)}
                      </div>
                    </td>

                    <td className="px-4 py-4 text-sm text-muted-foreground">
                      <div>De {formatDateLabel(row.dataInicio)}</div>
                      <div className="mt-1 text-xs text-muted-foreground">
                        ate {formatDateLabel(row.dataFim)}
                      </div>
                    </td>

                    <td className="px-4 py-4">
                      <div className="flex flex-wrap gap-2">
                        <span className={cn("rounded-full px-2.5 py-1 text-[11px] font-semibold", getBadgeClass("contrato", contratoStatus))}>
                          {STATUS_CONTRATO_LABEL[contratoStatus]}
                        </span>
                        <span className={cn("rounded-full px-2.5 py-1 text-[11px] font-semibold", getBadgeClass("fluxo", fluxoStatus))}>
                          {fluxoStatus ? STATUS_FLUXO_COMERCIAL_LABEL[fluxoStatus] : "Sem fluxo"}
                        </span>
                        {row.assinaturaStatus ? (
                          <span className={cn("rounded-full px-2.5 py-1 text-[11px] font-semibold", getAssinaturaBadgeClass(row.assinaturaStatus))}>
                            {ASSINATURA_STATUS_LABEL[row.assinaturaStatus] ?? row.assinaturaStatus}
                          </span>
                        ) : null}
                      </div>
                    </td>

                    <td className="px-4 py-4">
                      <div className="flex justify-end gap-2">
                        {canRenew ? (
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={loading || actionId === row.id}
                            onClick={async () => {
                              if (!tenantId) return;
                              setActionId(row.id);
                              try {
                                await renovarMutation.mutateAsync({ tenantId, id: row.id });
                                setFeedback(`Contrato de ${row.aluno?.nome ?? "cliente"} renovado.`);
                              } finally {
                                setActionId(null);
                              }
                            }}
                          >
                            <RefreshCcw className="mr-1 size-4" />
                            Renovar
                          </Button>
                        ) : null}
                        {canCancel ? (
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={loading || actionId === row.id}
                            onClick={() => {
                              if (!tenantId) return;
                              confirm("Cancelar esta contratação?", async () => {
                                setActionId(row.id);
                                try {
                                  await cancelarMutation.mutateAsync({
                                    tenantId,
                                    id: row.id,
                                    assinaturaId: row.assinaturaId,
                                  });
                                  setFeedback(`Contrato de ${row.aluno?.nome ?? "cliente"} cancelado.`);
                                } finally {
                                  setActionId(null);
                                }
                              });
                            }}
                          >
                            <XCircle className="mr-1 size-4" />
                            Cancelar
                          </Button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <div className="flex items-center justify-between rounded-2xl border border-border bg-card px-4 py-3">
        <p className="text-xs text-muted-foreground">
          Mostrando <span className="font-semibold text-foreground">{showingFrom}</span> ate{" "}
          <span className="font-semibold text-foreground">{showingTo}</span> de{" "}
          <span className="font-semibold text-foreground">{dashboard?.contratos.totalItems ?? 0}</span> contrato(s) do mes · pagina{" "}
          <span className="font-semibold text-foreground">{page + 1}</span>
        </p>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            className="border-border"
            disabled={loading || page <= 0}
            onClick={() => setPage((current) => Math.max(0, current - 1))}
          >
            Anterior
          </Button>
          <Button
            type="button"
            variant="outline"
            className="border-border"
            disabled={loading || !hasNextPage}
            onClick={() => setPage((current) => current + 1)}
          >
            Proxima
          </Button>
        </div>
      </div>
    </div>
  );
}

function InsightPanel({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-secondary/40 p-4">
      <p className="text-sm font-semibold text-foreground">{title}</p>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
    </div>
  );
}
