"use client";

import { useCallback, useEffect, useState } from "react";
import { Play, Square, AlertTriangle, CheckCircle2, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  listCrmCadenceExecutionsApi,
  cancelCrmCadenceExecutionApi,
  processOverdueCadenceTasksApi,
} from "@/lib/api/crm-cadencias";
import type { CrmCadenceExecution, CrmCadenceExecutionStatus } from "@/lib/types";
import { formatDateTime } from "@/lib/formatters";
import {
  CRM_CADENCE_EXECUTION_STATUS_LABEL,
} from "@/lib/tenant/crm/workspace";

const STATUS_ICON: Record<CrmCadenceExecutionStatus, typeof Clock> = {
  EM_ANDAMENTO: Play,
  CONCLUIDA: CheckCircle2,
  CANCELADA: Square,
  ESCALADA: AlertTriangle,
};

const STATUS_CLASS: Record<CrmCadenceExecutionStatus, string> = {
  EM_ANDAMENTO: "bg-gym-accent/15 text-gym-accent",
  CONCLUIDA: "bg-gym-teal/15 text-gym-teal",
  CANCELADA: "bg-secondary text-muted-foreground",
  ESCALADA: "bg-gym-warning/15 text-gym-warning",
};

export function CadenceExecutionsPanel({ tenantId }: { tenantId: string }) {
  const [executions, setExecutions] = useState<CrmCadenceExecution[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!tenantId) return;
    setLoading(true);
    try {
      setExecutions(await listCrmCadenceExecutionsApi({ tenantId }));
    } catch {
      // Cadências podem não estar disponíveis no backend
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  useEffect(() => { void load(); }, [load]);

  async function handleProcessOverdue() {
    if (!tenantId) return;
    setProcessing(true);
    try {
      const result = await processOverdueCadenceTasksApi({ tenantId });
      alert(`Processado: ${result.processed} tarefa(s), ${result.escalated} escalação(ões).`);
      await load();
    } catch {
      alert("Não foi possível processar tarefas vencidas.");
    } finally {
      setProcessing(false);
    }
  }

  async function handleCancel(executionId: string) {
    if (!tenantId || !confirm("Cancelar esta execução de cadência?")) return;
    setCancellingId(executionId);
    try {
      await cancelCrmCadenceExecutionApi({ tenantId, id: executionId });
      await load();
    } catch {
      alert("Não foi possível cancelar a execução.");
    } finally {
      setCancellingId(null);
    }
  }

  const active = executions.filter((e) => e.status === "EM_ANDAMENTO");
  const recent = executions.filter((e) => e.status !== "EM_ANDAMENTO").slice(0, 5);

  if (loading) {
    return (
      <div className="rounded-xl border border-border bg-card p-5">
        <div className="h-8 w-48 animate-pulse rounded bg-secondary" />
        <div className="mt-3 space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-12 animate-pulse rounded-lg bg-secondary/40" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-base font-semibold">Cadências em execução</h2>
          <p className="text-xs text-muted-foreground">{active.length} ativa(s) · {executions.length} total</p>
        </div>
        <Button variant="outline" size="sm" onClick={handleProcessOverdue} disabled={processing} className="border-border text-xs">
          {processing ? "Processando..." : "Processar vencidas"}
        </Button>
      </div>

      {active.length === 0 && recent.length === 0 ? (
        <p className="py-4 text-center text-sm text-muted-foreground">
          Nenhuma cadência em execução. Cadências são disparadas automaticamente ao criar prospects ou mudar etapas.
        </p>
      ) : null}

      {active.length > 0 ? (
        <div className="space-y-2">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Em andamento</p>
          {active.map((exec) => {
            const Icon = STATUS_ICON[exec.status];
            return (
              <div key={exec.id} className="flex items-center justify-between gap-3 rounded-lg border border-border bg-secondary/20 px-3 py-2.5">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <Icon className="size-4 text-gym-accent shrink-0" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{exec.cadenciaNome ?? "Cadência"}</p>
                    <p className="text-xs text-muted-foreground">
                      {exec.prospectNome ?? exec.prospectId} · Etapa {(exec.passos ?? []).filter(p => p.status === "EXECUTADO").length}/{(exec.passos ?? []).length}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[10px] text-muted-foreground">{formatDateTime(exec.iniciadoEm)}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs text-gym-danger"
                    onClick={() => handleCancel(exec.id)}
                    disabled={cancellingId === exec.id}
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      ) : null}

      {recent.length > 0 ? (
        <div className="space-y-2">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Recentes</p>
          {recent.map((exec) => {
            const statusLabel = CRM_CADENCE_EXECUTION_STATUS_LABEL[exec.status] ?? exec.status;
            const statusClass = STATUS_CLASS[exec.status] ?? "bg-secondary text-muted-foreground";
            return (
              <div key={exec.id} className="flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm">{exec.cadenciaNome ?? "Cadência"}</p>
                  <p className="text-xs text-muted-foreground">{exec.prospectNome ?? exec.prospectId}</p>
                </div>
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${statusClass}`}>
                  {statusLabel}
                </span>
              </div>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
