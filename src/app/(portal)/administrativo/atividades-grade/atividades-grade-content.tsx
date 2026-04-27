"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { LayoutGrid, Plus, Table2 } from "lucide-react";
import {
  createAtividadeGradeApi,
  criarOcorrenciaAtividadeGradeApi,
  deleteAtividadeGradeApi,
  listAtividadeGradesApi,
  listAtividadesApi,
  listFuncionariosApi,
  listSalasApi,
  toggleAtividadeGradeApi,
  updateAtividadeGradeApi,
} from "@/lib/api/administrativo";
import { getActiveTenantIdFromSession } from "@/lib/api/session";
import type { Atividade, AtividadeGrade, DiaSemana, Funcionario, Sala } from "@/lib/types";
import { useTenantContext } from "@/lib/tenant/hooks/use-session-context";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { normalizeErrorMessage } from "@/lib/utils/api-error";
import { AtividadeGradeModal, type AtividadeGradeForm } from "@/components/shared/atividade-grade-modal";
import { DataTableRowActions } from "@/components/shared/data-table-row-actions";
import {
  AtividadeOcorrenciaModal,
  type AtividadeOcorrenciaForm,
} from "@/components/shared/atividade-ocorrencia-modal";
import { useConfirmDialog } from "@/hooks/use-confirm-dialog";
import { PageError } from "@/components/shared/page-error";
import { FILTER_ALL } from "@/lib/shared/constants/filters";
import { useAdminCrud } from "@/lib/query/use-admin-crud";
import {
  GradeCompositor,
  type GradeCompositorDropPayload,
  type GradeCompositorMovePayload,
} from "@/components/grade/grade-compositor";
import { buildPrefillGrade, minToTime, timeToMin } from "@/components/grade/grade-prefill";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/use-toast";

const DIA_LABEL: Record<DiaSemana, string> = {
  SEG: "Segunda",
  TER: "Terça",
  QUA: "Quarta",
  QUI: "Quinta",
  SEX: "Sexta",
  SAB: "Sábado",
  DOM: "Domingo",
};

/** Combined data returned from the list query */
type AtividadesGradeData = {
  grades: AtividadeGrade[];
  atividades: Atividade[];
  salas: Sala[];
  funcionarios: Funcionario[];
};

const EMPTY_GRADES: readonly AtividadeGrade[] = [];
const EMPTY_ATIVIDADES: readonly Atividade[] = [];
const EMPTY_SALAS: readonly Sala[] = [];
const EMPTY_FUNCIONARIOS: readonly Funcionario[] = [];


export function AtividadesGradeContent() {
  const { confirm, ConfirmDialog } = useConfirmDialog();
  const tenantContext = useTenantContext();
  const { toast } = useToast();
  const [mounted, setMounted] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [occurrenceModalOpen, setOccurrenceModalOpen] = useState(false);
  const [editing, setEditing] = useState<AtividadeGrade | null>(null);
  const [prefilledNew, setPrefilledNew] = useState<AtividadeGrade | null>(null);
  const [occurrenceGrade, setOccurrenceGrade] = useState<AtividadeGrade | null>(null);
  const [viewMode, setViewMode] = useState<"tabela" | "compositor">("tabela");
  const [filtroAtividade, setFiltroAtividade] = useState<string>("TODAS");
  const [filtroDia, setFiltroDia] = useState<DiaSemana | typeof FILTER_ALL>(FILTER_ALL);
  const [apenasAtivas, setApenasAtivas] = useState(true);
  const [savingOccurrence, setSavingOccurrence] = useState(false);
  const notifyError = useCallback((err: unknown, fallback: string) => toast({ title: "Algo deu errado", description: normalizeErrorMessage(err) || fallback, variant: "destructive", duration: 8000 }), [toast]);
  const notifySuccess = useCallback((description: string) => toast({ description, duration: 4000 }), [toast]);
  // Hydration guard: getActiveTenantIdFromSession() le localStorage, indisponivel no SSR.
  // Mantemos tenantId vazio no primeiro render (= SSR) e sincronizamos apos mount.
  useEffect(() => setMounted(true), []);
  const tenantId = mounted
    ? tenantContext.tenantId || getActiveTenantIdFromSession() || ""
    : "";

  // Filter key to trigger refetch when API-level filters change
  const filterKey = `${filtroAtividade}|${apenasAtivas}`;

  const {
    items: dataItems,
    isLoading: loading,
    error: queryError,
    refetch: load,
  } = useAdminCrud<AtividadesGradeData>({
    domain: "atividades-grade",
    tenantId,
    enabled: Boolean(tenantId),
    listFn: async (tid) => {
      const [g, a, sal, pro] = await Promise.all([
        listAtividadeGradesApi({
          tenantId: tid,
          atividadeId: filtroAtividade === "TODAS" ? undefined : filtroAtividade,
          apenasAtivas: apenasAtivas ? true : undefined,
        }),
        listAtividadesApi({ tenantId: tid, apenasAtivas: false }),
        listSalasApi(),
        listFuncionariosApi(true),
      ]);
      return [{ grades: g, atividades: a, salas: sal, funcionarios: pro }];
    },
  });

  // Refetch when API-level filters change
  useEffect(() => {
    if (tenantId) {
      void load();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterKey]);

  const loadError = queryError ? (normalizeErrorMessage(queryError) || "Falha ao carregar grade de atividades.") : "";

  const data = dataItems[0];
  const grades = data?.grades ?? EMPTY_GRADES;
  const atividades = data?.atividades ?? EMPTY_ATIVIDADES;
  const salas = data?.salas ?? EMPTY_SALAS;
  const funcionarios = data?.funcionarios ?? EMPTY_FUNCIONARIOS;

  const atividadeMap = useMemo(() => new Map(atividades.map((a) => [a.id, a])), [atividades]);
  const salaMap = useMemo(() => new Map(salas.map((s) => [s.id, s])), [salas]);
  const funcionarioMap = useMemo(() => new Map(funcionarios.map((f) => [f.id, f])), [funcionarios]);

  const filtered = grades.filter((g) => {
    const matchDia = filtroDia === FILTER_ALL || g.diasSemana.includes(filtroDia);
    return matchDia;
  });

  async function handleSave(data: AtividadeGradeForm, id?: string) {
    const payload = {
      atividadeId: data.atividadeId,
      diasSemana: data.diasSemana,
      definicaoHorario: data.definicaoHorario,
      horaInicio: data.horaInicio,
      horaFim: data.horaFim,
      capacidade: Math.max(1, parseInt(data.capacidade, 10) || 1),
      checkinLiberadoMinutosAntes: Math.max(0, parseInt(data.checkinLiberadoMinutosAntes, 10) || 0),
      duracaoMinutos: Math.max(1, parseInt(data.duracaoMinutos, 10) || 1),
      codigo: data.codigo || undefined,
      grupoAtividades: data.grupoAtividades || undefined,
      publico: data.publico || undefined,
      dificuldade: data.dificuldade ? (parseInt(data.dificuldade, 10) as 1 | 2 | 3 | 4 | 5) : undefined,
      descricaoAgenda: data.descricaoAgenda || undefined,
      acessoClientes: data.acessoClientes,
      permiteReserva: data.permiteReserva,
      limitarVagasAgregadores: data.limitarVagasAgregadores,
      exibirWellhub: data.exibirWellhub,
      permitirSaidaAntesInicio: data.permitirSaidaAntesInicio,
      permitirEscolherNumeroVaga: data.permitirEscolherNumeroVaga,
      exibirNoAppCliente: data.exibirNoAppCliente,
      exibirNoAutoatendimento: data.exibirNoAutoatendimento,
      exibirNoWodTv: data.exibirNoWodTv,
      finalizarAtividadeAutomaticamente: data.finalizarAtividadeAutomaticamente,
      desabilitarListaEspera: data.desabilitarListaEspera,
      salaId: data.salaId || undefined,
      funcionarioId: data.funcionarioId || undefined,
      local: data.salaId ? salaMap.get(data.salaId)?.nome : undefined,
      instrutor: data.funcionarioId ? funcionarioMap.get(data.funcionarioId)?.nome : undefined,
    };

    try {
      if (id) await updateAtividadeGradeApi(id, payload);
      else await createAtividadeGradeApi(payload);

      setModalOpen(false);
      setEditing(null);
      setPrefilledNew(null);
      notifySuccess(id ? "Grade atualizada." : "Grade criada.");
      void load();
    } catch (saveError) {
      notifyError(
        saveError,
        id ? "Falha ao atualizar a grade." : "Falha ao criar a grade.",
      );
    }
  }

  async function handleToggle(id: string) {
    try {
      const updated = await toggleAtividadeGradeApi(id);
      notifySuccess(updated.ativo ? "Grade ativada." : "Grade inativada.");
      void load();
    } catch (toggleError) {
      notifyError(toggleError, "Falha ao alterar status da grade.");
    }
  }

  function handleDropNewAtividade({ atividadeId, dia, horaInicio }: GradeCompositorDropPayload) {
    setEditing(null);
    setPrefilledNew(buildPrefillGrade(atividadeId, dia, horaInicio));
    setModalOpen(true);
  }

  function handlePickAtividade(atividadeId: string) {
    setEditing(null);
    setPrefilledNew(buildPrefillGrade(atividadeId, "SEG", "08:00"));
    setModalOpen(true);
  }

  async function handleMoveExisting({ gradeId, sourceDia, dia, horaInicio }: GradeCompositorMovePayload) {
    const g = grades.find((x) => x.id === gradeId);
    if (!g) return;
    // Preserva os demais dias do conjunto: troca origem→destino, ou só altera hora se mesmo dia.
    const novosDias: DiaSemana[] = sourceDia === dia
      ? g.diasSemana
      : g.diasSemana.includes(dia)
        ? g.diasSemana.filter((d) => d !== sourceDia)
        : g.diasSemana.map((d) => (d === sourceDia ? dia : d));
    const fim = minToTime(timeToMin(horaInicio) + g.duracaoMinutos);
    try {
      await updateAtividadeGradeApi(gradeId, { diasSemana: novosDias, horaInicio, horaFim: fim });
      notifySuccess(sourceDia !== dia ? `Grade movida para ${dia} ${horaInicio} (mantendo os demais dias).` : `Grade movida para ${horaInicio}.`);
      void load();
    } catch (moveError) {
      notifyError(moveError, "Falha ao mover item da grade.");
    }
  }

  function handleDelete(id: string) {
    confirm("Remover este item da grade?", async () => {
      try {
        await deleteAtividadeGradeApi(id);
        notifySuccess("Grade removida.");
        void load();
      } catch (deleteError) {
        notifyError(deleteError, "Falha ao remover a grade.");
      }
    });
  }

  async function handleCreateOccurrence(data: AtividadeOcorrenciaForm) {
    if (!occurrenceGrade || !tenantId) return;
    setSavingOccurrence(true);
    try {
      await criarOcorrenciaAtividadeGradeApi({
        tenantId,
        atividadeGradeId: occurrenceGrade.id,
        data: {
          data: data.data,
          horaInicio: data.horaInicio,
          horaFim: data.horaFim,
          capacidade: Math.max(1, parseInt(data.capacidade, 10) || occurrenceGrade.capacidade || 1),
          local: data.local || undefined,
          salaNome: data.salaNome || undefined,
          instrutorNome: data.instrutorNome || undefined,
          observacoes: data.observacoes || undefined,
        },
      });
      setOccurrenceModalOpen(false);
      setOccurrenceGrade(null);
      notifySuccess("Ocorrência criada e disponibilizada para reservas.");
      void load();
    } catch (saveError) {
      notifyError(saveError, "Falha ao criar ocorrência sob demanda.");
    } finally {
      setSavingOccurrence(false);
    }
  }

  const occurrenceDefaults = occurrenceGrade
    ? {
        horaInicio: occurrenceGrade.horaInicio,
        horaFim: occurrenceGrade.horaFim,
        capacidade: String(occurrenceGrade.capacidade),
        local: occurrenceGrade.local ?? salaMap.get(occurrenceGrade.salaId ?? "")?.nome ?? "",
        salaNome: salaMap.get(occurrenceGrade.salaId ?? "")?.nome ?? "",
        instrutorNome: funcionarioMap.get(occurrenceGrade.funcionarioId ?? "")?.nome ?? occurrenceGrade.instrutor ?? "",
      }
    : undefined;

  return (
    <div className="space-y-6">
      {ConfirmDialog}
      <AtividadeGradeModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditing(null);
          setPrefilledNew(null);
        }}
        onSave={handleSave}
        atividades={atividades}
        salas={salas}
        funcionarios={funcionarios}
        initial={editing ?? prefilledNew}
      />
      <AtividadeOcorrenciaModal
        open={occurrenceModalOpen}
        onClose={() => {
          setOccurrenceModalOpen(false);
          setOccurrenceGrade(null);
        }}
        onSave={handleCreateOccurrence}
        saving={savingOccurrence}
        atividadeNome={occurrenceGrade ? atividadeMap.get(occurrenceGrade.atividadeId)?.nome : undefined}
        initial={occurrenceDefaults}
      />

      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">Atividades - Grade</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Cadastro de disponibilidade por atividade. Esses registros serão usados no calendário de atividades.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="inline-flex rounded-md border border-border bg-card p-0.5">
            <button
              type="button"
              onClick={() => setViewMode("tabela")}
              className={cn(
                "inline-flex items-center gap-1.5 rounded px-3 py-1 text-xs font-semibold transition",
                viewMode === "tabela"
                  ? "bg-secondary text-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Table2 className="size-3.5" /> Tabela
            </button>
            <button
              type="button"
              onClick={() => setViewMode("compositor")}
              className={cn(
                "inline-flex items-center gap-1.5 rounded px-3 py-1 text-xs font-semibold transition",
                viewMode === "compositor"
                  ? "bg-secondary text-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <LayoutGrid className="size-3.5" /> Compositor
            </button>
          </div>
          <Button onClick={() => setModalOpen(true)}>
            <Plus className="size-4" />
            Nova Grade
          </Button>
        </div>
      </div>

      <PageError error={loadError} onRetry={load} />

      {viewMode === "compositor" ? (
        <GradeCompositor
          grades={grades}
          atividades={atividades}
          salas={salas}
          funcionarios={funcionarios}
          onDropNewAtividade={handleDropNewAtividade}
          onMoveExisting={handleMoveExisting}
          onEditExisting={(g) => {
            setEditing(g);
            setPrefilledNew(null);
            setModalOpen(true);
          }}
          onPickAtividade={handlePickAtividade}
        />
      ) : null}

      <div className={cn("flex items-center gap-3", viewMode !== "tabela" && "hidden")}>
        <div className="flex gap-1.5">
          <button
            onClick={() => setApenasAtivas(false)}
            className={`rounded-md border px-3 py-1.5 text-xs font-semibold transition-colors ${
              !apenasAtivas
                ? "border-gym-accent bg-gym-accent/10 text-gym-accent"
                : "border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground"
            }`}
          >
            Todas
          </button>
          <button
            onClick={() => setApenasAtivas(true)}
            className={`rounded-md border px-3 py-1.5 text-xs font-semibold transition-colors ${
              apenasAtivas
                ? "border-gym-accent bg-gym-accent/10 text-gym-accent"
                : "border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground"
            }`}
          >
            Apenas ativas
          </button>
        </div>

        <div className="ml-auto grid grid-cols-2 gap-2">
          <div className="w-52">
            <Select value={filtroAtividade} onValueChange={setFiltroAtividade}>
              <SelectTrigger className="w-full bg-secondary border-border text-sm">
                <SelectValue placeholder="Atividade" />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                <SelectItem value="TODAS">Todas atividades</SelectItem>
                {atividades.map((a) => (
                  <SelectItem key={a.id} value={a.id}>{a.nome}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="w-44">
            <Select value={filtroDia} onValueChange={(v) => setFiltroDia(v as DiaSemana | typeof FILTER_ALL)}>
              <SelectTrigger className="w-full bg-secondary border-border text-sm">
                <SelectValue placeholder="Dia" />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                <SelectItem value={FILTER_ALL}>Todos os dias</SelectItem>
                {Object.entries(DIA_LABEL).map(([value, label]) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className={cn("overflow-hidden rounded-xl border border-border", viewMode !== "tabela" && "hidden")}>
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-secondary">
              <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Atividade</th>
              <th className="w-44 px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Dias</th>
              <th className="w-40 px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Horário / Tipo</th>
              <th className="w-28 px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Capacidade</th>
              <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Local / Instrutor / Reserva</th>
              <th className="w-28 px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Status</th>
              <th className="w-[14rem] px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {!mounted || loading ? (
              <tr>
                <td colSpan={7} className="py-10 text-center text-sm text-muted-foreground">
                  Carregando grade de atividades...
                </td>
              </tr>
            ) : null}
            {mounted && !loading && filtered.map((g) => {
              const atividade = atividadeMap.get(g.atividadeId);
              return (
                <tr key={g.id} className="transition-colors hover:bg-secondary/40">
                  <td className="px-4 py-3">
                    <p className="text-sm font-medium">{atividade?.nome ?? "Atividade removida"}</p>
                    <div className="mt-1 flex flex-wrap gap-1.5 text-[11px]">
                      <span className="rounded-full bg-secondary px-2 py-0.5 text-muted-foreground">
                        {atividade?.categoria ?? "—"}
                      </span>
                      <span className="rounded-full bg-secondary px-2 py-0.5 text-muted-foreground">
                        {atividade?.permiteCheckin
                          ? atividade.checkinObrigatorio
                            ? "Check-in obrigatório"
                            : "Check-in opcional"
                          : "Sem check-in"}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    {g.diasSemana.map((dia) => DIA_LABEL[dia]).join(", ")}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-muted-foreground">
                    {g.definicaoHorario === "SOB_DEMANDA"
                      ? `Sob demanda · padrão ${g.horaInicio} - ${g.horaFim}`
                      : `${g.horaInicio} - ${g.horaFim}`}
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{g.capacidade}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    {g.salaId ? (salaMap.get(g.salaId)?.nome ?? "Sala removida") : (g.local ?? "Sem sala")}
                    {` · `}
                    {g.funcionarioId ? (funcionarioMap.get(g.funcionarioId)?.nome ?? "Funcionário removido") : (g.instrutor ?? "Sem funcionário")}
                    {` · ${g.permiteReserva ? "Reserva habilitada" : "Sem reserva"}`}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                      g.ativo ? "bg-gym-teal/15 text-gym-teal" : "bg-muted text-muted-foreground"
                    }`}>
                      {g.ativo ? "Ativa" : "Inativa"}
                    </span>
                  </td>
                  <td className="px-4 py-3 align-top">
                    <DataTableRowActions
                      className="flex-nowrap"
                      actions={[
                        {
                          label: "Criar ocorrência",
                          kind: "open",
                          icon: Plus,
                          disabled: g.definicaoHorario !== "SOB_DEMANDA" || !g.ativo,
                          onClick: () => {
                            setOccurrenceGrade(g);
                            setOccurrenceModalOpen(true);
                          },
                        },
                        {
                          label: "Editar",
                          kind: "edit",
                          onClick: () => {
                            setEditing(g);
                            setModalOpen(true);
                          },
                        },
                        {
                          label: g.ativo ? "Desativar" : "Ativar",
                          kind: "toggle",
                          onClick: () => handleToggle(g.id),
                        },
                        {
                          label: "Remover",
                          kind: "delete",
                          onClick: () => handleDelete(g.id),
                        },
                      ]}
                    />
                  </td>
                </tr>
              );
            })}
            {mounted && !loading && filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="py-10 text-center text-sm text-muted-foreground">
                  Nenhum item de grade encontrado
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
