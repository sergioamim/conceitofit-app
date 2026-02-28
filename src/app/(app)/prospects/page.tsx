"use client";

import { memo, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Search, Plus, ChevronDown } from "lucide-react";
import {
  listProspectsPage,
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

type ProspectRowProps = {
  prospect: Prospect;
  origemLabel: string;
  onAdvance: (id: string, status: StatusProspect) => void;
  onEdit: (prospect: Prospect) => void;
  onTimeline: (prospect: Prospect) => void;
  onMarkLost: (id: string) => void;
  onDelete: (id: string) => void;
};

const ProspectTableRow = memo(function ProspectTableRow({
  prospect,
  origemLabel,
  onAdvance,
  onEdit,
  onTimeline,
  onMarkLost,
  onDelete,
}: ProspectRowProps) {
  const canAdvance = STATUS_PROGRESSION.includes(prospect.status as StatusProspect);
  const canLose = prospect.status !== "PERDIDO";
  const canConvert = prospect.status !== "CONVERTIDO" && prospect.status !== "PERDIDO";

  const handleAdvance = useCallback(
    () => onAdvance(prospect.id, prospect.status as StatusProspect),
    [onAdvance, prospect.id, prospect.status]
  );
  const handleEdit = useCallback(() => onEdit(prospect), [onEdit, prospect]);
  const handleTimeline = useCallback(() => onTimeline(prospect), [onTimeline, prospect]);
  const handleMarkLost = useCallback(() => onMarkLost(prospect.id), [onMarkLost, prospect.id]);
  const handleDelete = useCallback(() => onDelete(prospect.id), [onDelete, prospect.id]);

  return (
    <tr className="transition-colors hover:bg-secondary/40">
      <td className="px-4 py-3">
        <p className="text-sm font-medium">{prospect.nome}</p>
        {prospect.email && <p className="text-xs text-muted-foreground">{prospect.email}</p>}
      </td>
      <td className="px-4 py-3 text-sm text-muted-foreground">{prospect.telefone}</td>
      <td className="px-4 py-3 text-sm text-muted-foreground">{origemLabel}</td>
      <td className="px-4 py-3 text-sm text-muted-foreground">
        {new Date(prospect.dataCriacao).toLocaleDateString("pt-BR")}
      </td>
      <td className="px-4 py-3">
        <StatusBadge status={prospect.status} />
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          {canAdvance && (
            <button
              onClick={handleAdvance}
              className="rounded border border-border px-2 py-1 text-[11px] text-muted-foreground transition-colors hover:border-foreground/30 hover:text-foreground"
            >
              <ChevronDown className="inline size-3" /> Avançar
            </button>
          )}
          {canConvert && (
            <Link href={`/prospects/${prospect.id}/converter`}>
              <Button size="sm" className="h-7 text-xs">
                Converter
              </Button>
            </Link>
          )}
          <button
            onClick={handleEdit}
            className="rounded border border-border px-2 py-1 text-[11px] text-muted-foreground transition-colors hover:border-foreground/30 hover:text-foreground"
          >
            Editar
          </button>
          <button
            onClick={handleTimeline}
            className="rounded border border-border px-2 py-1 text-[11px] text-muted-foreground transition-colors hover:border-foreground/30 hover:text-foreground"
          >
            Timeline
          </button>
          {canLose && (
            <button
              onClick={handleMarkLost}
              className="rounded border border-gym-warning/40 px-2 py-1 text-[11px] text-gym-warning transition-colors hover:border-gym-warning/70"
            >
              Marcar perdido
            </button>
          )}
          <button
            onClick={handleDelete}
            className="rounded border border-border px-2 py-1 text-[11px] text-gym-danger/70 transition-colors hover:border-gym-danger/50 hover:text-gym-danger"
          >
            Remover
          </button>
        </div>
      </td>
    </tr>
  );
});

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
  const [pageSize, setPageSize] = useState<20 | 50 | 100 | 200>(20);
  const [page, setPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(false);

  const load = useCallback(async () => {
    const [paged, funcs] = await Promise.all([
      listProspectsPage({
        status: filtroStatus === "TODOS" ? undefined : filtroStatus,
        page,
        size: pageSize,
      }),
      listFuncionarios(),
    ]);
    setProspects(paged.items);
    setHasNextPage(paged.hasNext);
    setFuncionarios(funcs);
  }, [filtroStatus, page, pageSize]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  const buscaDigits = useMemo(() => busca.replace(/\D/g, ""), [busca]);
  const buscaTermo = useMemo(() => busca.toLowerCase(), [busca]);

  const prospectsByMonth = useMemo(() => {
    return prospects.filter((p) => {
      const d = new Date(p.dataCriacao);
      return d.getFullYear() === ano && d.getMonth() === mes;
    });
  }, [prospects, ano, mes]);

  const filtered = useMemo(() => {
    return prospectsByMonth.filter((p) => {
      const matchStatus = filtroStatus === "TODOS" || p.status === filtroStatus;
      const matchOrigem = filtroOrigem === "TODAS" || p.origem === filtroOrigem;
      const matchBusca =
        !busca ||
        p.nome.toLowerCase().includes(buscaTermo) ||
        (buscaDigits && p.telefone.replace(/\D/g, "").includes(buscaDigits));
      return matchStatus && matchOrigem && matchBusca;
    });
  }, [buscaDigits, buscaTermo, filtroOrigem, filtroStatus, prospectsByMonth]);

  const startIndex = (page - 1) * pageSize;
  const endIndex = startIndex + filtered.length;
  const displayed = filtered;

  const statusTotals = useMemo(
    () =>
      prospectsByMonth.reduce<Record<StatusProspect, number>>(
        (acc, p) => {
          acc[p.status] += 1;
          return acc;
        },
        { NOVO: 0, EM_CONTATO: 0, AGENDOU_VISITA: 0, VISITOU: 0, CONVERTIDO: 0, PERDIDO: 0 }
      ),
    [prospectsByMonth]
  );

  const ativosCount = useMemo(
    () => prospectsByMonth.filter((p) => p.status !== "CONVERTIDO" && p.status !== "PERDIDO").length,
    [prospectsByMonth]
  );

  const statusButtonsData = useMemo(
    () =>
      STATUS_OPTIONS.map((s) => ({
        ...s,
        isActive: filtroStatus === s.value,
        isAllButton: s.value === "TODOS",
      })),
    [filtroStatus]
  );

  const handleSearchChange = useCallback((value: string) => {
    const hasLetters = /[a-zA-Z@]/.test(value);
    if (hasLetters) {
      setBusca(value);
      setPage(1);
      return;
    }
    setBusca(maskPhone(value));
    setPage(1);
  }, []);

  const handleOpenNew = useCallback(() => setModalOpen(true), []);
  const handleCloseNew = useCallback(() => setModalOpen(false), []);
  const handleOpenEdit = useCallback((prospect: Prospect) => setEditing(prospect), []);
  const handleCloseEditing = useCallback(() => setEditing(null), []);
  const handleOpenTimeline = useCallback((prospect: Prospect) => setTimeline(prospect), []);
  const handleCloseTimeline = useCallback(() => setTimeline(null), []);

  const handleFiltroStatus = useCallback((next: StatusProspect | "TODOS") => {
    setFiltroStatus(next);
    setPage(1);
  }, []);

  const handleFiltroOrigem = useCallback((next: string) => {
    setFiltroOrigem(next as OrigemProspect | "TODAS");
    setPage(1);
  }, []);

  const handlePageSize = useCallback((next: string) => {
    setPageSize(Number(next) as 20 | 50 | 100 | 200);
    setPage(1);
  }, []);

  const handleMesAno = useCallback((next: { month: number; year: number }) => {
    setMes(next.month);
    setAno(next.year);
    setPage(1);
  }, []);

  const handleSave = useCallback(
    async (data: CreateProspectInput) => {
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
    },
    [load]
  );

  const handleEditSave = useCallback(
    async (data: CreateProspectInput) => {
      if (!editing) return;
      await updateProspect(editing.id, {
        ...data,
        responsavelId: data.responsavelId || undefined,
      });
      setEditing(null);
      load();
    },
    [editing, load]
  );

  const handleStatus = useCallback(
    async (id: string, status: StatusProspect) => {
      await updateProspectStatus(id, status);
      load();
    },
    [load]
  );

  const handleAdvance = useCallback(
    (id: string, currentStatus: StatusProspect) => {
      const idx = STATUS_PROGRESSION.indexOf(currentStatus);
      if (idx < STATUS_PROGRESSION.length - 1) {
        void handleStatus(id, STATUS_PROGRESSION[idx + 1]);
      }
    },
    [handleStatus]
  );

  const handlePerdido = useCallback(
    async (id: string) => {
      const motivo = prompt("Motivo da perda (opcional):");
      await marcarProspectPerdido(id, motivo ?? undefined);
      load();
    },
    [load]
  );

  const handleDelete = useCallback(
    async (id: string) => {
      if (!confirm("Remover este prospect?")) return;
      await deleteProspect(id);
      load();
    },
    [load]
  );

  const handlePreviousPage = useCallback(() => setPage((p) => Math.max(1, p - 1)), []);
  const handleNextPage = useCallback(() => setPage((p) => p + 1), []);

  return (
    <div className="space-y-6">
      <ProspectModal open={modalOpen} onClose={handleCloseNew} onSave={handleSave} funcionarios={funcionarios} />
      <ProspectModal
        open={!!editing}
        onClose={handleCloseEditing}
        onSave={handleEditSave}
        funcionarios={funcionarios}
        initial={editing}
      />
      <ProspectTimelineModal prospect={timeline} onClose={handleCloseTimeline} />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">Prospects</h1>
          <p className="mt-1 text-sm text-muted-foreground">Gerencie leads e converta em clientes</p>
        </div>
        <Button onClick={handleOpenNew}>
          <Plus className="size-4" />
          Novo Prospect
        </Button>
      </div>

      <div className="grid grid-cols-6 gap-3">
        {STATUS_LABELS.map((s) => (
          <div key={s.value} className="rounded-lg border border-border bg-card p-3">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{s.label}</p>
            <p className="mt-1 font-display text-xl font-bold text-gym-accent">{statusTotals[s.value]}</p>
          </div>
        ))}
      </div>

      <div className="relative w-60">
        <Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar por nome ou telefone..."
          value={busca}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="w-full bg-secondary border-border pl-8 text-sm"
        />
      </div>

      <div className="flex items-center gap-3">
        <div className="flex gap-1.5">
          {statusButtonsData.map((s) => (
            <button
              key={s.value}
              onClick={() => handleFiltroStatus(s.value)}
              className={`rounded-md border px-3 py-1.5 text-xs font-semibold transition-colors ${
                s.isActive
                  ? "border-gym-accent bg-gym-accent/10 text-gym-accent"
                  : "border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground"
              }`}
            >
              {s.label}
              {s.isAllButton && <span className="ml-1.5 text-muted-foreground">({ativosCount})</span>}
            </button>
          ))}
        </div>

        <div className="w-44">
          <Select value={filtroOrigem} onValueChange={handleFiltroOrigem}>
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

        <div className="ml-auto w-44">
          <Select value={String(pageSize)} onValueChange={handlePageSize}>
            <SelectTrigger className="w-full bg-secondary border-border text-xs">
              <SelectValue placeholder="Itens por página" />
            </SelectTrigger>
            <SelectContent className="bg-card border-border">
              <SelectItem value="20">20 por página</SelectItem>
              <SelectItem value="50">50 por página</SelectItem>
              <SelectItem value="100">100 por página</SelectItem>
              <SelectItem value="200">200 por página</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <MonthYearPicker month={mes} year={ano} onChange={handleMesAno} />
        </div>
      </div>

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
            {displayed.length === 0 && (
              <tr>
                <td colSpan={6} className="py-10 text-center text-sm text-muted-foreground">
                  Nenhum prospect encontrado
                </td>
              </tr>
            )}
            {displayed.map((p) => (
              <ProspectTableRow
                key={p.id}
                prospect={p}
                origemLabel={ORIGEM_LABELS[p.origem]}
                onAdvance={handleAdvance}
                onEdit={handleOpenEdit}
                onTimeline={handleOpenTimeline}
                onMarkLost={handlePerdido}
                onDelete={handleDelete}
              />
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between rounded-lg border border-border bg-card px-3 py-2">
        <p className="text-xs text-muted-foreground">
          Mostrando <span className="font-semibold text-foreground">{filtered.length === 0 ? 0 : startIndex + 1}</span> até{' '}
          <span className="font-semibold text-foreground">{endIndex}</span> · página{' '}
          <span className="font-semibold text-foreground">{page}</span>
        </p>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            className="border-border"
            disabled={page <= 1}
            onClick={handlePreviousPage}
          >
            Anterior
          </Button>
          <Button
            type="button"
            variant="outline"
            className="border-border"
            disabled={!hasNextPage}
            onClick={handleNextPage}
          >
            Próxima
          </Button>
        </div>
      </div>
    </div>
  );
}
