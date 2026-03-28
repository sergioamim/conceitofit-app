"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { TreinoForm } from "@/components/shared/treino-modal";
import { useToast } from "@/components/ui/use-toast";
import { DEFAULT_ACTIVE_TENANT_LABEL, useAuthAccess, useTenantContext } from "@/lib/tenant/hooks/use-session-context";
import { extractAlunosFromListResponse, listAlunosApi } from "@/lib/api/alunos";
import { addDaysToIsoDate, getBusinessTodayIso } from "@/lib/business-date";
import { resolveTreinoV2Permissions } from "@/lib/tenant/treinos/v2-domain";
import {
  assignTreinoTemplate,
  getTreinoWorkspace,
  listTreinoExercicios,
  listTreinoTemplatesWorkspace,
  saveTreinoWorkspace,
  type TreinoTemplateResumo,
  type TreinoTemplateTotais,
} from "@/lib/tenant/treinos/workspace";
import type { Aluno, Exercicio, Treino, TreinoItem } from "@/lib/types";
import { normalizeErrorMessage } from "@/lib/utils/api-error";

const PAGE_SIZE = 12;

export type AssignmentState = {
  templateId: string;
  alunoId: string;
  dataInicio: string;
  dataFim: string;
  metaSessoesSemana: number;
  frequenciaPlanejada: number;
  quantidadePrevista: number;
  observacoes: string;
};

export type LatestAssignedState = {
  treinoId: string;
  nome: string;
  alunoNome: string;
};

const EMPTY_TEMPLATE_TOTALS: TreinoTemplateTotais = {
  totalTemplates: 0,
  publicados: 0,
  emRevisao: 0,
  comPendencias: 0,
};

export function formatDateTime(value?: string): string {
  if (!value) return "-";
  const [datePart, timePart] = value.split("T");
  const [year, month, day] = datePart.split("-");
  if (!year || !month || !day) return value;
  const time = timePart?.slice(0, 5);
  return time ? `${day}/${month}/${year} ${time}` : `${day}/${month}/${year}`;
}

export function resolveTemplateStatusBadgeVariant(status?: string): "secondary" | "outline" | "destructive" {
  if (status === "ARQUIVADO" || status === "CANCELADO") return "destructive";
  if (status === "RASCUNHO" || status === "EM_REVISAO") return "outline";
  return "secondary";
}

export function getTemplateDisplayName(template: { nome?: string | null; templateNome?: string | null }): string {
  return template.templateNome ?? template.nome ?? "Template sem nome";
}

function sortTemplatesByRecency(items: TreinoTemplateResumo[]): TreinoTemplateResumo[] {
  return [...items].sort((left, right) => {
    const leftStamp = left.atualizadoEm ?? "";
    const rightStamp = right.atualizadoEm ?? "";
    return rightStamp.localeCompare(leftStamp);
  });
}

function buildTreinoItems(itens: TreinoForm["itens"], exercicios: Exercicio[]): TreinoItem[] {
  return itens.map((item, index) => {
    const exercicio = exercicios.find((candidate) => candidate.id === item.exercicioId);
    return {
      id: item.id ?? "",
      treinoId: "",
      exercicioId: item.exercicioId,
      exercicioNome: exercicio?.nome,
      grupoMuscularId: exercicio?.grupoMuscularId,
      grupoMuscularNome: exercicio?.grupoMuscularNome ?? exercicio?.grupoMuscular,
      ordem: item.ordem ?? index + 1,
      series: item.series,
      repeticoesMin: item.repeticoesMin,
      repeticoesMax: item.repeticoesMax,
      intervaloSegundos: item.intervaloSegundos,
      tempoExecucaoSegundos: item.tempoExecucaoSegundos,
      cargaSugerida: item.cargaSugerida,
      observacao: item.observacao,
      diasSemana: item.diasSemana,
    };
  });
}

function buildTemplateForm(template: Treino): TreinoForm {
  return {
    nome: template.nome ?? getTemplateDisplayName(template),
    templateNome: template.templateNome ?? template.nome ?? getTemplateDisplayName(template),
    objetivo: template.objetivo,
    divisao: template.divisao,
    metaSessoesSemana: template.metaSessoesSemana,
    frequenciaPlanejada: template.frequenciaPlanejada,
    quantidadePrevista: template.quantidadePrevista,
    dataInicio: template.dataInicio ?? getBusinessTodayIso(),
    dataFim: template.dataFim ?? template.vencimento ?? addDaysToIsoDate(getBusinessTodayIso(), 30),
    observacoes: template.observacoes,
    ativo: template.ativo !== false,
    tipoTreino: "PRE_MONTADO",
    itens:
      template.itens?.map((item, index) => ({
        id: item.id,
        exercicioId: item.exercicioId,
        ordem: item.ordem ?? index + 1,
        series: item.series,
        repeticoesMin: item.repeticoesMin,
        repeticoesMax: item.repeticoesMax,
        intervaloSegundos: item.intervaloSegundos,
        tempoExecucaoSegundos: item.tempoExecucaoSegundos,
        cargaSugerida: item.cargaSugerida,
        observacao: item.observacao,
        diasSemana: item.diasSemana,
      })) ?? [],
  };
}

function buildAssignmentState(template: Treino): AssignmentState {
  return {
    templateId: template.id,
    alunoId: "",
    dataInicio: getBusinessTodayIso(),
    dataFim: addDaysToIsoDate(getBusinessTodayIso(), 30),
    metaSessoesSemana: template.metaSessoesSemana ?? 3,
    frequenciaPlanejada: template.frequenciaPlanejada ?? template.metaSessoesSemana ?? 3,
    quantidadePrevista: template.quantidadePrevista ?? 12,
    observacoes: template.observacoes ?? "",
  };
}

export function useTreinosWorkspace() {
  const requestIdRef = useRef(0);
  const { tenantId, tenantName, tenantResolved } = useTenantContext();
  const access = useAuthAccess();
  const { toast } = useToast();
  const [templates, setTemplates] = useState<TreinoTemplateResumo[]>([]);
  const [templatesTotal, setTemplatesTotal] = useState(0);
  const [templatesHasNext, setTemplatesHasNext] = useState(false);
  const [templatesSize, setTemplatesSize] = useState(PAGE_SIZE);
  const [templateTotals, setTemplateTotals] = useState<TreinoTemplateTotais>(EMPTY_TEMPLATE_TOTALS);
  const [exercicios, setExercicios] = useState<Exercicio[]>([]);
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [reviewOnly, setReviewOnly] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [createTemplateOpen, setCreateTemplateOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Treino | null>(null);
  const [archiveTemplate, setArchiveTemplate] = useState<Treino | null>(null);
  const [assignmentDialogOpen, setAssignmentDialogOpen] = useState(false);
  const [assignmentTemplate, setAssignmentTemplate] = useState<Treino | null>(null);
  const [assignmentForm, setAssignmentForm] = useState<AssignmentState | null>(null);
  const [latestAssigned, setLatestAssigned] = useState<LatestAssignedState | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [assigning, setAssigning] = useState(false);
  const [archiving, setArchiving] = useState(false);
  const [actionTemplateId, setActionTemplateId] = useState<string | null>(null);

  const editingTemplateForm = useMemo(
    () => (editingTemplate ? buildTemplateForm(editingTemplate) : null),
    [editingTemplate],
  );

  const permissions = useMemo(
    () =>
      resolveTreinoV2Permissions({
        role: access.loading || access.canAccessElevatedModules ? "ADMINISTRADOR" : "PROFESSOR",
      }),
    [access.canAccessElevatedModules, access.loading],
  );

  const alunoOptions = useMemo(
    () =>
      alunos
        .map((aluno) => ({
          id: aluno.id,
          nome: aluno.nome,
          cpf: aluno.cpf,
          email: aluno.email,
        }))
        .sort((left, right) => left.nome.localeCompare(right.nome, "pt-BR")),
    [alunos],
  );

  const loadData = useCallback(async () => {
    if (!tenantId) return;

    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    setLoading(true);
    setError(null);

    try {
      const [templatesResponse, exerciciosResponse, alunosResponse] = await Promise.all([
        listTreinoTemplatesWorkspace({
          tenantId,
          precisaRevisao: reviewOnly || undefined,
          search: search.trim() || undefined,
          page,
          size: PAGE_SIZE,
        }),
        listTreinoExercicios({ tenantId, ativo: true }),
        listAlunosApi({ tenantId, status: "ATIVO", page: 0, size: 200 }),
      ]);

      if (requestIdRef.current !== requestId) return;

      setTemplates(sortTemplatesByRecency(templatesResponse.items));
      setTemplatesTotal(templatesResponse.total ?? templatesResponse.items.length);
      setTemplatesHasNext(templatesResponse.hasNext);
      setTemplatesSize(templatesResponse.size ?? PAGE_SIZE);
      setTemplateTotals(templatesResponse.totais);
      setExercicios(exerciciosResponse);
      setAlunos(extractAlunosFromListResponse(alunosResponse));
    } catch (loadError) {
      if (requestIdRef.current !== requestId) return;
      setError(normalizeErrorMessage(loadError));
      setTemplates([]);
      setTemplatesTotal(0);
      setTemplatesHasNext(false);
      setTemplatesSize(PAGE_SIZE);
      setTemplateTotals(EMPTY_TEMPLATE_TOTALS);
    } finally {
      if (requestIdRef.current === requestId) {
        setLoading(false);
      }
    }
  }, [page, reviewOnly, search, tenantId]);

  useEffect(() => {
    setPage(0);
    setTemplates([]);
    setTemplatesTotal(0);
    setTemplatesHasNext(false);
    setTemplatesSize(PAGE_SIZE);
    setTemplateTotals(EMPTY_TEMPLATE_TOTALS);
    setExercicios([]);
    setAlunos([]);
    setError(null);
    setLatestAssigned(null);
  }, [tenantId]);

  useEffect(() => {
    if (!tenantResolved || !tenantId) return;
    void loadData();
  }, [loadData, tenantId, tenantResolved]);

  async function handleCreateTemplate(data: TreinoForm) {
    if (!tenantId) return;
    await saveTreinoWorkspace({
      tenantId,
      nome: data.nome,
      templateNome: data.templateNome ?? data.nome,
      objetivo: data.objetivo,
      divisao: data.divisao,
      metaSessoesSemana: data.metaSessoesSemana,
      frequenciaPlanejada: data.frequenciaPlanejada,
      quantidadePrevista: data.quantidadePrevista,
      dataInicio: data.dataInicio,
      dataFim: data.dataFim,
      observacoes: data.observacoes,
      ativo: data.ativo,
      status: "RASCUNHO",
      tipoTreino: "PRE_MONTADO",
      itens: buildTreinoItems(data.itens, exercicios),
    });
    setCreateTemplateOpen(false);
    setPage(0);
    await loadData();
    toast({
      title: "Treino padrão criado",
      description: data.templateNome ?? data.nome,
    });
  }

  async function handleEditTemplate(data: TreinoForm) {
    if (!tenantId || !editingTemplate) return;
    await saveTreinoWorkspace({
      tenantId,
      id: editingTemplate.id,
      nome: data.nome,
      templateNome: data.templateNome ?? data.nome,
      objetivo: data.objetivo,
      divisao: data.divisao,
      metaSessoesSemana: data.metaSessoesSemana,
      frequenciaPlanejada: data.frequenciaPlanejada,
      quantidadePrevista: data.quantidadePrevista,
      dataInicio: data.dataInicio,
      dataFim: data.dataFim,
      observacoes: data.observacoes,
      ativo: data.ativo,
      status: editingTemplate.status ?? "RASCUNHO",
      tipoTreino: "PRE_MONTADO",
      itens: buildTreinoItems(data.itens, exercicios),
    });
    setEditingTemplate(null);
    await loadData();
    toast({
      title: "Treino padrão atualizado",
      description: data.templateNome ?? data.nome,
    });
  }

  async function loadTemplateDetail(template: TreinoTemplateResumo): Promise<Treino | null> {
    if (!tenantId) return null;
    setActionTemplateId(template.id);
    try {
      const detail = await getTreinoWorkspace({ tenantId, id: template.id });
      if (!detail) {
        toast({
          title: "Template não encontrado",
          description: "Recarregue a listagem e tente novamente.",
          variant: "destructive",
        });
        return null;
      }
      return detail;
    } catch (detailError) {
      toast({
        title: "Não foi possível carregar o template",
        description: normalizeErrorMessage(detailError),
        variant: "destructive",
      });
      return null;
    } finally {
      setActionTemplateId(null);
    }
  }

  async function openEditTemplate(template: TreinoTemplateResumo) {
    const detail = await loadTemplateDetail(template);
    if (!detail) return;
    setEditingTemplate(detail);
  }

  async function openAssignmentDialog(template: TreinoTemplateResumo) {
    const detail = await loadTemplateDetail(template);
    if (!detail) return;
    setAssignmentTemplate(detail);
    setAssignmentForm(buildAssignmentState(detail));
    setAssignmentDialogOpen(true);
  }

  async function openArchiveDialog(template: TreinoTemplateResumo) {
    const detail = await loadTemplateDetail(template);
    if (!detail) return;
    setArchiveTemplate(detail);
  }

  async function handleAssignTemplate() {
    if (!tenantId || !assignmentTemplate || !assignmentForm) return;
    if (!assignmentForm.alunoId) {
      toast({
        title: "Selecione um aluno para atribuição",
        variant: "destructive",
      });
      return;
    }
    const aluno = alunos.find((item) => item.id === assignmentForm.alunoId);
    if (!aluno) {
      toast({
        title: "Aluno inválido",
        variant: "destructive",
      });
      return;
    }

    setAssigning(true);
    try {
      const assigned = await assignTreinoTemplate({
        tenantId,
        templateId: assignmentTemplate.id,
        templateName: getTemplateDisplayName(assignmentTemplate),
        templateSnapshot: assignmentTemplate,
        alunoId: aluno.id,
        alunoNome: aluno.nome,
        dataInicio: assignmentForm.dataInicio,
        dataFim: assignmentForm.dataFim,
        observacoes: assignmentForm.observacoes,
        metaSessoesSemana: assignmentForm.metaSessoesSemana,
        frequenciaPlanejada: assignmentForm.frequenciaPlanejada,
        quantidadePrevista: assignmentForm.quantidadePrevista,
      });

      setLatestAssigned({
        treinoId: assigned.id,
        nome: assigned.nome ?? getTemplateDisplayName(assignmentTemplate),
        alunoNome: aluno.nome,
      });
      setAssignmentDialogOpen(false);
      setAssignmentTemplate(null);
      setAssignmentForm(null);
      await loadData();
      toast({
        title: "Treino atribuído",
        description: `${getTemplateDisplayName(assignmentTemplate)} para ${aluno.nome}`,
      });
    } catch (assignError) {
      toast({
        title: "Não foi possível atribuir o treino padrão",
        description: normalizeErrorMessage(assignError),
        variant: "destructive",
      });
    } finally {
      setAssigning(false);
    }
  }

  async function handleArchiveTemplate() {
    if (!tenantId || !archiveTemplate || archiving) return;

    setArchiving(true);
    try {
      await saveTreinoWorkspace({
        tenantId,
        id: archiveTemplate.id,
        nome: archiveTemplate.nome ?? getTemplateDisplayName(archiveTemplate),
        templateNome: archiveTemplate.templateNome ?? archiveTemplate.nome ?? getTemplateDisplayName(archiveTemplate),
        objetivo: archiveTemplate.objetivo,
        divisao: archiveTemplate.divisao,
        metaSessoesSemana: archiveTemplate.metaSessoesSemana,
        frequenciaPlanejada: archiveTemplate.frequenciaPlanejada,
        quantidadePrevista: archiveTemplate.quantidadePrevista,
        dataInicio: archiveTemplate.dataInicio,
        dataFim: archiveTemplate.dataFim ?? archiveTemplate.vencimento,
        observacoes: archiveTemplate.observacoes,
        funcionarioId: archiveTemplate.funcionarioId,
        funcionarioNome: archiveTemplate.funcionarioNome,
        status: "ARQUIVADO",
        tipoTreino: "PRE_MONTADO",
        ativo: false,
        itens: archiveTemplate.itens,
      });
      setArchiveTemplate(null);
      await loadData();
      toast({
        title: "Treino padrão arquivado",
        description: getTemplateDisplayName(archiveTemplate),
      });
    } catch (archiveError) {
      toast({
        title: "Não foi possível arquivar o treino padrão",
        description: normalizeErrorMessage(archiveError),
        variant: "destructive",
      });
    } finally {
      setArchiving(false);
    }
  }

  const emptyText = loading
    ? "Carregando templates..."
    : reviewOnly
      ? "Nenhum template com pendências encontrado"
      : search.trim()
        ? "Nenhum template encontrado com os filtros atuais"
        : "Nenhum treino padrão encontrado";

  return {
    // Tenant context
    tenantName,
    tenantResolved,
    DEFAULT_ACTIVE_TENANT_LABEL,

    // Data
    templates,
    templateTotals,
    templatesTotal,
    templatesHasNext,
    templatesSize,
    exercicios,
    alunoOptions,

    // State
    search,
    setSearch,
    page,
    setPage,
    reviewOnly,
    setReviewOnly,
    showInfo,
    setShowInfo,
    createTemplateOpen,
    setCreateTemplateOpen,
    editingTemplate,
    setEditingTemplate,
    editingTemplateForm,
    archiveTemplate,
    setArchiveTemplate,
    assignmentDialogOpen,
    setAssignmentDialogOpen,
    assignmentTemplate,
    setAssignmentTemplate,
    assignmentForm,
    setAssignmentForm,
    latestAssigned,
    loading,
    error,
    assigning,
    archiving,
    actionTemplateId,

    // Permissions
    permissions,

    // Handlers
    loadData,
    handleCreateTemplate,
    handleEditTemplate,
    openEditTemplate,
    openAssignmentDialog,
    openArchiveDialog,
    handleAssignTemplate,
    handleArchiveTemplate,
    emptyText,
  };
}
