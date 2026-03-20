"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Plus, RefreshCcw, XCircle } from "lucide-react";
import {
  cancelarMatriculaService,
  listMatriculasPageService,
  renovarMatriculaService,
} from "@/lib/comercial/runtime";
import {
  buildMatriculasMonthlySnapshot,
  buildMonthKeyFromDate,
  formatDateLabel,
  formatMonthLabel,
  listAvailableMonthKeys,
  sortMatriculasByRecency,
  type MatriculaActiveGroup,
  type MatriculaInsightRow,
} from "@/lib/comercial/matriculas-insights";
import {
  resolveContratoStatusFromPlano,
  resolveFluxoComercialStatus,
  STATUS_CONTRATO_LABEL,
  STATUS_FLUXO_COMERCIAL_LABEL,
} from "@/lib/comercial/plano-flow";
import { useTenantContext } from "@/hooks/use-session-context";
import { normalizeErrorMessage } from "@/lib/utils/api-error";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const PAGE_SIZE = 20;
const FETCH_SIZE = 200;
const PIE_COLORS = [
  "var(--color-chart-1)",
  "var(--color-chart-2)",
  "var(--color-chart-3)",
  "var(--color-chart-4)",
  "var(--color-chart-5)",
];

function formatBRL(value: number) {
  const safe = Number.isFinite(value) ? value : 0;
  return safe.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

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

function buildPieGradient(groups: MatriculaActiveGroup[]) {
  if (groups.length === 0) {
    return "conic-gradient(var(--muted) 0deg 360deg)";
  }

  let current = 0;
  const segments = groups.map((group, index) => {
    const size = (group.percentage / 100) * 360;
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

export default function MatriculasPage() {
  const { tenantId, tenantResolved, setTenant } = useTenantContext();
  const [rows, setRows] = useState<MatriculaInsightRow[]>([]);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [actionId, setActionId] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [totalRows, setTotalRows] = useState<number | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const [selectedMonthKey, setSelectedMonthKey] = useState("");

  useEffect(() => {
    setSelectedMonthKey(buildMonthKeyFromDate(new Date()));
  }, []);

  const loadSnapshot = useCallback(
    async (currentTenantId: string) =>
      listMatriculasPageService({
        tenantId: currentTenantId,
        page: 0,
        size: FETCH_SIZE,
      }),
    []
  );

  const load = useCallback(async () => {
    if (!tenantId) return;
    setLoading(true);
    setError(null);

    try {
      const snapshot = await loadSnapshot(tenantId);
      setRows(sortMatriculasByRecency(snapshot.items));
      setTotalRows(snapshot.total);
    } catch (loadError) {
      const message = normalizeErrorMessage(loadError);
      const normalizedMessage = message.toLowerCase();
      const shouldRetryWithTenantSync =
        normalizedMessage.includes("x-context-id sem unidade ativa") ||
        normalizedMessage.includes("tenantid diverge da unidade ativa do contexto informado");

      if (!shouldRetryWithTenantSync) {
        setRows([]);
        setTotalRows(undefined);
        setError(message || "Não foi possível carregar os contratos da unidade ativa.");
        setLoading(false);
        return;
      }

      try {
        await setTenant(tenantId);
        const snapshot = await loadSnapshot(tenantId);
        setRows(sortMatriculasByRecency(snapshot.items));
        setTotalRows(snapshot.total);
      } catch (retryError) {
        setRows([]);
        setTotalRows(undefined);
        setError(normalizeErrorMessage(retryError));
      }
    } finally {
      setLoading(false);
    }
  }, [loadSnapshot, setTenant, tenantId]);

  useEffect(() => {
    setPage(0);
    setRows([]);
    setTotalRows(undefined);
    setFeedback(null);
    setError(null);
    setActionId(null);
  }, [tenantId]);

  useEffect(() => {
    if (!tenantResolved || !tenantId) return;
    void load();
  }, [load, tenantId, tenantResolved]);

  const snapshot = useMemo(
    () => buildMatriculasMonthlySnapshot(rows, selectedMonthKey),
    [selectedMonthKey, rows]
  );

  const availableMonthKeys = useMemo(
    () => listAvailableMonthKeys(rows, selectedMonthKey),
    [rows, selectedMonthKey]
  );

  const visibleRows = useMemo(() => {
    const start = page * PAGE_SIZE;
    return snapshot.monthRows.slice(start, start + PAGE_SIZE);
  }, [page, snapshot.monthRows]);

  const hasNextPage = (page + 1) * PAGE_SIZE < snapshot.monthRows.length;
  const showingFrom = visibleRows.length === 0 ? 0 : page * PAGE_SIZE + 1;
  const showingTo = visibleRows.length === 0 ? 0 : page * PAGE_SIZE + visibleRows.length;
  const visibleMonthLabel = formatMonthLabel(selectedMonthKey);
  const coverageNotice =
    typeof totalRows === "number" && totalRows > rows.length
      ? `Visao de ${visibleMonthLabel} baseada nos ${rows.length} contratos mais recentes carregados.`
      : `Visao de ${visibleMonthLabel} baseada em todos os contratos carregados da unidade ativa.`;

  useEffect(() => {
    setPage(0);
  }, [selectedMonthKey]);

  return (
    <div className="space-y-6">
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
              min={availableMonthKeys[availableMonthKeys.length - 1]}
              max={availableMonthKeys[0]}
              onChange={(event) => setSelectedMonthKey(event.target.value)}
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

      {error ? (
        <div className="rounded-md border border-gym-danger/30 bg-gym-danger/10 px-4 py-3 text-sm text-gym-danger">
          {error}
        </div>
      ) : null}

      <section className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              label={`Contratos em ${visibleMonthLabel}`}
              value={loading && !selectedMonthKey ? "…" : String(snapshot.totalContracts)}
              helper="recorte dos contratos mais recentes do mes selecionado"
            />
            <MetricCard
              label="Receita contratada"
              value={formatBRL(snapshot.contractedRevenue)}
              helper="somatorio dos contratos do mes"
            />
            <MetricCard
              label="Valor medio do contrato"
              value={formatBRL(snapshot.averageTicket)}
              helper="ticket medio do recorte mensal"
            />
            <MetricCard
              label="Carteira ativa"
              value={formatPercentage(snapshot.activePercentage)}
              helper={`${snapshot.activeContracts} contrato(s) ativos no mes`}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <ContextCard
              title="Leitura sugerida"
              text={snapshot.insight}
            />
            <ContextCard
              title="Ponto de atencao"
              text={
                snapshot.pendingSignature > 0
                  ? `${snapshot.pendingSignature} contrato(s) ainda aguardam assinatura no mes.`
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
                style={{ background: buildPieGradient(snapshot.activeGroups) }}
                aria-label="Grafico em pizza da carteira ativa"
              >
                <div className="absolute inset-[22%] rounded-full border border-border bg-card shadow-inner" />
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="text-[11px] uppercase tracking-wide text-muted-foreground">ativos</span>
                  <strong className="font-display text-3xl">{snapshot.activeContracts}</strong>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              {snapshot.activeGroups.length === 0 ? (
                <p className="rounded-2xl border border-dashed border-border px-4 py-6 text-sm text-muted-foreground">
                  Nenhum contrato ativo para montar a pizza neste mes.
                </p>
              ) : (
                snapshot.activeGroups.map((group, index) => (
                  <div key={group.label} className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-background px-4 py-3">
                    <div className="flex items-center gap-3">
                      <span
                        className="size-3 rounded-full"
                        style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }}
                        aria-hidden="true"
                      />
                      <div>
                        <p className="text-sm font-semibold">{group.label}</p>
                        <p className="text-xs text-muted-foreground">{group.count} contrato(s) ativos</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold">{formatPercentage(group.percentage)}</p>
                      <p className="text-xs text-muted-foreground">{formatBRL(group.value)}</p>
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
                            onClick={async () => {
                              if (!tenantId) return;
                              const confirmed = window.confirm("Cancelar esta contratação?");
                              if (!confirmed) return;
                              setActionId(row.id);
                              try {
                                await cancelarMatriculaService({ tenantId, id: row.id });
                                setFeedback(`Contrato de ${row.aluno?.nome ?? "cliente"} cancelado.`);
                                await load();
                              } finally {
                                setActionId(null);
                              }
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
          <span className="font-semibold text-foreground">{snapshot.totalContracts}</span> contrato(s) do mes · página{" "}
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
