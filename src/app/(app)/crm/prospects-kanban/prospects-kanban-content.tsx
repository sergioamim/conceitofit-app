"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import {
  listCrmTasksApi,
  listProspectsApi,
  marcarProspectPerdidoApi,
  updateProspectStatusApi,
} from "@/lib/api/crm";
import { listFuncionariosApi } from "@/lib/api/administrativo";
import { getActiveTenantIdFromSession } from "@/lib/api/session";
import { canTransitionProspectStatus } from "@/lib/tenant/crm/prospect-status";
import type { CrmPipelineStage, Funcionario, Prospect, StatusProspect } from "@/lib/types";
import { buildDefaultCrmPipelineStages } from "@/lib/tenant/crm/workspace";
import { enrichCrmTasksRuntime, normalizeProspectRuntime } from "@/lib/tenant/crm/runtime";
import { useTenantContext } from "@/lib/tenant/hooks/use-session-context";
import { StatusBadge } from "@/components/shared/status-badge";
const ProspectDetailModal = dynamic(
  () => import("@/components/shared/prospect-detail-modal").then((mod) => mod.ProspectDetailModal),
  { ssr: false }
);
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { FILTER_ALL } from "@/lib/shared/constants/filters";

const ORIGEM_LABEL: Record<string, string> = {
  VISITA_PRESENCIAL: "Presencial",
  WHATSAPP: "WhatsApp",
  INSTAGRAM: "Instagram",
  FACEBOOK: "Facebook",
  INDICACAO: "Indicação",
  SITE: "Site",
  OUTROS: "Outros",
};

function formatDate(d: string) {
  return new Date(d + "T00:00:00").toLocaleDateString("pt-BR");
}

function nowDateTime() {
  return new Date().toISOString().slice(0, 19);
}

export function ProspectsKanbanContent() {
  const tenantContext = useTenantContext();
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
  const [stages, setStages] = useState<CrmPipelineStage[]>([]);
  const [openTasksByStage, setOpenTasksByStage] = useState<Record<string, number>>({});
  const [filtroStatus, setFiltroStatus] = useState<StatusProspect | typeof FILTER_ALL>(FILTER_ALL);
  const [filtroResponsavel, setFiltroResponsavel] = useState<string>(FILTER_ALL);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [selectedProspect, setSelectedProspect] = useState<Prospect | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const tenantId = tenantContext.tenantId || getActiveTenantIdFromSession() || "";

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [prospectRows, funcs, crmTaskRows] = await Promise.all([
        listProspectsApi({ tenantId }),
        listFuncionariosApi(true),
        listCrmTasksApi({ tenantId }),
      ]);
      const normalizedProspects = prospectRows
        .map((prospect) => normalizeProspectRuntime(prospect))
        .sort((a, b) => b.dataCriacao.localeCompare(a.dataCriacao));
      const enrichedTasks = enrichCrmTasksRuntime({
        tasks: crmTaskRows,
        prospects: normalizedProspects,
        funcionarios: funcs,
      });
      const pipelineStages = buildDefaultCrmPipelineStages(
        tenantId || normalizedProspects[0]?.tenantId || enrichedTasks[0]?.tenantId || "tenant-runtime"
      );
      const taskMap = pipelineStages.reduce<Record<string, number>>((accumulator, stage) => {
        accumulator[stage.status] = enrichedTasks.filter(
          (task) =>
            task.stageStatus === stage.status &&
            !["CONCLUIDA", "CANCELADA"].includes(task.status)
        ).length;
        return accumulator;
      }, {});
      setProspects(normalizedProspects);
      setFuncionarios(funcs);
      setStages(pipelineStages);
      setOpenTasksByStage(taskMap);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Falha ao carregar pipeline comercial.");
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    setSelectedProspect((current) =>
      current ? prospects.find((prospect) => prospect.id === current.id) ?? current : null
    );
  }, [prospects]);

  const funcionariosMap = useMemo(() => {
    return new Map(funcionarios.map((f) => [f.id, f.nome]));
  }, [funcionarios]);

  const filtered = useMemo(
    () =>
      prospects.filter((p) => {
        const matchStatus = filtroStatus === FILTER_ALL || p.status === filtroStatus;
        const matchResp =
          filtroResponsavel === FILTER_ALL ||
          (filtroResponsavel === "SEM_RESP" && !p.responsavelId) ||
          p.responsavelId === filtroResponsavel;
        return matchStatus && matchResp;
      }),
    [filtroResponsavel, filtroStatus, prospects]
  );

  const byStatus = stages.map((stage) => ({
    ...stage,
    items: filtered.filter((p) => p.status === stage.status),
    taskCount: openTasksByStage[stage.status] ?? 0,
  }));

  async function handleSetStatus(id: string, status: StatusProspect) {
    if (!tenantId) return;
    const current = prospects.find((item) => item.id === id);
    if (!current) return;
    if (!canTransitionProspectStatus(current.status, status)) {
      setError("Mova o prospect apenas para a proxima etapa valida do funil.");
      return;
    }
    const motivo = status === "PERDIDO" ? prompt("Motivo da perda (opcional):") : undefined;
    if (status === "PERDIDO" && motivo === null) {
      return;
    }
    const at = nowDateTime();

    setProspects((prev) =>
      prev.map((item) =>
        item.id === id
          ? normalizeProspectRuntime(
              {
                ...item,
                status,
                dataUltimoContato: at,
                motivoPerda: status === "PERDIDO" ? motivo || undefined : undefined,
              },
              item
            )
          : item
      )
    );

    try {
      const updated =
        status === "PERDIDO"
          ? await marcarProspectPerdidoApi({
              tenantId,
              id,
              motivo: motivo || undefined,
            })
          : await updateProspectStatusApi({
              tenantId,
              id,
              status,
            });

      setProspects((prev) =>
        prev.map((item) => (item.id === id ? normalizeProspectRuntime(updated, item) : item))
      );
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Falha ao atualizar etapa do prospect.");
      await load();
    }
  }

  function handleCardClick(p: Prospect) {
    setSelectedProspect(p);
  }

  return (
    <div className="space-y-6">
      {selectedProspect && (
        <ProspectDetailModal
          key={selectedProspect.id}
          prospect={selectedProspect}
          funcionarios={funcionarios}
          onClose={() => setSelectedProspect(null)}
          onChanged={() => {
            void load();
            setSelectedProspect(null);
          }}
        />
      )}

      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight">
          CRM · Funil de Vendas
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Arraste cards entre etapas, acompanhe o SLA e clique para abrir o detalhe do prospect.
        </p>
      </div>

      {error ? (
        <div className="rounded-xl border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
          {error}
        </div>
      ) : null}

      <div className="overflow-x-auto">
        <div className="grid min-w-[1080px] grid-cols-6 gap-3">
          {byStatus.map((col) => (
            <div key={col.id} className="rounded-lg border border-border bg-card p-3">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                {col.nome}
              </p>
              <p className="mt-1 font-display text-xl font-bold text-gym-accent">
                {col.items.length}
              </p>
              <p className="mt-1 text-[11px] text-muted-foreground">
                {col.taskCount} tarefa(s) aberta(s)
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="w-44">
          <Select
            value={filtroStatus}
            onValueChange={(v) => setFiltroStatus(v as StatusProspect | typeof FILTER_ALL)}
          >
            <SelectTrigger className="w-full bg-secondary border-border text-xs">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent className="bg-card border-border">
              <SelectItem value={FILTER_ALL}>Todos status</SelectItem>
              {stages.map((stage) => (
                <SelectItem key={stage.id} value={stage.status}>{stage.nome}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="w-56">
          <Select
            value={filtroResponsavel}
            onValueChange={(v) => setFiltroResponsavel(v)}
          >
            <SelectTrigger className="w-full bg-secondary border-border text-xs">
              <SelectValue placeholder="Responsável" />
            </SelectTrigger>
            <SelectContent className="bg-card border-border">
              <SelectItem value={FILTER_ALL}>Todos responsáveis</SelectItem>
              <SelectItem value="SEM_RESP">Sem responsável</SelectItem>
              {funcionarios.map((f) => (
                <SelectItem key={f.id} value={f.id}>{f.nome}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {loading ? (
        <div className="rounded-xl border border-dashed border-border/70 px-4 py-10 text-center text-sm text-muted-foreground">
          Carregando pipeline comercial...
        </div>
      ) : byStatus.every((column) => column.items.length === 0) ? (
        <div className="rounded-xl border border-dashed border-border/70 px-4 py-10 text-center text-sm text-muted-foreground">
          Nenhum prospect encontrado para os filtros atuais.
        </div>
      ) : (
      <div className="overflow-x-auto">
        <div className="grid min-w-[1080px] grid-cols-6 gap-3">
          {byStatus.map((col) => (
            <div
              key={col.id}
              className={cn(
                "rounded-xl border border-border bg-card transition-colors",
                draggingId && "ring-1 ring-gym-accent/30"
              )}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const id = e.dataTransfer.getData("text/plain");
                if (id) handleSetStatus(id, col.status);
                setDraggingId(null);
              }}
            >
              {/* Column header */}
              <div className="flex items-center justify-between border-b border-border px-3 py-2.5">
                <div className="flex items-center gap-2">
                  <span className={cn("h-1.5 w-1.5 rounded-full", col.accentClass?.replace("/20", "") ?? "bg-gym-accent")} />
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {col.nome}
                  </span>
                </div>
                <div className="text-right">
                  <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-secondary px-1 text-[10px] font-bold text-muted-foreground">
                    {col.items.length}
                  </span>
                  <p className="mt-1 text-[10px] text-muted-foreground">SLA {col.slaHoras}h</p>
                </div>
              </div>

              {/* Cards */}
              <div className="space-y-2 p-2">
                {col.items.length === 0 && (
                  <div className="rounded-lg border border-dashed border-border/50 p-3 text-center text-[11px] text-muted-foreground/60">
                    Solte aqui
                  </div>
                )}
                {col.items.map((p) => (
                  <div
                    key={p.id}
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData("text/plain", p.id);
                      setDraggingId(p.id);
                    }}
                    onDragEnd={() => setDraggingId(null)}
                    onClick={() => handleCardClick(p)}
                    className={cn(
                      "cursor-pointer rounded-lg border border-border bg-secondary/40 p-3 transition-all",
                      "hover:border-gym-accent/40 hover:bg-secondary/70 hover:shadow-sm",
                      draggingId === p.id && "opacity-40"
                    )}
                  >
                    <p className="text-sm font-semibold leading-snug">{p.nome}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{p.telefone}</p>

                    <div className="mt-2 flex flex-wrap items-center gap-1.5">
                      <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] text-muted-foreground">
                        {ORIGEM_LABEL[p.origem] ?? p.origem}
                      </span>
                      <StatusBadge status={p.status} />
                    </div>

                    <div className="mt-2 flex items-center justify-between text-[10px] text-muted-foreground">
                      <span>{formatDate(p.dataCriacao)}</span>
                      <span>{p.responsavelId ? funcionariosMap.get(p.responsavelId) : "—"}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
      )}
    </div>
  );
}
