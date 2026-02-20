"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Search, Plus, ChevronDown } from "lucide-react";
import {
  listProspects,
  createProspect,
  updateProspectStatus,
  deleteProspect,
} from "@/lib/mock/services";
import { StatusBadge } from "@/components/shared/status-badge";
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
} from "@/lib/types";

const STATUS_OPTIONS: { value: StatusProspect | "TODOS"; label: string }[] = [
  { value: "TODOS", label: "Todos" },
  { value: "NOVO", label: "Novo" },
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
}: {
  open: boolean;
  onClose: () => void;
  onSave: (data: CreateProspectInput) => void;
}) {
  const [form, setForm] = useState<CreateProspectInput>({
    nome: "",
    telefone: "",
    email: "",
    origem: "INSTAGRAM",
  });

  function set(key: keyof CreateProspectInput) {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value }));
  }

  function handleSubmit() {
    if (!form.nome || !form.telefone) return;
    onSave(form);
    setForm({ nome: "", telefone: "", email: "", origem: "INSTAGRAM" });
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-card border-border sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-lg font-bold">
            Novo Prospect
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
  const [filtroStatus, setFiltroStatus] = useState<StatusProspect | "TODOS">("TODOS");
  const [busca, setBusca] = useState("");
  const [modalOpen, setModalOpen] = useState(false);

  async function load() {
    const data = await listProspects();
    setProspects(data);
  }

  useEffect(() => {
    load();
  }, []);

  const filtered = prospects.filter((p) => {
    const matchStatus = filtroStatus === "TODOS" || p.status === filtroStatus;
    const matchBusca =
      !busca ||
      p.nome.toLowerCase().includes(busca.toLowerCase()) ||
      p.telefone.includes(busca);
    return matchStatus && matchBusca;
  });

  async function handleSave(data: CreateProspectInput) {
    await createProspect(data);
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

  function formatDate(d: string) {
    return new Date(d).toLocaleDateString("pt-BR");
  }

  return (
    <div className="space-y-6">
      <NovoProspectModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
      />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">
            Prospects
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Gerencie leads e converta em alunos
          </p>
        </div>
        <Button onClick={() => setModalOpen(true)}>
          <Plus className="size-4" />
          Novo Prospect
        </Button>
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
        <div className="relative ml-auto">
          <Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome ou telefone..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
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
                  {formatDate(p.createdAt)}
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
