"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  cancelarMatriculaService,
  listMatriculasService,
  listPagamentosService,
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
import type { Aluno, Matricula, Pagamento, Plano } from "@/lib/types";
import { Button } from "@/components/ui/button";

type MatriculaRow = Matricula & {
  aluno?: Aluno;
  plano?: Plano;
  pagamento?: Pagamento;
};

function formatBRL(value: number) {
  const safe = Number.isFinite(value) ? value : 0;
  return safe.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatDate(value: string) {
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
  const { tenantId, tenantResolved } = useTenantContext();
  const [rows, setRows] = useState<MatriculaRow[]>([]);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [actionId, setActionId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!tenantId) return;
    try {
      const [matriculas, pagamentos] = await Promise.all([
        listMatriculasService({
          tenantId,
          page: 0,
          size: 500,
        }),
        listPagamentosService({
          tenantId,
          page: 0,
          size: 500,
        }),
      ]);
      setRows(
        matriculas.map((matricula) => ({
          ...matricula,
          pagamento: pagamentos.find((pagamento) => pagamento.matriculaId === matricula.id),
        }))
      );
      setError(null);
    } catch {
      setRows([]);
      setError("Não foi possível carregar os contratos da unidade ativa.");
    }
  }, [tenantId]);

  useEffect(() => {
    if (!tenantResolved || !tenantId) return;
    void load();
  }, [load, tenantId, tenantResolved]);

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
                  Nenhum contrato encontrado
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
                      {formatBRL(row.valorPago)} · {row.formaPagamento}
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
                          disabled={actionId === row.id}
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
                          disabled={actionId === row.id}
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
    </div>
  );
}
