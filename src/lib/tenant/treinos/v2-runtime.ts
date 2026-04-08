"use client";

import { addDaysToIsoDate, getBusinessTodayIso } from "@/lib/business-date";
import { logger } from "@/lib/shared/logger";
import type { TreinoV2CatalogExercise } from "@/lib/api/treinos-v2";
import {
  createTreinoV2MetricField,
  validateTreinoV2Template,
  type TreinoV2AssignedStatus,
  type TreinoV2AssignmentConflictPolicy,
  type TreinoV2AssignmentJob,
  type TreinoV2AssignmentResultItem,
  type TreinoV2AssignmentResolution,
  type TreinoV2Block,
  type TreinoV2Template,
  type TreinoV2TemplateSnapshot,
  type TreinoV2TemplateStatus,
} from "@/lib/tenant/treinos/v2-domain";
import type { Exercicio, Treino, TreinoItem } from "@/lib/types";

const TREINO_META_MARKER = "[[TREINO_V2_META]]";
const EXERCICIO_META_MARKER = "[[TREINO_V2_EXERCICIO_META]]";

export type TreinoV2EditorMode = "TEMPLATE" | "ASSIGNED";

export interface TreinoV2ExerciseCatalogMetadata {
  codigo?: string;
  grupoExercicioNome?: string;
  tipo: TreinoV2CatalogExercise["tipo"];
  objetivoPadrao?: TreinoV2CatalogExercise["objetivoPadrao"];
  midiaTipo?: TreinoV2CatalogExercise["midiaTipo"];
  midiaUrl?: string;
  disponivelNoApp: boolean;
  similarExerciseIds: string[];
}

export interface TreinoV2PersistedAssignedMetadata {
  status: TreinoV2AssignedStatus;
  origem: "TEMPLATE" | "MANUAL" | "MASSA" | "REUTILIZACAO" | "RENOVACAO";
  snapshot?: TreinoV2TemplateSnapshot;
  customizadoLocalmente: boolean;
  assignmentJobId?: string;
  conflictPolicy?: TreinoV2AssignmentConflictPolicy;
  resolution?: TreinoV2AssignmentResolution;
}

export interface TreinoV2PersistedTemplateMetadata {
  status: TreinoV2TemplateStatus;
  versao: number;
  categoria?: string;
  versaoSimplificadaHabilitada: boolean;
  blocos: TreinoV2Block[];
  assignmentHistory: TreinoV2AssignmentJob[];
}

export interface TreinoV2PersistedMetadata {
  schemaVersion: 1;
  template?: TreinoV2PersistedTemplateMetadata;
  assigned?: TreinoV2PersistedAssignedMetadata;
}

export interface TreinoV2EditorSeed {
  mode: TreinoV2EditorMode;
  nome: string;
  frequenciaSemanal: number;
  totalSemanas: number;
  categoria: string;
  observacoes: string;
  templateStatus: TreinoV2TemplateStatus;
  assignedStatus: TreinoV2AssignedStatus;
  versao: number;
  versaoSimplificadaHabilitada: boolean;
  blocos: TreinoV2Block[];
  assignmentHistory: TreinoV2AssignmentJob[];
  snapshot?: TreinoV2TemplateSnapshot;
  customizadoLocalmente: boolean;
  origem: "TEMPLATE" | "MANUAL" | "MASSA" | "REUTILIZACAO" | "RENOVACAO";
}

export interface TreinoV2TemplateGovernanceSummary {
  status: TreinoV2TemplateStatus;
  validationIssues: ReturnType<typeof validateTreinoV2Template>;
  needsReview: boolean;
  reviewReason: "RASCUNHO" | "EM_REVISAO" | "PENDENCIA_TECNICA" | null;
  impactedClients: number;
  assignmentJobs: number;
  versao: number;
}

export interface TreinoV2AssignedGovernanceSummary {
  status: TreinoV2AssignedStatus;
  templateOrigemId?: string;
  templateOrigemNome?: string;
  templateVersion?: number;
  snapshotId?: string;
  customizadoLocalmente: boolean;
  origem: TreinoV2EditorSeed["origem"];
}

type ParseEmbeddedResult<T> = {
  text: string;
  payload: T | null;
};

function trimString(value?: string | null): string {
  return value?.trim() ?? "";
}

function parseEmbeddedJson<T>(value: string | undefined, marker: string): ParseEmbeddedResult<T> {
  const raw = value ?? "";
  const markerIndex = raw.indexOf(marker);
  if (markerIndex === -1) {
    return {
      text: raw.trim(),
      payload: null,
    };
  }

  const text = raw.slice(0, markerIndex).trim();
  const encoded = raw.slice(markerIndex + marker.length).trim();

  try {
    return {
      text,
      payload: JSON.parse(encoded) as T,
    };
  } catch (error) {
    logger.warn("[TreinoV2Runtime] Failed to parse embedded JSON", { error });
    return {
      text: raw.trim(),
      payload: null,
    };
  }
}

function appendEmbeddedJson(text: string | undefined, marker: string, payload: unknown): string {
  const normalizedText = trimString(text);
  const serialized = JSON.stringify(payload);
  return normalizedText ? `${normalizedText}\n\n${marker}\n${serialized}` : `${marker}\n${serialized}`;
}

function inferTemplateStatus(treino: Treino): TreinoV2TemplateStatus {
  if (treino.status === "ARQUIVADO" || treino.ativo === false) return "ARQUIVADO";
  if (treino.status === "RASCUNHO") return "RASCUNHO";
  return "PUBLICADO";
}

function inferAssignedStatus(treino: Treino): TreinoV2AssignedStatus {
  if (treino.ativo === false || treino.statusCiclo === "ENCERRADO" || treino.status === "CANCELADO") {
    return "ENCERRADO";
  }
  const today = getBusinessTodayIso();
  if (trimString(treino.dataInicio) && treino.dataInicio! > today) {
    return "AGENDADO";
  }
  return "ATIVO";
}

function inferTotalSemanas(treino: Treino): number {
  const frequencia = treino.frequenciaPlanejada ?? treino.metaSessoesSemana ?? 3;
  const quantidade = treino.quantidadePrevista;
  if (quantidade && frequencia > 0) {
    return Math.max(1, Math.ceil(quantidade / frequencia));
  }

  if (treino.dataInicio && treino.dataFim) {
    const start = new Date(`${treino.dataInicio}T00:00:00`);
    const end = new Date(`${treino.dataFim}T00:00:00`);
    if (!Number.isNaN(start.getTime()) && !Number.isNaN(end.getTime())) {
      const diffMs = end.getTime() - start.getTime();
      const diffDays = Math.round(diffMs / (24 * 60 * 60 * 1000));
      return Math.max(1, Math.ceil((diffDays + 1) / 7));
    }
  }

  return 4;
}

function parseRepRange(raw?: string): {
  repeticoes?: number;
  repeticoesMin?: number;
  repeticoesMax?: number;
} {
  const normalized = trimString(raw).replace(/\s+/g, "");
  if (!normalized) return {};

  if (/^\d+$/.test(normalized)) {
    return { repeticoes: Number(normalized) };
  }

  const match = normalized.match(/^(\d+)-(\d+)$/);
  if (match) {
    return {
      repeticoesMin: Number(match[1]),
      repeticoesMax: Number(match[2]),
    };
  }

  return {};
}

function resolveMetricNumber(raw: string | undefined, fallback?: number): number | undefined {
  const normalized = trimString(raw).replace(",", ".");
  if (!normalized) return fallback;
  const numeric = Number(normalized);
  return Number.isFinite(numeric) ? numeric : fallback;
}

function createBlockId(seed: string, index: number): string {
  return `${seed}-${index + 1}`;
}

function buildDefaultBlocks(treino: Treino): TreinoV2Block[] {
  const blockName = trimString(treino.divisao) || "A";
  const items = (treino.itens ?? [])
    .slice()
    .sort((left, right) => left.ordem - right.ordem)
    .map((item, index) => mapTreinoItemToV2(item, index));

  return [
    {
      id: createBlockId("bloco", 0),
      nome: blockName,
      ordem: 1,
      itens: items,
    },
  ];
}

function mapTreinoItemToV2(item: TreinoItem, index: number) {
  const repetitions =
    item.repeticoes != null
      ? String(item.repeticoes)
      : item.repeticoesMin != null || item.repeticoesMax != null
        ? `${item.repeticoesMin ?? "-"}-${item.repeticoesMax ?? "-"}`
        : "";

  return {
    id: item.id || `item-${index + 1}`,
    exerciseId: item.exercicioId,
    exerciseNome: item.exercicioNome,
    ordem: item.ordem ?? index + 1,
    objetivo: item.grupoMuscularNome,
    observacoes: item.observacao,
    series: createTreinoV2MetricField(item.series),
    repeticoes: createTreinoV2MetricField(repetitions),
    carga: item.cargaSugerida != null || item.carga != null ? createTreinoV2MetricField(item.cargaSugerida ?? item.carga) : undefined,
    intervalo: item.intervaloSegundos != null ? createTreinoV2MetricField(item.intervaloSegundos) : undefined,
    tecnicas: [],
  };
}

function sanitizeBlockName(name: string, index: number): string {
  const normalized = trimString(name).toUpperCase();
  return normalized || String.fromCharCode(65 + index);
}

export function createEmptyTreinoV2Block(index: number): TreinoV2Block {
  return {
    id: createBlockId("bloco", index),
    nome: String.fromCharCode(65 + index),
    ordem: index + 1,
    itens: [],
  };
}

export function parseTreinoV2Metadata(observacoes?: string): {
  observacoes: string;
  metadata: TreinoV2PersistedMetadata | null;
} {
  const parsed = parseEmbeddedJson<TreinoV2PersistedMetadata>(observacoes, TREINO_META_MARKER);
  return {
    observacoes: parsed.text,
    metadata: parsed.payload,
  };
}

export function parseExercicioV2Metadata(descricao?: string): {
  descricao: string;
  metadata: TreinoV2ExerciseCatalogMetadata;
} {
  const parsed = parseEmbeddedJson<Partial<TreinoV2ExerciseCatalogMetadata>>(descricao, EXERCICIO_META_MARKER);
  return {
    descricao: parsed.text,
    metadata: {
      tipo: "MUSCULACAO",
      disponivelNoApp: true,
      similarExerciseIds: [],
      ...parsed.payload,
    },
  };
}

export function serializeExercicioV2Descricao(input: {
  descricao?: string;
  metadata: TreinoV2ExerciseCatalogMetadata;
}): string {
  return appendEmbeddedJson(input.descricao, EXERCICIO_META_MARKER, input.metadata);
}

export function toTreinoV2CatalogExercise(exercicio: Exercicio): TreinoV2CatalogExercise {
  const parsed = parseExercicioV2Metadata(exercicio.descricao);
  return {
    id: exercicio.id,
    tenantId: exercicio.tenantId,
    nome: exercicio.nome,
    codigo: parsed.metadata.codigo,
    grupoExercicioNome: parsed.metadata.grupoExercicioNome ?? exercicio.equipamento,
    grupoMuscularId: exercicio.grupoMuscularId,
    grupoMuscularNome: exercicio.grupoMuscularNome ?? exercicio.grupoMuscular,
    tipo: parsed.metadata.tipo,
    objetivoPadrao: parsed.metadata.objetivoPadrao,
    unidadeCarga: exercicio.unidade,
    descricao: parsed.descricao,
    midiaTipo: parsed.metadata.midiaTipo,
    midiaUrl: parsed.metadata.midiaUrl ?? exercicio.videoUrl,
    disponivelNoApp: parsed.metadata.disponivelNoApp,
    similarExerciseIds: parsed.metadata.similarExerciseIds,
    ativo: exercicio.ativo,
    createdAt: exercicio.criadoEm,
    updatedAt: exercicio.atualizadoEm,
  };
}

export function buildTreinoV2EditorSeed(treino: Treino): TreinoV2EditorSeed {
  const parsed = parseTreinoV2Metadata(treino.observacoes);
  const metadata = parsed.metadata;
  const mode: TreinoV2EditorMode = treino.tipoTreino === "PRE_MONTADO" ? "TEMPLATE" : "ASSIGNED";
  const templateMeta = metadata?.template;
  const assignedMeta = metadata?.assigned;

  return {
    mode,
    nome: trimString(treino.templateNome) || trimString(treino.nome) || "Treino sem nome",
    frequenciaSemanal: treino.frequenciaPlanejada ?? treino.metaSessoesSemana ?? 3,
    totalSemanas: inferTotalSemanas(treino),
    categoria: trimString(templateMeta?.categoria) || trimString(treino.objetivo),
    observacoes: parsed.observacoes,
    templateStatus: templateMeta?.status ?? inferTemplateStatus(treino),
    assignedStatus: assignedMeta?.status ?? inferAssignedStatus(treino),
    versao: templateMeta?.versao ?? assignedMeta?.snapshot?.templateVersion ?? 1,
    versaoSimplificadaHabilitada: templateMeta?.versaoSimplificadaHabilitada ?? false,
    blocos:
      templateMeta?.blocos?.length
        ? templateMeta.blocos.map((block, index) => ({
            ...block,
            nome: sanitizeBlockName(block.nome, index),
            ordem: index + 1,
            itens: block.itens.map((item, itemIndex) => ({
              ...item,
              ordem: itemIndex + 1,
            })),
          }))
        : assignedMeta?.snapshot?.blocos?.length
          ? assignedMeta.snapshot.blocos.map((block, index) => ({
              ...block,
              nome: sanitizeBlockName(block.nome, index),
              ordem: index + 1,
              itens: block.itens.map((item, itemIndex) => ({
                ...item,
                ordem: itemIndex + 1,
              })),
            }))
          : buildDefaultBlocks(treino),
    assignmentHistory: templateMeta?.assignmentHistory ?? [],
    snapshot: assignedMeta?.snapshot,
    customizadoLocalmente: assignedMeta?.customizadoLocalmente ?? false,
    origem: assignedMeta?.origem ?? (treino.atribuicaoOrigem === "TEMPLATE" ? "TEMPLATE" : "MANUAL"),
  };
}

export function buildTreinoV2Template(input: {
  treino: Treino;
  editor: Pick<
    TreinoV2EditorSeed,
    "nome" | "frequenciaSemanal" | "totalSemanas" | "categoria" | "templateStatus" | "versao" | "versaoSimplificadaHabilitada" | "blocos"
  >;
}): TreinoV2Template {
  const template: TreinoV2Template = {
    id: input.treino.id,
    tenantId: input.treino.tenantId,
    nome: input.editor.nome,
    frequenciaSemanal: input.editor.frequenciaSemanal,
    totalSemanas: input.editor.totalSemanas,
    categoria: trimString(input.editor.categoria) || undefined,
    createdById: input.treino.funcionarioId,
    createdByName: input.treino.funcionarioNome,
    status: input.editor.templateStatus,
    precisaRevisao: input.editor.templateStatus === "RASCUNHO" || input.editor.templateStatus === "EM_REVISAO",
    versao: input.editor.versao,
    versaoSimplificadaHabilitada: input.editor.versaoSimplificadaHabilitada,
    blocos: input.editor.blocos,
    validationIssues: [],
  };
  template.validationIssues = validateTreinoV2Template(template);
  return template;
}

export function buildTreinoV2TemplateSnapshot(input: {
  treino: Treino;
  editor: Pick<
    TreinoV2EditorSeed,
    "nome" | "frequenciaSemanal" | "totalSemanas" | "categoria" | "versao" | "blocos"
  >;
  publishedAt?: string;
}): TreinoV2TemplateSnapshot {
  const template = buildTreinoV2Template({
    treino: input.treino,
    editor: {
      ...input.editor,
      templateStatus: "PUBLICADO",
      versaoSimplificadaHabilitada: false,
    },
  });

  return {
    id: `snapshot-${input.treino.id}-v${input.editor.versao}`,
    templateId: input.treino.id,
    templateVersion: input.editor.versao,
    templateNome: input.editor.nome,
    publishedAt: input.publishedAt,
    frequenciaSemanal: input.editor.frequenciaSemanal,
    totalSemanas: input.editor.totalSemanas,
    categoria: trimString(input.editor.categoria) || undefined,
    blocos: template.blocos,
    validationIssues: template.validationIssues ?? [],
  };
}

export function buildTreinoV2AssignmentJob(input: {
  tenantId: string;
  templateId: string;
  templateVersion: number;
  mode: "INDIVIDUAL" | "MASSA";
  conflictPolicy: TreinoV2AssignmentConflictPolicy;
  dataInicio: string;
  dataFim?: string;
  requestedById: string;
  requestedByName?: string;
  targets: Array<{ alunoId: string; alunoNome?: string }>;
  resultItems: TreinoV2AssignmentResultItem[];
}): TreinoV2AssignmentJob {
  const totalSelecionado = input.targets.length;
  const totalAtribuido = input.resultItems.filter((item) => item.resolution !== "IGNORAR" && !item.motivo).length;
  const totalIgnorado = input.resultItems.filter((item) => item.resolution === "IGNORAR").length;
  const totalComErro = input.resultItems.filter((item) => item.motivo && !item.assignedWorkoutId).length;
  const status =
    totalComErro > 0 && totalAtribuido > 0
      ? "CONCLUIDO_PARCIAL"
      : totalComErro > 0
        ? "FALHOU"
        : "CONCLUIDO";

  return {
    id: `job-${Date.now()}`,
    tenantId: input.tenantId,
    templateId: input.templateId,
    templateVersion: input.templateVersion,
    requestedAt: new Date().toISOString(),
    mode: input.mode,
    status,
    conflictPolicy: input.conflictPolicy,
    dataInicio: input.dataInicio,
    dataFim: input.dataFim,
    targets: input.targets,
    requestedById: input.requestedById,
    requestedByName: input.requestedByName,
    resultado: {
      totalSelecionado,
      totalAtribuido,
      totalIgnorado,
      totalComErro,
      itens: input.resultItems,
    },
  };
}

export function appendTreinoV2AssignmentHistory(
  history: TreinoV2AssignmentJob[],
  job: TreinoV2AssignmentJob,
): TreinoV2AssignmentJob[] {
  return [job, ...history].slice(0, 20);
}

export function buildTreinoV2Observacoes(input: {
  observacoes?: string;
  template?: TreinoV2PersistedTemplateMetadata;
  assigned?: TreinoV2PersistedAssignedMetadata;
}): string {
  return appendEmbeddedJson(input.observacoes, TREINO_META_MARKER, {
    schemaVersion: 1,
    template: input.template,
    assigned: input.assigned,
  } satisfies TreinoV2PersistedMetadata);
}

export function buildTreinoV2PersistedTemplateMetadata(input: {
  treino: Treino;
  editor: Pick<
    TreinoV2EditorSeed,
    "nome" | "frequenciaSemanal" | "totalSemanas" | "categoria" | "templateStatus" | "versao" | "versaoSimplificadaHabilitada" | "blocos" | "assignmentHistory"
  >;
}): TreinoV2PersistedTemplateMetadata {
  return {
    status: input.editor.templateStatus,
    versao: input.editor.versao,
    categoria: trimString(input.editor.categoria) || undefined,
    versaoSimplificadaHabilitada: input.editor.versaoSimplificadaHabilitada,
    blocos: input.editor.blocos,
    assignmentHistory: input.editor.assignmentHistory,
  };
}

export function buildTreinoV2PersistedAssignedMetadata(input: {
  treino: Treino;
  editor: Pick<TreinoV2EditorSeed, "assignedStatus" | "snapshot" | "customizadoLocalmente" | "origem">;
  assignmentJobId?: string;
  conflictPolicy?: TreinoV2AssignmentConflictPolicy;
  resolution?: TreinoV2AssignmentResolution;
}): TreinoV2PersistedAssignedMetadata {
  return {
    status: input.editor.assignedStatus,
    origem: input.editor.origem,
    snapshot: input.editor.snapshot,
    customizadoLocalmente: input.editor.customizadoLocalmente,
    assignmentJobId: input.assignmentJobId,
    conflictPolicy: input.conflictPolicy,
    resolution: input.resolution,
  };
}

export function buildTreinoV2SaveInput(input: {
  treino: Treino;
  editor: TreinoV2EditorSeed;
}): {
  nome: string;
  templateNome?: string;
  objetivo?: string;
  metaSessoesSemana: number;
  frequenciaPlanejada: number;
  quantidadePrevista: number;
  dataInicio: string;
  dataFim: string;
  observacoes: string;
  ativo: boolean;
  status: Treino["status"];
  itens: Array<{
    exercicioId: string;
    ordem: number;
    series: number;
    repeticoes?: number;
    repeticoesMin?: number;
    repeticoesMax?: number;
    carga?: number;
    cargaSugerida?: number;
    intervaloSegundos?: number;
    observacao?: string;
  }>;
} {
  const flattenedItems = input.editor.blocos.flatMap((block, blockIndex) =>
    block.itens.map((item, itemIndex) => {
      const repeticoes = parseRepRange(item.repeticoes.raw);
      const carga = resolveMetricNumber(item.carga?.raw);
      const intervaloSegundos = resolveMetricNumber(item.intervalo?.raw);

      return {
        exercicioId: item.exerciseId ?? "",
        ordem: blockIndex * 100 + itemIndex + 1,
        series: resolveMetricNumber(item.series.raw, 1) ?? 1,
        repeticoes: repeticoes.repeticoes,
        repeticoesMin: repeticoes.repeticoesMin,
        repeticoesMax: repeticoes.repeticoesMax,
        carga,
        cargaSugerida: carga,
        intervaloSegundos,
        observacao: trimString(item.observacoes) || undefined,
      };
    }),
  );

  const quantidadePrevista = Math.max(1, input.editor.frequenciaSemanal * input.editor.totalSemanas);
  const dataInicio = input.treino.dataInicio ?? getBusinessTodayIso();
  const dataFim = input.treino.dataFim ?? addDaysToIsoDate(dataInicio, input.editor.totalSemanas * 7);

  const templateMetadata =
    input.editor.mode === "TEMPLATE"
      ? buildTreinoV2PersistedTemplateMetadata({
          treino: input.treino,
          editor: {
            nome: input.editor.nome,
            frequenciaSemanal: input.editor.frequenciaSemanal,
            totalSemanas: input.editor.totalSemanas,
            categoria: input.editor.categoria,
            templateStatus: input.editor.templateStatus,
            versao: input.editor.versao,
            versaoSimplificadaHabilitada: input.editor.versaoSimplificadaHabilitada,
            blocos: input.editor.blocos,
            assignmentHistory: input.editor.assignmentHistory,
          },
        })
      : undefined;

  const assignedMetadata =
    input.editor.mode === "ASSIGNED"
      ? buildTreinoV2PersistedAssignedMetadata({
          treino: input.treino,
          editor: {
            assignedStatus: input.editor.assignedStatus,
            snapshot: input.editor.snapshot,
            customizadoLocalmente: input.editor.customizadoLocalmente,
            origem: input.editor.origem,
          },
        })
      : undefined;

  const status: Treino["status"] =
    input.editor.mode === "TEMPLATE"
      ? input.editor.templateStatus === "ARQUIVADO"
        ? "ARQUIVADO"
        : input.editor.templateStatus === "RASCUNHO" || input.editor.templateStatus === "EM_REVISAO"
          ? "RASCUNHO"
          : "ATIVO"
      : input.editor.assignedStatus === "ENCERRADO" || input.editor.assignedStatus === "SUBSTITUIDO"
        ? "CANCELADO"
        : "ATIVO";

  return {
    nome: input.editor.nome,
    templateNome: input.treino.tipoTreino === "PRE_MONTADO" ? input.editor.nome : input.treino.templateNome,
    objetivo: trimString(input.editor.categoria) || undefined,
    metaSessoesSemana: input.editor.frequenciaSemanal,
    frequenciaPlanejada: input.editor.frequenciaSemanal,
    quantidadePrevista,
    dataInicio,
    dataFim,
    observacoes: buildTreinoV2Observacoes({
      observacoes: input.editor.observacoes,
      template: templateMetadata,
      assigned: assignedMetadata,
    }),
    ativo:
      input.editor.mode === "TEMPLATE"
        ? input.editor.templateStatus !== "ARQUIVADO"
        : input.editor.assignedStatus !== "ENCERRADO" && input.editor.assignedStatus !== "SUBSTITUIDO",
    status,
    itens: flattenedItems,
  };
}

function summarizeTreinoV2TemplateGovernance(treino: Treino): TreinoV2TemplateGovernanceSummary {
  const editor = buildTreinoV2EditorSeed(treino);
  const template = buildTreinoV2Template({
    treino,
    editor: {
      nome: editor.nome,
      frequenciaSemanal: editor.frequenciaSemanal,
      totalSemanas: editor.totalSemanas,
      categoria: editor.categoria,
      templateStatus: editor.templateStatus,
      versao: editor.versao,
      versaoSimplificadaHabilitada: editor.versaoSimplificadaHabilitada,
      blocos: editor.blocos,
    },
  });
  const validationIssues = validateTreinoV2Template(template);
  const impactedClients = new Set(
    editor.assignmentHistory.flatMap((job) => job.resultado?.itens.map((item) => item.alunoId) ?? []),
  ).size;
  const reviewReason =
    editor.templateStatus === "EM_REVISAO"
      ? "EM_REVISAO"
      : editor.templateStatus === "RASCUNHO"
        ? "RASCUNHO"
        : validationIssues.some((issue) => issue.severity === "ERROR")
          ? "PENDENCIA_TECNICA"
          : null;

  return {
    status: editor.templateStatus,
    validationIssues,
    needsReview: reviewReason !== null,
    reviewReason,
    impactedClients,
    assignmentJobs: editor.assignmentHistory.length,
    versao: editor.versao,
  };
}

export function summarizeTreinoV2AssignedGovernance(treino: Treino): TreinoV2AssignedGovernanceSummary {
  const editor = buildTreinoV2EditorSeed(treino);
  return {
    status: editor.assignedStatus,
    templateOrigemId: treino.treinoBaseId ?? editor.snapshot?.templateId,
    templateOrigemNome: treino.templateNome ?? editor.snapshot?.templateNome,
    templateVersion: editor.snapshot?.templateVersion,
    snapshotId: editor.snapshot?.id,
    customizadoLocalmente: editor.customizadoLocalmente,
    origem: editor.origem,
  };
}
