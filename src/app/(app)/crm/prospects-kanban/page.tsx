"use client";

import { useEffect, useMemo, useState } from "react";
import {
  listProspects,
  updateProspectStatus,
  marcarProspectPerdido,
  listFuncionarios,
} from "@/lib/mock/services";
import type { Prospect, StatusProspect, Funcionario } from "@/lib/types";
import { StatusBadge } from "@/components/shared/status-badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

const STATUS_COLUMNS: { key: StatusProspect; label: string }[] = [
  { key: "NOVO", label: "Novo" },
  { key: "EM_CONTATO", label: "Em contato" },
  { key: "AGENDOU_VISITA", label: "Agendou visita" },
  { key: "VISITOU", label: "Visitou" },
  { key: "CONVERTIDO", label: "Convertido" },
  { key: "PERDIDO", label: "Perdido" },
];

const NEXT_STATUS: Record<StatusProspect, StatusProspect | null> = {
  NOVO: "EM_CONTATO",
  EM_CONTATO: "AGENDOU_VISITA",
  AGENDOU_VISITA: "VISITOU",
  VISITOU: "CONVERTIDO",
  CONVERTIDO: null,
  PERDIDO: null,
};

function formatDate(d: string) {
  return new Date(d + "T00:00:00").toLocaleDateString("pt-BR");
}

export default function ProspectsKanbanPage() {
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
  const [filtroStatus, setFiltroStatus] = useState<StatusProspect | "TODOS">("TODOS");
  const [filtroResponsavel, setFiltroResponsavel] = useState<string>("TODOS");
  const [draggingId, setDraggingId] = useState<string | null>(null);

  async function load() {
    const [data, funcs] = await Promise.all([listProspects(), listFuncionarios()]);
    setProspects(data);
    setFuncionarios(funcs);
  }

  useEffect(() => {
    load();
  }, []);

  const funcionariosMap = useMemo(() => {
    return new Map(funcionarios.map((f) => [f.id, f.nome]));
  }, [funcionarios]);

  const filtered = prospects.filter((p) => {
    const matchStatus = filtroStatus === "TODOS" || p.status === filtroStatus;
    const matchResp =
      filtroResponsavel === "TODOS" ||
      (filtroResponsavel === "SEM_RESP" && !p.responsavelId) ||
      p.responsavelId === filtroResponsavel;
    return matchStatus && matchResp;
  });

  const byStatus = STATUS_COLUMNS.map((col) => ({
    ...col,
    items: filtered.filter((p) => p.status === col.key),
  }));

  async function handleAdvance(p: Prospect) {
    const next = NEXT_STATUS[p.status];
    if (!next) return;
    await updateProspectStatus(p.id, next);
    load();
  }

  async function handleSetStatus(id: string, status: StatusProspect) {
    if (status === "PERDIDO") {
      const motivo = prompt("Motivo da perda (opcional):");
      await marcarProspectPerdido(id, motivo ?? undefined);
      load();
      return;
    }
    await updateProspectStatus(id, status);
    load();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight">
          CRM · Funil de Vendas
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Arraste cards entre etapas para evoluir o status
        </p>
      </div>

      <div className="flex items-center gap-3">
        <div className="w-44">
          <Select
            value={filtroStatus}
            onValueChange={(v) => setFiltroStatus(v as StatusProspect | "TODOS")}
          >
            <SelectTrigger className="w-full bg-secondary border-border text-xs">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent className="bg-card border-border">
              <SelectItem value="TODOS">Todos status</SelectItem>
              {STATUS_COLUMNS.map((s) => (
                <SelectItem key={s.key} value={s.key}>
                  {s.label}
                </SelectItem>
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
              <SelectItem value="TODOS">Todos responsáveis</SelectItem>
              <SelectItem value="SEM_RESP">Sem responsável</SelectItem>
              {funcionarios.map((f) => (
                <SelectItem key={f.id} value={f.id}>
                  {f.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-6 gap-4">
        {byStatus.map((col) => (
          <div
            key={col.key}
            className={cn(
              "rounded-xl border border-border bg-card",
              draggingId && "ring-1 ring-gym-accent/30"
            )}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const id = e.dataTransfer.getData("text/plain");
              if (id) handleSetStatus(id, col.key);
              setDraggingId(null);
            }}
          >
            <div className="flex items-center justify-between border-b border-border px-3 py-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {col.label}
              </span>
              <span className="text-xs text-muted-foreground">
                {col.items.length}
              </span>
            </div>
            <div className="space-y-2 p-3">
              {col.items.length === 0 && (
                <div className="rounded-lg border border-dashed border-border/70 p-3 text-center text-xs text-muted-foreground">
                  Sem prospects
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
                  className="rounded-lg border border-border bg-secondary/40 p-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold">{p.nome}</p>
                      <p className="text-xs text-muted-foreground">
                        {p.telefone}
                        {p.email ? ` · ${p.email}` : ""}
                      </p>
                    </div>
                    <StatusBadge status={p.status} />
                  </div>
                  <div className="mt-2 text-xs text-muted-foreground">
                    {p.origem} · criado {formatDate(p.dataCriacao)}
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    Resp: {p.responsavelId ? funcionariosMap.get(p.responsavelId) : "—"}
                  </div>

                  <div className="mt-3 flex items-center gap-2">
                    <Select
                      value={p.status}
                      onValueChange={(v) =>
                        handleSetStatus(p.id, v as StatusProspect)
                      }
                    >
                      <SelectTrigger className="h-8 w-full bg-card border-border text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-card border-border">
                        {STATUS_COLUMNS.map((s) => (
                          <SelectItem key={s.key} value={s.key}>
                            {s.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {NEXT_STATUS[p.status] && (
                      <button
                        onClick={() => handleAdvance(p)}
                        className={cn(
                          "rounded border border-border px-2 py-1 text-[11px] text-muted-foreground hover:text-foreground"
                        )}
                      >
                        Avançar
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
