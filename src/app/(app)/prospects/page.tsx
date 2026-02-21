"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Search, Plus, ChevronDown } from "lucide-react";
import {
  listProspects,
  createProspect,
  updateProspect,
  updateProspectStatus,
  marcarProspectPerdido,
  deleteProspect,
  checkProspectDuplicate,
  listFuncionarios,
} from "@/lib/mock/services";
import { StatusBadge } from "@/components/shared/status-badge";
import { MonthYearPicker } from "@/components/shared/month-year-picker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ProspectModal } from "@/components/shared/prospect-modal";
import { ProspectTimelineModal } from "@/components/shared/prospect-timeline-modal";
import type {
  Prospect,
  StatusProspect,
  OrigemProspect,
  CreateProspectInput,
  Funcionario,
} from "@/lib/types";
import { maskPhone } from "@/lib/utils";

const STATUS_OPTIONS: { value: StatusProspect | "TODOS"; label: string }[] = [
  { value: "TODOS", label: "Todos" },
  { value: "NOVO", label: "Novo" },
  { value: "EM_CONTATO", label: "Em contato" },
  { value: "AGENDOU_VISITA", label: "Agendou visita" },
  { value: "VISITOU", label: "Visitou" },
  { value: "CONVERTIDO", label: "Convertido" },
  { value: "PERDIDO", label: "Perdido" },
];

const STATUS_LABELS: { value: StatusProspect; label: string }[] = [
  { value: "NOVO", label: "Novos" },
  { value: "EM_CONTATO", label: "Em contato" },
  { value: "AGENDOU_VISITA", label: "Agendou visita" },
  { value: "VISITOU", label: "Visitou" },
  { value: "CONVERTIDO", label: "Convertido" },
  { value: "PERDIDO", label: "Perdido" },
];

const ORIGEM_LABELS: Record<OrigemProspect, string> = {
  VISITA_PRESENCIAL: "Visita presencial",
  WHATSAPP: "WhatsApp",
  INSTAGRAM: "Instagram",
  FACEBOOK: "Facebook",
  INDICACAO: "Indicação",
  SITE: "Site",
  OUTROS: "Outros",
};

const STATUS_PROGRESSION: StatusProspect[] = [
  "NOVO",
  "EM_CONTATO",
  "AGENDOU_VISITA",
  "VISITOU",
];

export default function ProspectsPage() {
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
  const [filtroStatus, setFiltroStatus] = useState<StatusProspect | "TODOS">("TODOS");
  const [filtroOrigem, setFiltroOrigem] = useState<OrigemProspect | "TODAS">("TODAS");
  const [busca, setBusca] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Prospect | null>(null);
  const [timeline, setTimeline] = useState<Prospect | null>(null);
  const [mes, setMes] = useState(new Date().getMonth());
  const [ano, setAno] = useState(new Date().getFullYear());

  async function load() {
    const [data, funcs] = await Promise.all([listProspects(), listFuncionarios()]);
    setProspects(data);
    setFuncionarios(funcs);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, []);

  const buscaDigits = busca.replace(/\D/g, "");
  const prospectsByMonth = prospects.filter((p) => {
    const d = new Date(p.dataCriacao);
    return d.getFullYear() === ano && d.getMonth() === mes;
  });

  const filtered = prospectsByMonth.filter((p) => {
    const matchStatus = filtroStatus === "TODOS" || p.status === filtroStatus;
    const matchOrigem = filtroOrigem === "TODAS" || p.origem === filtroOrigem;
    const matchBusca =
      !busca ||
      p.nome.toLowerCase().includes(busca.toLowerCase()) ||
      (buscaDigits &&
        p.telefone.replace(/\D/g, "").includes(buscaDigits));
    return matchStatus && matchOrigem && matchBusca;
  });

  const statusTotals = (() => {
    const totals: Record<StatusProspect, number> = {
      NOVO: 0,
      EM_CONTATO: 0,
      AGENDOU_VISITA: 0,
      VISITOU: 0,
      CONVERTIDO: 0,
      PERDIDO: 0,
    };

    prospectsByMonth.forEach((p) => {
      totals[p.status] += 1;
    });

    return totals;
  })();

  async function handleSave(data: CreateProspectInput) {
    const isDup = await checkProspectDuplicate({
      telefone: data.telefone,
      cpf: data.cpf,
      email: data.email,
    });
    if (isDup) {
      alert("Já existe prospect com este telefone, CPF ou e-mail.");
      return;
    }
    await createProspect(data);
    load();
  }

  async function handleEditSave(data: CreateProspectInput) {
    if (!editing) return;
    await updateProspect(editing.id, {
      ...data,
      responsavelId: data.responsavelId || undefined,
    });
    setEditing(null);
    load();
  }

  async function handleStatus(id: string, status: StatusProspect) {
    await updateProspectStatus(id, status);
    load();
  }

  async function handleDelete(id: string) {
    if (!confirm("Remover este prospect?")) return;
    await deleteProspect(id);
    load();
  }

  async function handlePerdido(id: string) {
    const motivo = prompt("Motivo da perda (opcional):");
    await marcarProspectPerdido(id, motivo ?? undefined);
    load();
  }

  function formatDate(d: string) {
    return new Date(d).toLocaleDateString("pt-BR");
  }

  return (
    <div className="space-y-6">
      <ProspectModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
        funcionarios={funcionarios}
      />
      <ProspectModal
        open={!!editing}
        onClose={() => setEditing(null)}
        onSave={handleEditSave}
        funcionarios={funcionarios}
        initial={editing}
      />
      <ProspectTimelineModal
        prospect={timeline}
        onClose={() => setTimeline(null)}
      />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">
            Prospects
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Gerencie leads e converta em clientes
          </p>
        </div>
        <Button onClick={() => setModalOpen(true)}>
          <Plus className="size-4" />
          Novo Prospect
        </Button>
      </div>

      {/* Totals by status */}
      <div className="grid grid-cols-6 gap-3">
        {STATUS_LABELS.map((s) => (
          <div
            key={s.value}
            className="rounded-lg border border-border bg-card p-3"
          >
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              {s.label}
            </p>
            <p className="mt-1 font-display text-xl font-bold text-gym-accent">
              {statusTotals[s.value]}
            </p>
          </div>
        ))}
      </div>

      <div className="relative w-60">
        <Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar por nome ou telefone..."
          value={busca}
          onChange={(e) => {
            const raw = e.target.value;
            const hasLetters = /[a-zA-Z@]/.test(raw);
            if (hasLetters) {
              setBusca(raw);
              return;
            }
            setBusca(maskPhone(raw));
          }}
          className="w-full bg-secondary border-border pl-8 text-sm"
        />
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="flex gap-1.5">
          {STATUS_OPTIONS.map((s) => (
            <button
              key={s.value}
              onClick={() => setFiltroStatus(s.value)}
              className={`rounded-md border px-3 py-1.5 text-xs font-semibold transition-colors ${
                filtroStatus === s.value
                  ? "border-gym-accent bg-gym-accent/10 text-gym-accent"
                  : "border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground"
              }`}
            >
              {s.label}
              {s.value === "TODOS" && (
                <span className="ml-1.5 text-muted-foreground">
                  ({prospectsByMonth.filter((p) => p.status !== "CONVERTIDO" && p.status !== "PERDIDO").length})
                </span>
              )}
            </button>
          ))}
        </div>
        <div className="w-44">
          <Select
            value={filtroOrigem}
            onValueChange={(v) => setFiltroOrigem(v as OrigemProspect | "TODAS")}
          >
            <SelectTrigger className="w-full bg-secondary border-border text-xs">
              <SelectValue placeholder="Origem" />
            </SelectTrigger>
            <SelectContent className="bg-card border-border">
              <SelectItem value="TODAS">Todas origens</SelectItem>
              {Object.entries(ORIGEM_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="ml-auto">
          <MonthYearPicker
            month={mes}
            year={ano}
            onChange={(next) => {
              setMes(next.month);
              setAno(next.year);
            }}
          />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-border">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-secondary">
              <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Prospect
              </th>
              <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Telefone
              </th>
              <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Origem
              </th>
              <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Cadastro
              </th>
              <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Status
              </th>
              <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Ações
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.length === 0 && (
              <tr>
                <td
                  colSpan={6}
                  className="py-10 text-center text-sm text-muted-foreground"
                >
                  Nenhum prospect encontrado
                </td>
              </tr>
            )}
            {filtered.map((p) => (
              <tr
                key={p.id}
                className="transition-colors hover:bg-secondary/40"
              >
                <td className="px-4 py-3">
                  <p className="text-sm font-medium">{p.nome}</p>
                  {p.email && (
                    <p className="text-xs text-muted-foreground">{p.email}</p>
                  )}
                </td>
                <td className="px-4 py-3 text-sm text-muted-foreground">
                  {p.telefone}
                </td>
                <td className="px-4 py-3 text-sm text-muted-foreground">
                  {ORIGEM_LABELS[p.origem]}
                </td>
                <td className="px-4 py-3 text-sm text-muted-foreground">
                  {formatDate(p.dataCriacao)}
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={p.status} />
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    {/* Next status button */}
                    {STATUS_PROGRESSION.includes(p.status as StatusProspect) && (
                      <button
                        onClick={() => {
                          const idx = STATUS_PROGRESSION.indexOf(
                            p.status as StatusProspect
                          );
                          if (idx < STATUS_PROGRESSION.length - 1) {
                            handleStatus(
                              p.id,
                              STATUS_PROGRESSION[idx + 1]
                            );
                          }
                        }}
                        className="rounded border border-border px-2 py-1 text-[11px] text-muted-foreground transition-colors hover:border-foreground/30 hover:text-foreground"
                      >
                        <ChevronDown className="inline size-3" /> Avançar
                      </button>
                    )}
                    {/* Converter */}
                    {p.status !== "CONVERTIDO" && p.status !== "PERDIDO" && (
                      <Link href={`/prospects/${p.id}/converter`}>
                        <Button size="sm" className="h-7 text-xs">
                          Converter
                        </Button>
                      </Link>
                    )}
                    <button
                      onClick={() => setEditing(p)}
                      className="rounded border border-border px-2 py-1 text-[11px] text-muted-foreground transition-colors hover:border-foreground/30 hover:text-foreground"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => setTimeline(p)}
                      className="rounded border border-border px-2 py-1 text-[11px] text-muted-foreground transition-colors hover:border-foreground/30 hover:text-foreground"
                    >
                      Timeline
                    </button>
                    {p.status !== "PERDIDO" && (
                      <button
                        onClick={() => handlePerdido(p.id)}
                        className="rounded border border-gym-warning/40 px-2 py-1 text-[11px] text-gym-warning transition-colors hover:border-gym-warning/70"
                      >
                        Marcar perdido
                      </button>
                    )}
                    {/* Delete */}
                    <button
                      onClick={() => handleDelete(p.id)}
                      className="rounded border border-border px-2 py-1 text-[11px] text-gym-danger/70 transition-colors hover:border-gym-danger/50 hover:text-gym-danger"
                    >
                      Remover
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
