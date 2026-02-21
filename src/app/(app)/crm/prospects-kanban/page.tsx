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
import { ProspectDetailModal } from "@/components/shared/prospect-detail-modal";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

const STATUS_COLUMNS: { key: StatusProspect; label: string; accent: string }[] = [
  { key: "NOVO", label: "Novo", accent: "bg-muted-foreground/20" },
  { key: "AGENDOU_VISITA", label: "Agendou visita", accent: "bg-gym-warning/30" },
  { key: "VISITOU", label: "Visitou", accent: "bg-blue-400/30" },
  { key: "EM_CONTATO", label: "Em contato", accent: "bg-gym-accent/30" },
  { key: "CONVERTIDO", label: "Convertido", accent: "bg-gym-teal/30" },
  { key: "PERDIDO", label: "Perdido", accent: "bg-gym-danger/30" },
];

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

export default function ProspectsKanbanPage() {
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
  const [filtroStatus, setFiltroStatus] = useState<StatusProspect | "TODOS">("TODOS");
  const [filtroResponsavel, setFiltroResponsavel] = useState<string>("TODOS");
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [selectedProspect, setSelectedProspect] = useState<Prospect | null>(null);

  async function load() {
    const [data, funcs] = await Promise.all([listProspects(), listFuncionarios()]);
    setProspects(data);
    setFuncionarios(funcs);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
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

  function handleCardClick(p: Prospect) {
    setSelectedProspect(p);
  }

  return (
    <div className="space-y-6">
      {selectedProspect && (
        <ProspectDetailModal
          prospect={selectedProspect}
          funcionarios={funcionarios}
          onClose={() => setSelectedProspect(null)}
          onChanged={() => {
            load();
            setSelectedProspect(null);
          }}
        />
      )}

      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight">
          CRM · Funil de Vendas
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Arraste cards entre etapas ou clique para ver detalhes
        </p>
      </div>

      <div className="grid grid-cols-6 gap-3">
        {byStatus.map((col) => (
          <div key={col.key} className="rounded-lg border border-border bg-card p-3">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              {col.label}
            </p>
            <p className="mt-1 font-display text-xl font-bold text-gym-accent">
              {col.items.length}
            </p>
          </div>
        ))}
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
                <SelectItem key={s.key} value={s.key}>{s.label}</SelectItem>
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
                <SelectItem key={f.id} value={f.id}>{f.nome}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Kanban board */}
      <div className="grid grid-cols-6 gap-3">
        {byStatus.map((col) => (
          <div
            key={col.key}
            className={cn(
              "rounded-xl border border-border bg-card transition-colors",
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
            {/* Column header */}
            <div className="flex items-center justify-between border-b border-border px-3 py-2.5">
              <div className="flex items-center gap-2">
                <span className={cn("h-1.5 w-1.5 rounded-full", col.accent.replace("/30", ""))} />
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {col.label}
                </span>
              </div>
              <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-secondary px-1 text-[10px] font-bold text-muted-foreground">
                {col.items.length}
              </span>
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
  );
}
