"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Plus, RefreshCcw, XCircle } from "lucide-react";
import {
  cancelarMatriculaService,
  getMatriculasDashboardMensalService,
  renovarMatriculaService,
} from "@/lib/tenant/comercial/runtime";
import {
  buildMonthKeyFromDate,
  formatDateLabel,
  formatMonthLabel,
} from "@/lib/tenant/comercial/matriculas-insights";
import type { MatriculaDashboardMensalPlano, MatriculaDashboardMensalResult } from "@/lib/api/matriculas";
import {
  resolveContratoStatusFromPlano,
  resolveFluxoComercialStatus,
  STATUS_CONTRATO_LABEL,
  STATUS_FLUXO_COMERCIAL_LABEL,
} from "@/lib/tenant/comercial/plano-flow";
import { useTenantContext } from "@/hooks/use-session-context";
import { normalizeErrorMessage } from "@/lib/utils/api-error";
import { formatBRL } from "@/lib/formatters";
import { useConfirmDialog } from "@/hooks/use-confirm-dialog";
import { ListErrorState } from "@/components/shared/list-states";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const PAGE_SIZE = 20;
const PIE_COLORS = [
  "var(--color-chart-1)",
  "var(--color-chart-2)",
  "var(--color-chart-3)",
  "var(--color-chart-4)",
  "var(--color-chart-5)",
];

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

function buildPieGradient(groups: MatriculaDashboardMensalPlano[]) {
  if (groups.length === 0) {
    return "conic-gradient(var(--muted) 0deg 360deg)";
  }

  let current = 0;
  const segments = groups.map((group, index) => {
    const size = (group.percentual / 100) * 360;
    const color = PIE_COLORS[index % PIE_COLORS.length];
    const start = current;
    const end = current + size;
    current = end;
    return `${color} ${start}deg ${end}deg`;
  });

  if (current < 360) {
    segments.push(`var(--muted) ${current}deg 360deg`);
  }

  return `conic-gradient(${segments.join(", ")})`;
}

export function MatriculasClient() {
  const { confirm, ConfirmDialog } = useConfirmDialog();
  const { tenantId, tenantResolved, setTenant } = useTenantContext();
  const [dashboard, setDashboard] = useState<MatriculaDashboardMensalResult | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [actionId, setActionId] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [selectedMonthKey, setSelectedMonthKey] = useState("");

  useEffect(() => {
    setSelectedMonthKey(buildMonthKeyFromDate(new Date()));
  }, []);

  const loadSnapshot = useCallback(
    async (currentTenantId: string, currentMonthKey: string, currentPage: number) =>
      getMatriculasDashboardMensalService({
        tenantId: currentTenantId,
        mes: currentMonthKey,
        page: currentPage,
        size: PAGE_SIZE,
      }),
    []
  );

  const load = useCallback(async () => {
    if (!tenantId || !selectedMonthKey) return;
    setLoading(true);
    setError(null);

    try {
      const snapshot = await loadSnapshot(tenantId, selectedMonthKey, page);
      setDashboard(snapshot);
    } catch (loadError) {
      const message = normalizeErrorMessage(loadError);
      const normalizedMessage = message.toLowerCase();
      const shouldRetryWithTenantSync =
        normalizedMessage.includes("x-context-id sem unidade ativa") ||
        normalizedMessage.includes("tenantid diverge da unidade ativa do contexto informado");

      if (!shouldRetryWithTenantSync) {
        setDashboard(null);
        setError(message || "Não foi possível carregar os contratos da unidade ativa.");
        setLoading(false);
        return;
      }

      try {
        await setTenant(tenantId);
        const snapshot = await loadSnapshot(tenantId, selectedMonthKey, page);
        setDashboard(snapshot);
      } catch (retryError) {
        setDashboard(null);
        setError(normalizeErrorMessage(retryError));
      }
    } finally {
      setLoading(false);
    }
  }, [loadSnapshot, page, selectedMonthKey, setTenant, tenantId]);

  useEffect(() => {
    setPage(0);
    setDashboard(null);
    setFeedback(null);
    setError(null);
    setActionId(null);
  }, [tenantId]);

  useEffect(() => {
    if (!tenantResolved || !tenantId || !selectedMonthKey) return;
    void load();
  }, [load, selectedMonthKey, tenantId, tenantResolved]);

  const visibleRows = dashboard?.contratos.items ?? [];
  const activeGroups = dashboard?.carteiraAtivaPorPlano ?? [];
  const summary = dashboard?.resumo;
  const visibleMonthLabel = formatMonthLabel(dashboard?.mes || selectedMonthKey);
  const hasNextPage = dashboard ? page + 1 < dashboard.contratos.totalPages : false;
  const showingFrom = visibleRows.length === 0 ? 0 : page * PAGE_SIZE + 1;
  const showingTo = visibleRows.length === 0 ? 0 : page * PAGE_SIZE + visibleRows.length;
  const coverageNotice = "Visao mensal agregada pelo endpoint do backend com paginação server-side.";

  return (
    <div className="space-y-6">
      {ConfirmDialog}
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">Contratos e assinaturas</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Acompanhe os ultimos contratos do mes selecionado da unidade ativa, com leitura executiva da carteira e foco nos ativos.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="min-w-[220px]">
            <label htmlFor="matriculas-month-filter" className="mb-1 block text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
              Mês de referência
            </label>
            <Input
              id="matriculas-month-filter"
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
              Nova contratação
            </Button>
          </Link>
        </div>
      </div>

      {feedback ? (
        <div className="rounded-md border border-gym-teal/30 bg-gym-teal/10 px-4 py-3 text-sm text-gym-teal">
          {feedback}
        </div>
      ) : null}

      {error ? <ListErrorState error={error} onRetry={() => void load()} /> : null}

      <section className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              label={`Contratos em ${visibleMonthLabel}`}
              value={loading && !summary ? "…" : String(summary?.totalContratos ?? 0)}
              helper="total consolidado do mes selecionado"
            />
            <MetricCard
              label="Receita contratada"
              value={formatBRL(summary?.receitaContratada ?? 0)}
              helper="somatorio consolidado do mes"
            />
            <MetricCard
              label="Valor medio do contrato"
              value={formatBRL(summary?.ticketMedio ?? 0)}
              helper="ticket medio consolidado do mes"
            />
            <MetricCard
              label="Carteira ativa"
              value={formatPercentage(summary?.percentualAtivos ?? 0)}
              helper={`${summary?.contratosAtivos ?? 0} contrato(s) ativos no mes`}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <ContextCard
              title="Leitura sugerida"
              text={summary?.insight ?? "Nenhum insight disponível para o mês selecionado."}
            />
            <ContextCard
              title="Ponto de atencao"
              text={
                (summary?.pendentesAssinatura ?? 0) > 0
                  ? `${summary?.pendentesAssinatura ?? 0} contrato(s) ainda aguardam assinatura no mes.`
                  : "Sem contratos pendentes de assinatura neste recorte."
              }
            />
          </div>
        </div>

        <div className="rounded-3xl border border-border bg-card/90 p-5 shadow-sm">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-gym-accent">Distribuicao ativa</p>
            <h2 className="font-display text-xl font-bold">Pizza da carteira por plano</h2>
            <p className="text-sm text-muted-foreground">
              Contratos ativos agrupados por plano no recorte de {visibleMonthLabel}.
            </p>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-[220px_minmax(0,1fr)] md:items-center">
            <div className="flex justify-center">
              <div
                className="relative size-48 rounded-full border border-border/60"
                style={{ background: buildPieGradient(activeGroups) }}
                aria-label="Grafico em pizza da carteira ativa"
              >
                <div className="absolute inset-[22%] rounded-full border border-border bg-card shadow-inner" />
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="text-[11px] uppercase tracking-wide text-muted-foreground">ativos</span>
                  <strong className="font-display text-3xl">{summary?.contratosAtivos ?? 0}</strong>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              {activeGroups.length === 0 ? (
                <p className="rounded-2xl border border-dashed border-border px-4 py-6 text-sm text-muted-foreground">
                  Nenhum contrato ativo para montar a pizza neste mes.
                </p>
              ) : (
                activeGroups.map((group, index) => (
                  <div key={`${group.planoId ?? group.planoNome}-${index}`} className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-background px-4 py-3">
                    <div className="flex items-center gap-3">
                      <span
                        className="size-3 rounded-full"
                        style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }}
                        aria-hidden="true"
                      />
                      <div>
                        <p className="text-sm font-semibold">{group.planoNome}</p>
                        <p className="text-xs text-muted-foreground">{group.quantidade} contrato(s) ativos</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold">{formatPercentage(group.percentual)}</p>
                      <p className="text-xs text-muted-foreground">{formatBRL(group.valor)}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex flex-col gap-2 rounded-2xl border border-border bg-card px-4 py-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="font-display text-lg font-bold">Ultimos contratos de {visibleMonthLabel}</h2>
            <p className="text-sm text-muted-foreground">
              Tabela ordenada do mais recente para o mais antigo dentro do mes atual.
            </p>
          </div>
          <p className="text-xs text-muted-foreground">{coverageNotice}</p>
        </div>

        <div className="overflow-hidden rounded-xl border border-border">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-secondary">
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Inicio
                </th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Cliente
                </th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Plano
                </th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Cobrança
                </th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Contrato
                </th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Fluxo
                </th>
                <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {visibleRows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-sm text-muted-foreground">
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
                  <tr key={row.id}>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      <div>{formatDateLabel(row.dataInicio)}</div>
                      <div className="text-xs text-muted-foreground">até {formatDateLabel(row.dataFim)}</div>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {row.aluno?.nome ?? "Cliente não identificado"}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <div className="font-medium">{row.plano?.nome ?? "Plano não encontrado"}</div>
                      <div className="text-xs text-muted-foreground">
                        {formatBRL(row.valorPago)} · {row.pagamento?.formaPagamento ?? row.formaPagamento}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      <div>{row.pagamento?.status ?? "Sem cobrança"}</div>
                      <div className="text-xs text-muted-foreground">
                        {formatBRL(row.pagamento?.valorFinal ?? row.valorPago)}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${getBadgeClass("contrato", contratoStatus)}`}>
                        {STATUS_CONTRATO_LABEL[contratoStatus]}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${getBadgeClass("fluxo", fluxoStatus)}`}>
                        {fluxoStatus ? STATUS_FLUXO_COMERCIAL_LABEL[fluxoStatus] : "Sem fluxo"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
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
                                await renovarMatriculaService({ tenantId, id: row.id });
                                setFeedback(`Contrato de ${row.aluno?.nome ?? "cliente"} renovado.`);
                                await load();
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
                                  await cancelarMatriculaService({ tenantId, id: row.id });
                                  setFeedback(`Contrato de ${row.aluno?.nome ?? "cliente"} cancelado.`);
                                  await load();
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

      <div className="flex items-center justify-between rounded-lg border border-border bg-card px-3 py-2">
        <p className="text-xs text-muted-foreground">
          Mostrando <span className="font-semibold text-foreground">{showingFrom}</span> até{" "}
          <span className="font-semibold text-foreground">{showingTo}</span> de{" "}
          <span className="font-semibold text-foreground">{dashboard?.contratos.totalItems ?? 0}</span> contrato(s) do mes · página{" "}
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
            Próxima
          </Button>
        </div>
      </div>
    </div>
  );
}

function MetricCard({
  label,
  value,
  helper,
}: {
  label: string;
  value: string;
  helper: string;
}) {
  return (
    <div className="rounded-3xl border border-border bg-card/90 px-5 py-5 shadow-sm">
      <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">{label}</p>
      <p className="mt-2 font-display text-3xl font-bold">{value}</p>
      <p className="mt-2 text-sm text-muted-foreground">{helper}</p>
    </div>
  );
}

function ContextCard({
  title,
  text,
}: {
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-3xl border border-border bg-secondary/30 px-5 py-5">
      <p className="text-sm font-semibold">{title}</p>
      <p className="mt-1 text-sm text-muted-foreground">{text}</p>
    </div>
  );
}
