"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Archive,
  ClipboardList,
  FileStack,
  PencilLine,
  Search,
  SquareArrowOutUpRight,
  UserPlus,
} from "lucide-react";
import type { TreinoForm } from "@/components/shared/treino-modal";
import dynamic from "next/dynamic";

const TreinoModal = dynamic(
  () => import("@/components/shared/treino-modal").then((mod) => mod.TreinoModal),
  { ssr: false }
);
import { PaginatedTable } from "@/components/shared/paginated-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { ListErrorState } from "@/components/shared/list-states";

const PAGE_SIZE = 12;

type AssignmentState = {
  templateId: string;
  alunoId: string;
  dataInicio: string;
  dataFim: string;
  metaSessoesSemana: number;
  frequenciaPlanejada: number;
  quantidadePrevista: number;
  observacoes: string;
};

type LatestAssignedState = {
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

function formatDateTime(value?: string): string {
  if (!value) return "-";
  const [datePart, timePart] = value.split("T");
  const [year, month, day] = datePart.split("-");
  if (!year || !month || !day) return value;
  const time = timePart?.slice(0, 5);
  return time ? `${day}/${month}/${year} ${time}` : `${day}/${month}/${year}`;
}

function resolveTemplateStatusBadgeVariant(status?: string): "secondary" | "outline" | "destructive" {
  if (status === "ARQUIVADO" || status === "CANCELADO") return "destructive";
  if (status === "RASCUNHO" || status === "EM_REVISAO") return "outline";
  return "secondary";
}

function getTemplateDisplayName(template: { nome?: string | null; templateNome?: string | null }): string {
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

export default function TreinosPage() {
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

  return (
    <div className="space-y-6">
      {createTemplateOpen ? (
        <TreinoModal
          key="template-create-open"
          open
          onClose={() => setCreateTemplateOpen(false)}
          clientes={[]}
          exercicios={exercicios.map((item) => ({
            id: item.id,
            nome: item.nome,
            grupoMuscular: item.grupoMuscularNome ?? item.grupoMuscular,
          }))}
          mode="PRE_MONTADO"
          title="Novo treino padrão"
          description="Cadastre um template reutilizável para encontrar, editar e atribuir com rapidez."
          submitLabel="Salvar treino padrão"
          onSave={handleCreateTemplate}
        />
      ) : null}

      {editingTemplate ? (
        <TreinoModal
          key={editingTemplate.id}
          open
          onClose={() => setEditingTemplate(null)}
          clientes={[]}
          exercicios={exercicios.map((item) => ({
            id: item.id,
            nome: item.nome,
            grupoMuscular: item.grupoMuscularNome ?? item.grupoMuscular,
          }))}
          mode="PRE_MONTADO"
          title="Editar treino padrão"
          description="Ajuste os metadados e os exercícios do template sem sair da listagem operacional."
          submitLabel="Salvar alterações"
          initialData={editingTemplateForm}
          onSave={handleEditTemplate}
        />
      ) : null}

      {assignmentDialogOpen ? (
        <Dialog
          open
          onOpenChange={(open) => {
            setAssignmentDialogOpen(open);
            if (!open) {
              setAssignmentTemplate(null);
              setAssignmentForm(null);
            }
          }}
        >
          <DialogContent className="border-border bg-card sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle className="font-display text-lg font-bold">Atribuir treino padrão</DialogTitle>
              <DialogDescription>
                Formalize a atribuição do template {assignmentTemplate ? getTemplateDisplayName(assignmentTemplate) : "-"} para um aluno.
              </DialogDescription>
            </DialogHeader>

            {assignmentForm ? (
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="template-assignment-aluno">Aluno *</Label>
                  <select
                    id="template-assignment-aluno"
                    value={assignmentForm.alunoId}
                    onChange={(event) =>
                      setAssignmentForm((current) =>
                        current ? { ...current, alunoId: event.target.value } : current,
                      )
                    }
                    className="w-full rounded-md border border-border bg-secondary px-3 py-2 text-sm"
                  >
                    <option value="">Selecione um aluno</option>
                    {alunoOptions.map((aluno) => (
                      <option key={aluno.id} value={aluno.id}>
                        {aluno.nome}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="template-assignment-inicio">Início</Label>
                  <Input
                    id="template-assignment-inicio"
                    type="date"
                    value={assignmentForm.dataInicio}
                    onChange={(event) =>
                      setAssignmentForm((current) =>
                        current ? { ...current, dataInicio: event.target.value } : current,
                      )
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="template-assignment-fim">Fim</Label>
                  <Input
                    id="template-assignment-fim"
                    type="date"
                    value={assignmentForm.dataFim}
                    onChange={(event) =>
                      setAssignmentForm((current) =>
                        current ? { ...current, dataFim: event.target.value } : current,
                      )
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="template-assignment-meta">Meta sessões/semana</Label>
                  <Input
                    id="template-assignment-meta"
                    type="number"
                    value={assignmentForm.metaSessoesSemana}
                    onChange={(event) =>
                      setAssignmentForm((current) =>
                        current
                          ? {
                              ...current,
                              metaSessoesSemana: Number(event.target.value) || 0,
                            }
                          : current,
                      )
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="template-assignment-frequencia">Frequência planejada</Label>
                  <Input
                    id="template-assignment-frequencia"
                    type="number"
                    value={assignmentForm.frequenciaPlanejada}
                    onChange={(event) =>
                      setAssignmentForm((current) =>
                        current
                          ? {
                              ...current,
                              frequenciaPlanejada: Number(event.target.value) || 0,
                            }
                          : current,
                      )
                    }
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="template-assignment-quantidade">Quantidade prevista</Label>
                  <Input
                    id="template-assignment-quantidade"
                    type="number"
                    value={assignmentForm.quantidadePrevista}
                    onChange={(event) =>
                      setAssignmentForm((current) =>
                        current
                          ? {
                              ...current,
                              quantidadePrevista: Number(event.target.value) || 0,
                            }
                          : current,
                      )
                    }
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="template-assignment-observacoes">Observações</Label>
                  <Textarea
                    id="template-assignment-observacoes"
                    value={assignmentForm.observacoes}
                    onChange={(event) =>
                      setAssignmentForm((current) =>
                        current ? { ...current, observacoes: event.target.value } : current,
                      )
                    }
                    className="min-h-24"
                  />
                </div>
              </div>
            ) : null}

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setAssignmentDialogOpen(false);
                  setAssignmentTemplate(null);
                  setAssignmentForm(null);
                }}
              >
                Cancelar
              </Button>
              <Button onClick={() => void handleAssignTemplate()} disabled={assigning || !assignmentForm}>
                {assigning ? "Atribuindo..." : "Atribuir treino"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      ) : null}

      {archiveTemplate ? (
        <Dialog
          open
          onOpenChange={(open) => {
            if (!open) {
              setArchiveTemplate(null);
            }
          }}
        >
          <DialogContent className="border-border bg-card sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="font-display text-lg font-bold">Arquivar treino padrão</DialogTitle>
              <DialogDescription>
                {`Confirme o arquivamento de ${getTemplateDisplayName(archiveTemplate)}. A ação remove o template do fluxo ativo de atribuição.`}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setArchiveTemplate(null)}>
                Cancelar
              </Button>
              <Button variant="destructive" onClick={() => void handleArchiveTemplate()} disabled={archiving}>
                {archiving ? "Arquivando..." : "Arquivar"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      ) : null}

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-display text-2xl font-bold tracking-tight">Treino Padrão</h1>
            <Badge variant="outline">{templateTotals.totalTemplates} template(s)</Badge>
            {templateTotals.comPendencias > 0 ? (
              <Badge variant="secondary">{templateTotals.comPendencias} com pendências</Badge>
            ) : null}
          </div>
          <p className="max-w-3xl text-sm text-muted-foreground">
            Biblioteca administrativa de templates reutilizáveis para a unidade {tenantResolved ? tenantName : DEFAULT_ACTIVE_TENANT_LABEL}, com busca rápida,
            ações operacionais e ordenação por atualização mais recente.
          </p>
          <button
            type="button"
            onClick={() => setShowInfo((current) => !current)}
            className="text-sm font-medium text-gym-accent underline underline-offset-4"
          >
            Saiba mais
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline">
            <Link href="/treinos/atribuidos">
              <ClipboardList className="size-4" />
              Treinos atribuídos
            </Link>
          </Button>
          <Button
            onClick={() => setCreateTemplateOpen(true)}
            disabled={!permissions.canCreateTemplate}
            title={permissions.canCreateTemplate ? "Criar treino padrão" : "Seu perfil não pode criar templates"}
          >
            <FileStack className="size-4" />
            Criar treino padrão
          </Button>
        </div>
      </div>

      {showInfo ? (
        <Card className="border-border bg-card">
          <CardContent className="grid gap-2 p-4 text-sm text-muted-foreground md:grid-cols-3">
            <p>Use a busca principal para localizar templates por nome ou professor, sem misturar treinos atribuídos.</p>
            <p>As ações rápidas desta tela cobrem edição, montagem, atribuição e arquivamento sem inflar a navegação.</p>
            <p>Treinos atribuídos seguem em uma fila separada para preservar governança, vigência e rastreabilidade.</p>
          </CardContent>
        </Card>
      ) : null}

      {latestAssigned ? (
        <Card className="border-border bg-card">
          <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
            <div>
              <p className="text-sm font-semibold text-foreground">Última atribuição criada</p>
              <p className="text-sm text-muted-foreground">
                {latestAssigned.nome} foi atribuído para {latestAssigned.alunoNome}.
              </p>
            </div>
            <Button asChild variant="outline">
              <Link href={`/treinos/${latestAssigned.treinoId}`}>Abrir treino atribuído</Link>
            </Button>
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <TreinosMetricCard
          label="Total de templates"
          value={String(templateTotals.totalTemplates)}
          detail={reviewOnly ? "Filtro de pendências ativo" : "Catálogo retornado pelo endpoint canônico de templates"}
        />
        <TreinosMetricCard
          label="Publicados"
          value={String(templateTotals.publicados)}
          detail="Templates disponíveis para operação"
        />
        <TreinosMetricCard
          label="Em revisão"
          value={String(templateTotals.emRevisao)}
          detail="Templates atualmente em fluxo de revisão"
        />
        <TreinosMetricCard
          label="Com pendências"
          value={String(templateTotals.comPendencias)}
          detail="Templates sinalizados para revisão ou ajuste"
        />
      </div>

      {error ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gym-danger/30 bg-gym-danger/10 px-4 py-3 text-sm text-gym-danger">
          <span>{error}</span>
          <Button variant="outline" className="border-gym-danger/30" onClick={() => void loadData()}>
            Tentar novamente
          </Button>
        </div>
      ) : null}

      <Card className="border-border bg-card">
        <CardHeader className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle className="font-display text-lg">Listagem operacional</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                Busca principal, contador de resultados e ações rápidas para operar a biblioteca de treino padrão.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {templateTotals.comPendencias > 0 ? (
                <Button
                  type="button"
                  variant={reviewOnly ? "default" : "outline"}
                  onClick={() => {
                    setReviewOnly((current) => !current);
                    setPage(0);
                  }}
                >
                  {reviewOnly ? "Mostrar todos" : `Pendências (${templateTotals.comPendencias})`}
                </Button>
              ) : null}
              <div className="relative w-full min-w-72 max-w-md">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(event) => {
                    setSearch(event.target.value);
                    setPage(0);
                  }}
                  className="pl-8"
                  placeholder="Buscar por nome do template ou professor"
                  aria-label="Buscar template por nome ou professor"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <PaginatedTable
            columns={[
              { label: "Nome do treino" },
              { label: "Resumo" },
              { label: "Professor" },
              { label: "Ações" },
            ]}
            items={templates}
            emptyText={emptyText}
            total={templatesTotal}
            page={page}
            pageSize={templatesSize}
            hasNext={templatesHasNext}
            onNext={() => {
              if (templatesHasNext) setPage((current) => current + 1);
            }}
            onPrevious={() => setPage((current) => Math.max(0, current - 1))}
            getRowKey={(template) => template.id}
            itemLabel="templates"
            rowClassName={(template) => (template.precisaRevisao ? "bg-amber-50/40 dark:bg-amber-950/10" : "")}
            renderCells={(template) => {
              const displayName = getTemplateDisplayName(template);
              const templateStatus =
                template.status ?? (template.precisaRevisao ? "EM_REVISAO" : "PUBLICADO");
              const canOperate = template.status !== "ARQUIVADO" && template.status !== "CANCELADO";
              const canEdit = permissions.canEditOwnTemplate && canOperate;
              const canAssign = permissions.canAssignIndividual && canOperate;
              const canArchive = permissions.canArchiveTemplate && canOperate;
              const actionLoading = actionTemplateId === template.id;

              return (
                <>
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <Link href={`/treinos/${template.id}`} className="text-sm font-semibold text-foreground hover:text-gym-accent">
                          {displayName}
                        </Link>
                        <Badge variant={resolveTemplateStatusBadgeVariant(templateStatus)}>{templateStatus}</Badge>
                        {template.versaoTemplate ? <Badge variant="outline">v{template.versaoTemplate}</Badge> : null}
                        {template.precisaRevisao ? <Badge variant="outline">Revisão pendente</Badge> : null}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {template.categoria ? `Categoria ${template.categoria}` : "Categoria não informada"}
                        {template.perfilIndicacao ? ` · Perfil ${template.perfilIndicacao}` : ""}
                      </p>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-1">
                      <span className="text-sm font-medium text-foreground">
                        {template.pendenciasAbertas} pendência(s) aberta(s)
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {template.precisaRevisao
                          ? "Template sinalizado para revisão"
                          : "Template pronto para atribuição e manutenção"}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {template.frequenciaSemanal
                          ? `${template.frequenciaSemanal}x por semana`
                          : "Frequência não informada"}
                        {template.totalSemanas ? ` · ${template.totalSemanas} semana(s)` : ""}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-1">
                      <span className="text-sm font-medium text-foreground">
                        {template.professorNome ?? "Professor não informado"}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        Atualizado em {formatDateTime(template.atualizadoEm)}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        title={
                          actionLoading
                            ? "Carregando detalhes do template"
                            : canEdit
                              ? "Editar treino"
                              : "Seu perfil não pode editar este template"
                        }
                        aria-label={`Editar treino ${displayName}`}
                        disabled={!canEdit || actionLoading}
                        onClick={() => void openEditTemplate(template)}
                      >
                        <PencilLine className="size-4" />
                        Editar
                      </Button>
                      <Button
                        asChild
                        variant="outline"
                        size="sm"
                        title="Abrir montagem"
                        aria-label={`Abrir montagem de ${displayName}`}
                      >
                        <Link href={`/treinos/${template.id}`}>
                          <SquareArrowOutUpRight className="size-4" />
                          Abrir montagem
                        </Link>
                      </Button>
                      <Button
                        size="sm"
                        title={
                          actionLoading
                            ? "Carregando detalhes do template"
                            : canAssign
                              ? "Atribuir treino"
                              : "Seu perfil não pode atribuir templates"
                        }
                        aria-label={`Atribuir treino ${displayName}`}
                        disabled={!canAssign || actionLoading}
                        onClick={() => void openAssignmentDialog(template)}
                      >
                        <UserPlus className="size-4" />
                        Atribuir treino
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        title={
                          actionLoading
                            ? "Carregando detalhes do template"
                            : canArchive
                              ? "Excluir ou arquivar treino"
                              : "Seu perfil não pode arquivar templates"
                        }
                        aria-label={`Arquivar treino ${displayName}`}
                        disabled={!canArchive || actionLoading}
                        onClick={() => void openArchiveDialog(template)}
                      >
                        <Archive className="size-4" />
                        Arquivar
                      </Button>
                    </div>
                  </td>
                </>
              );
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}

function TreinosMetricCard({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <Card className="border-border bg-card">
      <CardContent className="space-y-1 p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className="font-display text-2xl font-bold text-foreground">{value}</p>
        <p className="text-xs text-muted-foreground">{detail}</p>
      </CardContent>
    </Card>
  );
}
