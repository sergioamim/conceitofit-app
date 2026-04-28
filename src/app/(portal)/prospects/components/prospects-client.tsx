"use client";

import { memo, useCallback, useEffect, useState } from "react";
import { formatDateBR } from "@/lib/formatters";
import Link from "next/link";
import { Search, Plus, ChevronDown, Users, Target, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { checkProspectDuplicateApi } from "@/lib/api/crm";
import { listFuncionariosApi } from "@/lib/api/administrativo";
import { getBusinessCurrentMonthYear } from "@/lib/business-date";
import { canAdvanceProspect, getNextProspectStatus } from "@/lib/tenant/crm/prospect-status";
import { useTenantContext } from "@/lib/tenant/hooks/use-session-context";
import {
  useProspectsPage,
  useSumarioProspects,
  useCreateProspect,
  useUpdateProspect,
  useUpdateProspectStatus,
  useMarkProspectLost,
  useDeleteProspect,
} from "@/lib/query/use-prospects";
import { normalizeErrorMessage } from "@/lib/utils/api-error";
import { StatusBadge } from "@/components/shared/status-badge";
import { MonthYearPicker } from "@/components/shared/month-year-picker";
import { BiMetricCard } from "@/components/shared/bi-metric-card";
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
import { ProspectLossReasonDialog } from "@/components/shared/prospect-loss-reason-dialog";
import { ProspectTimelineModal } from "@/components/shared/prospect-timeline-modal";
import type {
  Prospect,
  StatusProspect,
  OrigemProspect,
  CreateProspectInput,
  Funcionario,
} from "@/lib/types";
import { maskPhone } from "@/lib/utils";
import { useConfirmDialog } from "@/hooks/use-confirm-dialog";
import { useDialogState } from "@/hooks/use-dialog-state";
import { ListErrorState } from "@/components/shared/list-states";
import { FILTER_ALL, type WithFilterAll } from "@/lib/shared/constants/filters";
import { cn } from "@/lib/utils";

const STATUS_OPTIONS: { value: WithFilterAll<StatusProspect>; label: string }[] = [
  { value: FILTER_ALL, label: "Todos" },
  { value: "NOVO", label: "Novo" },
  { value: "EM_CONTATO", label: "Em contato" },
  { value: "AGENDOU_VISITA", label: "Agendou visita" },
  { value: "VISITOU", label: "Visitou" },
  { value: "CONVERTIDO", label: "Convertido" },
  { value: "PERDIDO", label: "Perdido" },
];

const STATUS_LABELS: { value: StatusProspect; label: string; tone: any }[] = [
  { value: "NOVO", label: "Novos", tone: "accent" },
  { value: "EM_CONTATO", label: "Em contato", tone: "warning" },
  { value: "AGENDOU_VISITA", label: "Agendou visita", tone: "warning" },
  { value: "VISITOU", label: "Visitou", tone: "teal" },
  { value: "CONVERTIDO", label: "Convertidos", tone: "teal" },
  { value: "PERDIDO", label: "Perdidos", tone: "danger" },
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

type ProspectRowProps = {
  prospect: Prospect;
  origemLabel: string;
  index: number;
  onAdvance: (id: string, status: StatusProspect) => void;
  onEdit: (prospect: Prospect) => void;
  onTimeline: (prospect: Prospect) => void;
  onMarkLost: (id: string) => void;
  onDelete: (id: string) => void;
};

const ProspectTableRow = memo(function ProspectTableRow({
  prospect,
  origemLabel,
  index,
  onAdvance,
  onEdit,
  onTimeline,
  onMarkLost,
  onDelete,
}: ProspectRowProps) {
  const canAdvance = canAdvanceProspect(prospect.status);
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
    <motion.tr 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.03, 0.3) }}
      className="group border-b border-border/20 transition-colors hover:bg-primary/5 cursor-pointer"
    >
      <td className="px-6 py-5">
        <div className="flex items-center gap-3">
          <div className="size-9 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary group-hover:scale-110 transition-transform">
            {prospect.nome.charAt(0)}
          </div>
          <div>
            <p className="text-sm font-bold tracking-tight">{prospect.nome}</p>
            {prospect.email && <p className="text-[11px] text-muted-foreground">{prospect.email}</p>}
          </div>
        </div>
      </td>
      <td className="px-4 py-5 text-sm font-medium text-foreground/80">{prospect.telefone}</td>
      <td className="px-4 py-5 text-sm text-muted-foreground">{origemLabel}</td>
      <td className="px-4 py-5 text-[11px] font-mono text-muted-foreground uppercase tracking-tighter">
        {formatDateBR(prospect.dataCriacao)}
      </td>
      <td className="px-4 py-5">
        <StatusBadge status={prospect.status} />
      </td>
      <td className="px-6 py-5 text-right">
        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          {canAdvance && (
            <Button variant="outline" size="sm" onClick={handleAdvance} className="h-8 rounded-lg text-[10px] font-bold uppercase tracking-wider border-border/60">
              <ChevronDown className="mr-1 size-3" /> Avançar
            </Button>
          )}
          {canConvert && (
            <Link href={`/prospects/${prospect.id}/converter`}>
              <Button size="sm" className="h-8 rounded-lg text-[10px] font-bold uppercase tracking-wider shadow-lg shadow-primary/10">
                Converter
              </Button>
            </Link>
          )}
          <Button variant="ghost" size="icon" aria-label="Editar prospect" onClick={handleEdit} className="size-8 rounded-lg hover:bg-muted">
            <Plus className="size-4" />
          </Button>
        </div>
      </td>
    </motion.tr>
  );
});

export function ProspectsClient() {
  const { confirm, ConfirmDialog } = useConfirmDialog();
  const tenantContext = useTenantContext();
  const tenantId = tenantContext.tenantId ?? "";

  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
  useEffect(() => {
    void listFuncionariosApi(true).then(setFuncionarios).catch(() => {});
  }, []);

  const createMutation = useCreateProspect(tenantId || undefined);
  const updateMutation = useUpdateProspect(tenantId || undefined);
  const statusMutation = useUpdateProspectStatus(tenantId || undefined);
  const lostMutation = useMarkProspectLost(tenantId || undefined);
  const deleteMutation = useDeleteProspect(tenantId || undefined);

  const [filtroStatus, setFiltroStatus] = useState<WithFilterAll<StatusProspect>>(FILTER_ALL);
  const [filtroOrigem, setFiltroOrigem] = useState<OrigemProspect | "TODAS">("TODAS");
  const [busca, setBusca] = useState("");
  const modal = useDialogState();
  const [editing, setEditing] = useState<Prospect | null>(null);
  const [timeline, setTimeline] = useState<Prospect | null>(null);
  const [lossTargetId, setLossTargetId] = useState<string | null>(null);
  const [mes, setMes] = useState(() => getBusinessCurrentMonthYear().month);
  const [ano, setAno] = useState(() => getBusinessCurrentMonthYear().year);
  const [pageSize, setPageSize] = useState<20 | 50 | 100 | 200>(20);
  const [page, setPage] = useState(1);

  // P1 (2026-04-23): filtros + paginacao todos server-side.
  // `mes/ano` → startDate/endDate; `filtroStatus`, `filtroOrigem`, `busca`
  // viram params do backend. Tabela consome items da pagina direto; cards
  // de totais leem sumário (GROUP BY por status no DB).
  const periodoStart = `${ano}-${String(mes + 1).padStart(2, "0")}-01`;
  const periodoEnd = (() => {
    const lastDay = new Date(ano, mes + 1, 0).getDate();
    return `${ano}-${String(mes + 1).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
  })();

  const backendStatus = filtroStatus === FILTER_ALL ? undefined : filtroStatus;
  const backendOrigem = filtroOrigem === "TODAS" ? undefined : filtroOrigem;
  const backendSearch = busca.trim() || undefined;

  const {
    data: prospectsPage,
    isLoading: loading,
    error: queryError,
    refetch,
  } = useProspectsPage({
    tenantId: tenantId || undefined,
    tenantResolved: tenantContext.tenantResolved,
    status: backendStatus,
    origem: backendOrigem,
    search: backendSearch,
    startDate: periodoStart,
    endDate: periodoEnd,
    page: page - 1, // backend 0-indexed, UI 1-indexed
    size: pageSize,
  });

  const { data: sumario } = useSumarioProspects({
    tenantId: tenantId || undefined,
    tenantResolved: tenantContext.tenantResolved,
    startDate: periodoStart,
    endDate: periodoEnd,
  });

  const error = queryError ? normalizeErrorMessage(queryError) : "";

  const displayed = prospectsPage?.items ?? [];
  const totalFiltrado = prospectsPage?.total ?? 0;
  const startIndex = (page - 1) * pageSize;
  const endIndex = displayed.length === 0 ? 0 : startIndex + displayed.length;
  const hasNextPage = prospectsPage?.hasNext ?? false;

  const statusTotals: Record<StatusProspect, number> = {
    NOVO: sumario?.novos ?? 0,
    EM_CONTATO: sumario?.emContato ?? 0,
    AGENDOU_VISITA: sumario?.agendouVisita ?? 0,
    VISITOU: sumario?.visitou ?? 0,
    CONVERTIDO: sumario?.convertidos ?? 0,
    PERDIDO: sumario?.perdidos ?? 0,
  };

  const ativosCount = sumario?.ativos ?? 0;

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

  const handleOpenNew = modal.open;
  const handleCloseNew = modal.close;
  const handleOpenEdit = useCallback((prospect: Prospect) => setEditing(prospect), []);
  const handleCloseEditing = useCallback(() => setEditing(null), []);
  const handleOpenTimeline = useCallback((prospect: Prospect) => setTimeline(prospect), []);
  const handleCloseTimeline = useCallback(() => setTimeline(null), []);

  const handleFiltroStatus = useCallback((next: WithFilterAll<StatusProspect>) => {
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
      if (!tenantId) {
        throw new Error("Unidade ativa não definida para criar prospect.");
      }
      const isDup = await checkProspectDuplicateApi({
        tenantId,
        telefone: data.telefone,
        cpf: data.cpf,
        email: data.email,
      });
      if (isDup) {
        throw new Error("Já existe prospect com este telefone, CPF ou e-mail.");
      }
      await createMutation.mutateAsync(data);
    },
    [createMutation, tenantId]
  );

  const handleEditSave = useCallback(
    async (data: CreateProspectInput) => {
      if (!editing || !tenantId) return;
      await updateMutation.mutateAsync({
        id: editing.id,
        data: { ...data, responsavelId: data.responsavelId || undefined },
      });
      setEditing(null);
    },
    [editing, tenantId, updateMutation]
  );

  const handleStatus = useCallback(
    async (id: string, status: StatusProspect) => {
      if (!tenantId) return;
      await statusMutation.mutateAsync({ id, status });
    },
    [tenantId, statusMutation]
  );

  const handleAdvance = useCallback(
    (id: string, currentStatus: StatusProspect) => {
      const nextStatus = getNextProspectStatus(currentStatus);
      if (nextStatus) {
        void handleStatus(id, nextStatus);
      }
    },
    [handleStatus]
  );

  const handlePerdido = useCallback(
    (id: string) => {
      if (!tenantId) return;
      setLossTargetId(id);
    },
    [tenantId]
  );

  const handleCloseLossDialog = useCallback(() => setLossTargetId(null), []);

  const handleConfirmLoss = useCallback(
    async (motivo?: string) => {
      if (!tenantId || !lossTargetId) return;
      await lostMutation.mutateAsync({ id: lossTargetId, motivo });
      setLossTargetId(null);
    },
    [lossTargetId, lostMutation, tenantId]
  );

  const handleDelete = useCallback(
    (id: string) => {
      if (!tenantId) return;
      confirm("Remover este prospect?", async () => {
        await deleteMutation.mutateAsync(id);
      });
    },
    [confirm, tenantId, deleteMutation]
  );

  return (
    <div className="space-y-8 pb-10">
      {ConfirmDialog}
      <ProspectModal open={modal.isOpen} onClose={handleCloseNew} onSave={handleSave} funcionarios={funcionarios} />
      <ProspectModal
        open={!!editing}
        onClose={handleCloseEditing}
        onSave={handleEditSave}
        funcionarios={funcionarios}
        initial={editing}
      />
      <ProspectLossReasonDialog
        open={lossTargetId !== null}
        submitting={lostMutation.isPending}
        onClose={handleCloseLossDialog}
        onConfirm={handleConfirmLoss}
      />
      <ProspectTimelineModal prospect={timeline} onClose={handleCloseTimeline} />

      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <h1 className="font-display text-4xl font-extrabold tracking-tight">Prospects</h1>
          <p className="mt-2 text-muted-foreground text-lg flex items-center gap-2">
            <Target size={18} className="text-primary" />
            {ativosCount} leads ativos no pipeline comercial
          </p>
        </motion.div>
        <Button onClick={handleOpenNew} className="rounded-xl h-11 px-6 shadow-lg shadow-primary/20 font-bold">
          <Plus className="mr-2 size-5" />
          Novo Prospect
        </Button>
      </div>

      {error ? <ListErrorState error={error} onRetry={() => void refetch()} /> : null}

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {STATUS_LABELS.map((s) => (
          <BiMetricCard 
            key={s.value} 
            label={s.label} 
            value={String(statusTotals[s.value])} 
            tone={s.tone} 
          />
        ))}
      </div>

      <div className="glass-card rounded-2xl border border-border/40 overflow-hidden shadow-xl shadow-black/5">
        <div className="p-6 border-b border-border/40 bg-muted/10 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome ou telefone..."
                value={busca}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="w-full bg-background/50 border-border/60 pl-10 h-11 rounded-xl focus:ring-primary/20"
              />
            </div>
            <div className="flex items-center gap-2">
              <MonthYearPicker month={mes} year={ano} onChange={handleMesAno} />
              <Select value={String(pageSize)} onValueChange={handlePageSize}>
                <SelectTrigger className="w-32 bg-background/50 border-border/60 h-11 rounded-xl text-xs">
                  <SelectValue placeholder="Págs" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border/40">
                  <SelectItem value="20">20 / pág</SelectItem>
                  <SelectItem value="50">50 / pág</SelectItem>
                  <SelectItem value="100">100 / pág</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex flex-wrap gap-1.5 p-1 bg-muted/30 border border-border/40 rounded-xl">
              {STATUS_OPTIONS.map((s) => (
                <button
                  key={s.value}
                  onClick={() => handleFiltroStatus(s.value)}
                  className={cn(
                    "px-4 py-1.5 rounded-lg text-xs font-bold transition-all duration-300",
                    filtroStatus === s.value
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                  )}
                >
                  {s.label}
                  {s.value === FILTER_ALL && <span className="ml-1.5 opacity-60">({ativosCount})</span>}
                </button>
              ))}
            </div>

            <div className="w-44">
              <Select value={filtroOrigem} onValueChange={handleFiltroOrigem}>
                <SelectTrigger className="w-full bg-muted/30 border-border/40 h-9 rounded-xl text-xs">
                  <SelectValue placeholder="Origem" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border/40">
                  <SelectItem value="TODAS">Todas origens</SelectItem>
                  {Object.entries(ORIGEM_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-none bg-muted/40 hover:bg-muted/40">
                <th className="px-6 py-4 text-left text-[11px] font-bold uppercase tracking-widest text-muted-foreground/70">Lead</th>
                <th className="px-4 py-4 text-left text-[11px] font-bold uppercase tracking-widest text-muted-foreground/70">Contato</th>
                <th className="px-4 py-4 text-left text-[11px] font-bold uppercase tracking-widest text-muted-foreground/70">Origem</th>
                <th className="px-4 py-4 text-left text-[11px] font-bold uppercase tracking-widest text-muted-foreground/70">Data</th>
                <th className="px-4 py-4 text-left text-[11px] font-bold uppercase tracking-widest text-muted-foreground/70">Status</th>
                <th className="px-6 py-4 text-right text-[11px] font-bold uppercase tracking-widest text-muted-foreground/70">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/10">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-20 text-center text-sm text-muted-foreground animate-pulse">Carregando leads...</td>
                </tr>
              ) : displayed.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-20 text-center">
                    <div className="flex flex-col items-center justify-center opacity-40">
                      <Target size={48} className="mb-4" />
                      <p className="text-lg font-medium">Nenhum lead encontrado</p>
                    </div>
                  </td>
                </tr>
              ) : (
                displayed.map((p, i) => (
                  <ProspectTableRow
                    key={p.id}
                    prospect={p}
                    index={i}
                    origemLabel={ORIGEM_LABELS[p.origem]}
                    onAdvance={handleAdvance}
                    onEdit={handleOpenEdit}
                    onTimeline={handleOpenTimeline}
                    onMarkLost={handlePerdido}
                    onDelete={handleDelete}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="p-4 border-t border-border/40 bg-muted/5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground font-medium">
            Exibindo <span className="text-foreground font-bold">{totalFiltrado === 0 ? 0 : startIndex + 1}-{endIndex}</span> de <span className="text-foreground font-bold">{totalFiltrado}</span> leads
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-9 rounded-xl border-border/60 hover:bg-background"
              disabled={page <= 1}
              onClick={() => setPage(p => Math.max(1, p - 1))}
            >
              Anterior
            </Button>
            <div className="flex items-center gap-1 mx-2">
              <span className="size-8 flex items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-xs shadow-md shadow-primary/20">
                {page}
              </span>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="h-9 rounded-xl border-border/60 hover:bg-background"
              disabled={!hasNextPage}
              onClick={() => setPage(p => p + 1)}
            >
              Próxima
              <ChevronDown size={16} className="ml-1 -rotate-90" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
