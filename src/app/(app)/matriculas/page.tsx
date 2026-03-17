"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  cancelarMatriculaService,
  listMatriculasPageService,
  renovarMatriculaService,
} from "@/lib/comercial/runtime";
import { Plus, RefreshCcw, XCircle } from "lucide-react";
import {
  resolveContratoStatusFromPlano,
  resolveFluxoComercialStatus,
  STATUS_CONTRATO_LABEL,
  STATUS_FLUXO_COMERCIAL_LABEL,
} from "@/lib/comercial/plano-flow";
import { useTenantContext } from "@/hooks/use-session-context";
import type { Matricula } from "@/lib/types";
import { normalizeErrorMessage } from "@/lib/utils/api-error";
import { Button } from "@/components/ui/button";

const PAGE_SIZE = 20;

type MatriculaRow = Matricula;

function formatBRL(value: number) {
  const safe = Number.isFinite(value) ? value : 0;
  return safe.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatDate(value?: string) {
  if (!value) return "-";
  return new Date(`${value}T00:00:00`).toLocaleDateString("pt-BR");
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

export default function MatriculasPage() {
  const { tenantId, tenantResolved, setTenant } = useTenantContext();
  const [rows, setRows] = useState<MatriculaRow[]>([]);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [actionId, setActionId] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [metaPage, setMetaPage] = useState(0);
  const [metaSize, setMetaSize] = useState(PAGE_SIZE);
  const [totalRows, setTotalRows] = useState<number | undefined>(undefined);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [loading, setLoading] = useState(false);

  const applyLoadedData = useCallback(
    (snapshot: Awaited<ReturnType<typeof listMatriculasPageService>>) => {
      setRows(snapshot.items);
      setMetaPage(snapshot.page);
      setMetaSize(snapshot.size);
      setTotalRows(snapshot.total);
      setHasNextPage(snapshot.hasNext);
    },
    []
  );

  const loadSnapshot = useCallback(
    async (currentTenantId: string) =>
      listMatriculasPageService({
        tenantId: currentTenantId,
        page,
        size: PAGE_SIZE,
      }),
    [page]
  );

  const load = useCallback(async () => {
    if (!tenantId) return;
    setLoading(true);
    setError(null);

    try {
      const snapshot = await loadSnapshot(tenantId);
      applyLoadedData(snapshot);
    } catch (loadError) {
      const message = normalizeErrorMessage(loadError);
      const normalizedMessage = message.toLowerCase();
      const shouldRetryWithTenantSync =
        normalizedMessage.includes("x-context-id sem unidade ativa") ||
        normalizedMessage.includes("tenantid diverge da unidade ativa do contexto informado");

      if (!shouldRetryWithTenantSync) {
        setRows([]);
        setHasNextPage(false);
        setTotalRows(undefined);
        setError(message || "Não foi possível carregar os contratos da unidade ativa.");
        setLoading(false);
        return;
      }

      try {
        await setTenant(tenantId);
        const snapshot = await loadSnapshot(tenantId);
        applyLoadedData(snapshot);
      } catch (retryError) {
        setRows([]);
        setHasNextPage(false);
        setTotalRows(undefined);
        setError(normalizeErrorMessage(retryError));
      }
    } finally {
      setLoading(false);
    }
  }, [applyLoadedData, loadSnapshot, setTenant, tenantId]);

  useEffect(() => {
    setPage(0);
    setRows([]);
    setMetaPage(0);
    setMetaSize(PAGE_SIZE);
    setHasNextPage(false);
    setTotalRows(undefined);
    setFeedback(null);
    setError(null);
    setActionId(null);
  }, [tenantId]);

  useEffect(() => {
    if (!tenantResolved || !tenantId) return;
    void load();
  }, [load, tenantId, tenantResolved]);

  const pageLabel = metaPage + 1;
  const showingFrom = rows.length === 0 ? 0 : metaPage * metaSize + 1;
  const showingTo = rows.length === 0 ? 0 : metaPage * metaSize + rows.length;
  const effectiveTotal = totalRows ?? rows.length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">Contratos e assinaturas</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Contratações de plano da unidade ativa, com status comercial, cobrança e assinatura em um único lugar.
          </p>
        </div>
        <Link href="/vendas/nova">
          <Button>
            <Plus className="size-4" />
            Nova contratação
          </Button>
        </Link>
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

      <div className="overflow-hidden rounded-xl border border-border">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-secondary">
              <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Início
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
            {rows.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-10 text-center text-sm text-muted-foreground">
                  {loading ? "Carregando contratos..." : "Nenhum contrato encontrado"}
                </td>
              </tr>
            ) : null}
            {rows.map((row) => {
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
                    <div>{formatDate(row.dataInicio)}</div>
                    <div className="text-xs text-muted-foreground">até {formatDate(row.dataFim)}</div>
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

      <div className="flex items-center justify-between rounded-lg border border-border bg-card px-3 py-2">
        <p className="text-xs text-muted-foreground">
          Mostrando <span className="font-semibold text-foreground">{showingFrom}</span> até{" "}
          <span className="font-semibold text-foreground">{showingTo}</span> de{" "}
          <span className="font-semibold text-foreground">{effectiveTotal}</span> · página{" "}
          <span className="font-semibold text-foreground">{pageLabel}</span>
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
