"use client";

import { useEffect, useMemo, useState } from "react";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { MaskedInput } from "@/components/shared/masked-input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

function NovoProspectModal({
  open,
  onClose,
  onSave,
  funcionarios,
  initial,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (data: CreateProspectInput) => void;
  funcionarios: Funcionario[];
  initial?: Prospect | null;
}) {
  const [form, setForm] = useState<CreateProspectInput>({
    nome: "",
    telefone: "",
    email: "",
    cpf: "",
    origem: "INSTAGRAM",
    observacoes: "",
    responsavelId: "",
  });

  useEffect(() => {
    if (initial) {
      setForm({
        nome: initial.nome,
        telefone: initial.telefone,
        email: initial.email ?? "",
        cpf: initial.cpf ?? "",
        origem: initial.origem,
        observacoes: initial.observacoes ?? "",
        responsavelId: initial.responsavelId ?? "",
      });
    } else {
      setForm({
        nome: "",
        telefone: "",
        email: "",
        cpf: "",
        origem: "INSTAGRAM",
        observacoes: "",
        responsavelId: "",
      });
    }
  }, [initial, open]);

  function set(key: keyof CreateProspectInput) {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value }));
  }

  function handleSubmit() {
    if (!form.nome || !form.telefone) return;
    const payload: CreateProspectInput = {
      ...form,
      responsavelId: form.responsavelId ? form.responsavelId : undefined,
    };
    onSave(payload);
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-card border-border sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-lg font-bold">
            {initial ? "Editar Prospect" : "Novo Prospect"}
          </DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Nome *
              </label>
              <Input
                placeholder="Nome completo"
                value={form.nome}
                onChange={set("nome")}
                className="bg-secondary border-border"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Telefone *
              </label>
              <MaskedInput
                mask="phone"
                placeholder="(11) 99999-0000"
                value={form.telefone}
                onChange={(v) => setForm((f) => ({ ...f, telefone: v }))}
                className="bg-secondary border-border"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                CPF
              </label>
              <MaskedInput
                mask="cpf"
                placeholder="000.000.000-00"
                value={form.cpf ?? ""}
                onChange={(v) => setForm((f) => ({ ...f, cpf: v }))}
                className="bg-secondary border-border"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Origem
              </label>
              <Select
                value={form.origem}
                onValueChange={(v) =>
                  setForm((f) => ({ ...f, origem: v as OrigemProspect }))
                }
              >
                <SelectTrigger className="w-full bg-secondary border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  {Object.entries(ORIGEM_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Responsável
            </label>
            <Select
              value={form.responsavelId ?? ""}
              onValueChange={(v) =>
                setForm((f) => ({ ...f, responsavelId: v || "" }))
              }
            >
              <SelectTrigger className="w-full bg-secondary border-border">
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                <SelectItem value="">Sem responsável</SelectItem>
                {funcionarios.map((f) => (
                  <SelectItem key={f.id} value={f.id}>
                    {f.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              E-mail
            </label>
            <Input
              placeholder="email@exemplo.com"
              type="email"
              value={form.email ?? ""}
              onChange={set("email")}
              className="bg-secondary border-border"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Observações
            </label>
            <Input
              placeholder="Observações sobre o prospect"
              value={form.observacoes ?? ""}
              onChange={set("observacoes")}
              className="bg-secondary border-border"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="border-border">
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={!form.nome || !form.telefone}>
            Cadastrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

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
    load();
  }, []);

  const buscaDigits = busca.replace(/\D/g, "");

  const filtered = prospects.filter((p) => {
    const matchStatus = filtroStatus === "TODOS" || p.status === filtroStatus;
    const matchOrigem = filtroOrigem === "TODAS" || p.origem === filtroOrigem;
    const matchBusca =
      !busca ||
      p.nome.toLowerCase().includes(busca.toLowerCase()) ||
      (buscaDigits &&
        p.telefone.replace(/\D/g, "").includes(buscaDigits));
    return matchStatus && matchOrigem && matchBusca;
  });

  const statusTotals = useMemo(() => {
    const totals: Record<StatusProspect, number> = {
      NOVO: 0,
      EM_CONTATO: 0,
      AGENDOU_VISITA: 0,
      VISITOU: 0,
      CONVERTIDO: 0,
      PERDIDO: 0,
    };

    prospects.forEach((p) => {
      const logs = p.statusLog ?? [{ status: p.status, data: p.dataCriacao }];
      const occurred = new Set<StatusProspect>();
      logs.forEach((log) => {
        const d = new Date(log.data);
        if (d.getFullYear() === ano && d.getMonth() === mes) {
          occurred.add(log.status);
        }
      });
      occurred.forEach((s) => {
        totals[s] += 1;
      });
    });

    return totals;
  }, [prospects, mes, ano]);

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
      <NovoProspectModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
        funcionarios={funcionarios}
      />
      <NovoProspectModal
        open={!!editing}
        onClose={() => setEditing(null)}
        onSave={handleEditSave}
        funcionarios={funcionarios}
        initial={editing}
      />
      {timeline && (
        <Dialog open onOpenChange={() => setTimeline(null)}>
          <DialogContent className="bg-card border-border sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="font-display text-lg font-bold">
                Timeline · {timeline.nome}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-3 py-2">
              {(timeline.statusLog ?? []).length === 0 && (
                <p className="text-sm text-muted-foreground">
                  Sem interações registradas.
                </p>
              )}
              {(timeline.statusLog ?? [])
                .slice()
                .sort((a, b) => (a.data > b.data ? -1 : 1))
                .map((log, i) => (
                  <div key={`${log.status}-${i}`} className="flex items-center justify-between rounded-md border border-border bg-secondary px-3 py-2 text-sm">
                    <span>{STATUS_LABELS.find((s) => s.value === log.status)?.label ?? log.status}</span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(log.data).toLocaleString("pt-BR")}
                    </span>
                  </div>
                ))}
            </div>
          </DialogContent>
        </Dialog>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">
            Prospects
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Gerencie leads e converta em clientes
          </p>
        </div>
        <MonthYearPicker
          month={mes}
          year={ano}
          onChange={(next) => {
            setMes(next.month);
            setAno(next.year);
          }}
        />
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
                  ({prospects.filter((p) => p.status !== "CONVERTIDO" && p.status !== "PERDIDO").length})
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
        <div className="relative ml-auto">
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
            className="w-60 bg-secondary border-border pl-8 text-sm"
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
