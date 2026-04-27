import { addDaysToIsoDate, getBusinessTodayIso } from "@/lib/business-date";
import { logger } from "@/lib/shared/logger";
import { parseTreinoV2Metadata } from "@/lib/tenant/treinos/v2-runtime";
import {
  assignTreinoTemplateApi,
  createExercicioApi,
  createGrupoMuscularApi,
  createTreinoApi,
  encerrarTreinoApi,
  getTreinoApi,
  listExerciciosApi,
  listTreinoTemplatesApi,
  listGruposMuscularesApi,
  listTreinosApi,
  registrarExecucaoTreinoApi,
  toggleExercicioApi,
  toggleGrupoMuscularApi,
  updateExercicioApi,
  updateGrupoMuscularApi,
  updateTreinoApi,
  type ExercicioApiResponse,
  type GrupoMuscularApiResponse,
  type TemplateResumoApiResponse,
  type TreinoApiResponse,
  type TreinoExecucaoApiResponse,
  type TreinoRevisaoApiResponse,
  type TreinoTemplateStatusApi,
  type TreinoStatusApi,
} from "@/lib/api/treinos";
import type {
  Exercicio,
  GrupoMuscular,
  PaginatedResult,
  Treino,
  TreinoExecucao,
  TreinoRevisao,
} from "@/lib/types";

type ListTreinosWorkspaceInput = {
  tenantId: string;
  tipoTreino?: Treino["tipoTreino"];
  apenasAtivos?: boolean;
  alunoId?: string;
  status?: Treino["status"];
  search?: string;
  page?: number;
  size?: number;
};

type ListTreinoTemplatesWorkspaceInput = {
  tenantId: string;
  professorId?: string;
  status?: TreinoTemplateStatusApi;
  categoria?: string;
  perfilIndicacao?: string;
  precisaRevisao?: boolean;
  search?: string;
  page?: number;
  size?: number;
};

export type TreinoTemplateResumo = {
  id: string;
  nome: string;
  professorId?: string;
  professorNome?: string;
  status?: TreinoTemplateStatusApi;
  frequenciaSemanal?: number;
  totalSemanas?: number;
  categoria?: string;
  perfilIndicacao?: string;
  versaoTemplate?: number;
  precisaRevisao: boolean;
  pendenciasAbertas: number;
  atualizadoEm?: string;
  /** Wave 8: descrição/observações para preview no card (já com sentinel V2 strippado). */
  observacoes?: string;
  /** Wave 8: grupos musculares distintos cobertos pelo template. */
  gruposMusculares?: string[];
  /** Wave 8: count de treinos ativos derivados deste template. */
  totalAtribuicoes?: number;
  /** Total de sessões (A/B/C) extraído do metadata V2 embarcado. */
  totalSessoes?: number;
  /** Total de exercícios distintos somando todas as sessões. */
  totalExercicios?: number;
};

export type TreinoTemplateTotais = {
  totalTemplates: number;
  publicados: number;
  emRevisao: number;
  comPendencias: number;
};

export type TreinoTemplateListResult = {
  items: TreinoTemplateResumo[];
  page: number;
  size: number;
  total?: number;
  hasNext: boolean;
  totais: TreinoTemplateTotais;
};

type SaveTreinoInput = {
  tenantId: string;
  id?: string;
  alunoId?: string;
  alunoNome?: string;
  nome: string;
  objetivo?: string;
  divisao?: string;
  metaSessoesSemana?: number;
  frequenciaPlanejada?: number;
  quantidadePrevista?: number;
  dataInicio?: string;
  dataFim?: string;
  observacoes?: string;
  funcionarioId?: string;
  funcionarioNome?: string;
  tipoTreino?: Treino["tipoTreino"];
  treinoBaseId?: string;
  templateNome?: string;
  status?: Treino["status"];
  ativo?: boolean;
  itens?: Treino["itens"];
};

type AssignTemplateInput = {
  tenantId: string;
  templateId: string;
  templateName?: string;
  templateSnapshot?: Treino;
  alunoId: string;
  alunoNome: string;
  dataInicio?: string;
  dataFim?: string;
  observacoes?: string;
  metaSessoesSemana?: number;
  frequenciaPlanejada?: number;
  quantidadePrevista?: number;
  frequenciaSemanal?: number;
  totalSemanas?: number;
};

type SaveGrupoMuscularInput = {
  tenantId: string;
  id?: string;
  nome: string;
  descricao?: string;
  categoria?: GrupoMuscular["categoria"];
};

type SaveExercicioInput = {
  tenantId: string;
  id?: string;
  nome: string;
  descricao?: string;
  grupoMuscularId?: string;
  equipamento?: string;
  videoUrl?: string;
  unidade?: string;
};

function nowIso(): string {
  return new Date().toISOString();
}

function todayIso(): string {
  return getBusinessTodayIso();
}

function trimString(value?: string | null): string | undefined {
  const normalized = value?.trim();
  return normalized ? normalized : undefined;
}

function toDate(value?: string | null): Date | null {
  if (!value) return null;
  const normalized = value.length <= 10 ? `${value}T00:00:00` : value;
  const parsed = new Date(normalized);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function diffDays(target?: string | null, reference = todayIso()): number | undefined {
  const dateA = toDate(target);
  const dateB = toDate(reference);
  if (!dateA || !dateB) return undefined;
  const diff = dateA.getTime() - dateB.getTime();
  return Math.round(diff / (24 * 60 * 60 * 1000));
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function resolveStatusValidade(dataFim?: string): Treino["statusValidade"] {
  const days = diffDays(dataFim);
  if (days == null) return null;
  if (days < 0) return "VENCIDO";
  if (days <= 7) return "VENCENDO";
  return "ATIVO";
}

function mapRevisaoApiToDomain(item: TreinoRevisaoApiResponse): TreinoRevisao {
  return {
    id: item.id,
    treinoId: item.treinoId,
    tipo: item.tipo,
    titulo: item.titulo,
    observacao: trimString(item.observacao),
    criadoEm: trimString(item.createdAt) ?? nowIso(),
  };
}

function mapExecucaoApiToDomain(item: TreinoExecucaoApiResponse): TreinoExecucao {
  return {
    id: item.id,
    treinoId: item.treinoId,
    alunoId: trimString(item.alunoId),
    data: item.data,
    status: item.status,
    observacao: trimString(item.observacao),
    cargaMedia: item.cargaMedia == null ? undefined : Number(item.cargaMedia),
    criadoEm: trimString(item.createdAt) ?? nowIso(),
  };
}

function mapGrupoApiToDomain(item: GrupoMuscularApiResponse): GrupoMuscular {
  return {
    id: item.id,
    tenantId: item.tenantId,
    nome: item.nome,
    descricao: trimString(item.descricao),
    categoria: item.categoria ?? undefined,
    ativo: item.ativo !== false,
    criadoEm: trimString(item.createdAt),
    atualizadoEm: trimString(item.updatedAt),
  };
}

function mapExercicioApiToDomain(item: ExercicioApiResponse): Exercicio {
  return {
    id: item.id,
    tenantId: item.tenantId,
    nome: item.nome,
    grupoMuscularId: trimString(item.grupoMuscularId),
    grupoMuscular: trimString(item.grupoMuscularNome) ?? trimString(item.grupoMuscular),
    grupoMuscularNome: trimString(item.grupoMuscularNome) ?? trimString(item.grupoMuscular),
    equipamento: trimString(item.aparelho),
    descricao: trimString(item.descricao),
    videoUrl: trimString(item.videoUrl),
    unidade: trimString(item.unidade),
    ativo: item.ativo !== false,
    criadoEm: trimString(item.createdAt),
    atualizadoEm: trimString(item.updatedAt),
  };
}

function buildStatusCiclo(treino: Treino): Treino["statusCiclo"] {
  if (treino.ativo === false || treino.status === "ARQUIVADO" || treino.status === "CANCELADO") {
    return "ENCERRADO";
  }
  if (treino.tipoTreino === "PRE_MONTADO") return "PLANEJADO";
  if (treino.statusValidade === "VENCIDO") return "ATRASADO";
  const aderencia = treino.aderenciaPercentual ?? 0;
  if (aderencia < 55 && (treino.execucoesConcluidas ?? 0) > 0) return "ATENCAO";
  return "EM_DIA";
}

function decorateTreino(treino: Treino): Treino {
  const dataInicio = treino.dataInicio ?? treino.criadoEm?.slice(0, 10) ?? todayIso();
  const dataFim = treino.dataFim ?? treino.vencimento ?? addDaysToIsoDate(dataInicio, 30);
  const frequenciaPlanejada = treino.frequenciaPlanejada ?? treino.metaSessoesSemana ?? 3;
  const quantidadePrevista = treino.quantidadePrevista ?? Math.max(1, frequenciaPlanejada * 4);
  const execucoes = clone(treino.execucoes ?? []).sort((a, b) => a.data.localeCompare(b.data));
  const revisoes = clone(treino.revisoes ?? []).sort((a, b) => a.criadoEm.localeCompare(b.criadoEm));
  const execucoesConcluidas = execucoes.filter((item) => item.status === "CONCLUIDA").length;
  const aderenciaPercentual = Math.min(100, Math.round((execucoesConcluidas / quantidadePrevista) * 100));
  const ultimaRevisaoEm = revisoes[revisoes.length - 1]?.criadoEm;
  const statusValidade = treino.statusValidade ?? resolveStatusValidade(dataFim);
  const diasParaVencimento = treino.diasParaVencimento ?? diffDays(dataFim);

  const next: Treino = {
    ...treino,
    dataInicio,
    dataFim,
    vencimento: dataFim,
    frequenciaPlanejada,
    quantidadePrevista,
    metaSessoesSemana: treino.metaSessoesSemana ?? frequenciaPlanejada,
    revisaoAtual:
      treino.revisaoAtual ??
      Math.max(1, revisoes.filter((item) => item.tipo === "REVISAO" || item.tipo === "RENOVACAO").length + 1),
    ultimaRevisaoEm,
    proximaRevisaoEm: treino.proximaRevisaoEm ?? addDaysToIsoDate(dataInicio, 14),
    execucoes,
    revisoes,
    execucoesPrevistas: quantidadePrevista,
    execucoesConcluidas,
    aderenciaPercentual,
    statusValidade,
    diasParaVencimento,
  };
  next.statusCiclo = treino.statusCiclo ?? buildStatusCiclo(next);
  return next;
}

function mapTreinoApiToDomain(item: TreinoApiResponse): Treino {
  return decorateTreino({
    id: item.id,
    tenantId: item.tenantId,
    alunoId: trimString(item.alunoId) ?? trimString(item.clienteId),
    alunoNome: trimString(item.alunoNome) ?? trimString(item.clienteNome),
    nome: trimString(item.nome),
    objetivo: trimString(item.objetivo),
    divisao: trimString(item.divisao),
    metaSessoesSemana: item.metaSessoesSemana == null ? undefined : Number(item.metaSessoesSemana),
    frequenciaPlanejada: item.frequenciaPlanejada == null ? undefined : Number(item.frequenciaPlanejada),
    quantidadePrevista: item.quantidadePrevista == null ? undefined : Number(item.quantidadePrevista),
    dataInicio: trimString(item.dataInicio),
    dataFim: trimString(item.dataFim),
    vencimento: trimString(item.dataFim),
    atividadeId: trimString(item.atividadeId),
    atividadeNome: trimString(item.atividadeNome),
    funcionarioId: trimString(item.professorId),
    funcionarioNome: trimString(item.professorNome),
    observacoes: trimString(item.observacoes),
    status: item.status ?? undefined,
    tipoTreino: item.tipoTreino ?? undefined,
    treinoBaseId: trimString(item.treinoBaseId),
    templateNome: trimString(item.templateNome),
    diasParaVencimento: item.diasParaVencimento == null ? undefined : Number(item.diasParaVencimento),
    statusValidade: item.statusValidade ?? undefined,
    statusCiclo: item.statusCiclo ?? undefined,
    revisaoAtual: item.revisaoAtual == null ? undefined : Number(item.revisaoAtual),
    ultimaRevisaoEm: trimString(item.ultimaRevisaoEm),
    proximaRevisaoEm: trimString(item.proximaRevisaoEm),
    atribuidoEm: trimString(item.atribuidoEm),
    encerradoEm: trimString(item.encerradoEm),
    renovadoDeTreinoId: trimString(item.renovadoDeTreinoId),
    execucoesPrevistas: item.execucoesPrevistas == null ? undefined : Number(item.execucoesPrevistas),
    execucoesConcluidas: item.execucoesConcluidas == null ? undefined : Number(item.execucoesConcluidas),
    aderenciaPercentual: item.aderenciaPercentual == null ? undefined : Number(item.aderenciaPercentual),
    ativo: item.ativo !== false,
    criadoEm: trimString(item.createdAt),
    atualizadoEm: trimString(item.updatedAt),
    itens: item.itens?.map((treinoItem) => ({
      id: treinoItem.id,
      treinoId: trimString(treinoItem.treinoId) ?? item.id,
      exercicioId: treinoItem.exercicioId,
      exercicioNome: trimString(treinoItem.exercicioNomeSnapshot),
      grupoMuscularId: trimString(treinoItem.grupoMuscularId),
      grupoMuscularNome: trimString(treinoItem.grupoMuscularNome),
      ordem: Number(treinoItem.ordem ?? 0),
      series: Number(treinoItem.series ?? 0),
      repeticoes: treinoItem.repeticoes == null ? undefined : Number(treinoItem.repeticoes),
      repeticoesMin: treinoItem.repeticoesMin == null ? undefined : Number(treinoItem.repeticoesMin),
      repeticoesMax: treinoItem.repeticoesMax == null ? undefined : Number(treinoItem.repeticoesMax),
      carga: treinoItem.carga == null ? undefined : Number(treinoItem.carga),
      cargaSugerida: treinoItem.cargaSugerida == null ? undefined : Number(treinoItem.cargaSugerida),
      intervaloSegundos:
        treinoItem.intervaloSegundos == null ? undefined : Number(treinoItem.intervaloSegundos),
      tempoExecucaoSegundos:
        treinoItem.tempoExecucaoSegundos == null ? undefined : Number(treinoItem.tempoExecucaoSegundos),
      observacao: trimString(treinoItem.observacao),
      diasSemana: treinoItem.diaDaSemana ?? undefined,
      criadoEm: trimString(treinoItem.createdAt),
      atualizadoEm: trimString(treinoItem.updatedAt),
    })),
    revisoes: item.revisoes?.map(mapRevisaoApiToDomain),
    execucoes: item.execucoes?.map(mapExecucaoApiToDomain),
  });
}

function mapTemplateResumoApiToDomain(item: TemplateResumoApiResponse): TreinoTemplateResumo {
  const parsed = parseTreinoV2Metadata(item.observacoes ?? undefined);
  const sessoes = parsed.metadata?.template?.sessoes ?? [];
  const totalSessoes = sessoes.length > 0 ? sessoes.length : undefined;
  const totalExercicios = sessoes.length > 0
    ? sessoes.reduce((acc, sessao) => acc + (sessao.itens?.length ?? 0), 0)
    : undefined;

  return {
    id: item.id,
    nome: trimString(item.nome) ?? "Template sem nome",
    professorId: trimString(item.professorId),
    professorNome: trimString(item.professorNome),
    status: item.status ?? undefined,
    frequenciaSemanal: item.frequenciaSemanal == null ? undefined : Number(item.frequenciaSemanal),
    totalSemanas: item.totalSemanas == null ? undefined : Number(item.totalSemanas),
    categoria: trimString(item.categoria),
    perfilIndicacao: trimString(item.perfilIndicacao),
    versaoTemplate: item.versaoTemplate == null ? undefined : Number(item.versaoTemplate),
    precisaRevisao: item.precisaRevisao === true,
    pendenciasAbertas: item.pendenciasAbertas == null ? 0 : Number(item.pendenciasAbertas),
    atualizadoEm: trimString(item.atualizadoEm),
    observacoes: trimString(parsed.observacoes),
    gruposMusculares: Array.isArray(item.gruposMusculares)
      ? item.gruposMusculares
          .map((g) => trimString(g))
          .filter((g): g is string => Boolean(g))
      : undefined,
    totalAtribuicoes:
      item.totalAtribuicoes == null ? undefined : Number(item.totalAtribuicoes),
    totalSessoes,
    totalExercicios,
  };
}

function toTreinoApiPayload(input: SaveTreinoInput) {
  const status: TreinoStatusApi =
    input.status ?? (input.ativo === false ? "ARQUIVADO" : "ATIVO");
  const frequenciaSemanal = input.frequenciaPlanejada;
  const totalSemanas =
    frequenciaSemanal && input.quantidadePrevista
      ? Math.max(1, Math.ceil(input.quantidadePrevista / frequenciaSemanal))
      : undefined;
  const nome =
    input.tipoTreino === "PRE_MONTADO"
      ? trimString(input.templateNome) ?? trimString(input.nome) ?? "Treino"
      : trimString(input.nome) ?? trimString(input.templateNome) ?? "Treino";
  return {
    clienteId: trimString(input.alunoId),
    nome,
    objetivo: trimString(input.objetivo),
    observacoes: trimString(input.observacoes),
    divisao: trimString(input.divisao),
    metaSessoesSemana: input.metaSessoesSemana,
    frequenciaSemanal,
    totalSemanas,
    dataInicio: trimString(input.dataInicio),
    dataFim: trimString(input.dataFim),
    status,
    tipoTreino: input.tipoTreino ?? "CUSTOMIZADO",
    treinoBaseId: trimString(input.treinoBaseId),
    professorId: trimString(input.funcionarioId),
    ativo: input.ativo !== false,
    itens: (input.itens ?? []).map((item, index) => ({
      exercicioId: item.exercicioId,
      ordem: item.ordem ?? index + 1,
      series: item.series,
      repeticoes: item.repeticoes,
      repeticoesMin: item.repeticoesMin,
      repeticoesMax: item.repeticoesMax,
      carga: item.carga,
      cargaSugerida: item.cargaSugerida,
      intervaloSegundos: item.intervaloSegundos,
      tempoExecucaoSegundos: item.tempoExecucaoSegundos,
      observacao: trimString(item.observacao),
      diaDaSemana: item.diasSemana,
    })),
  };
}

async function resolveGrupoMuscularNome(tenantId: string, grupoMuscularId?: string): Promise<string | undefined> {
  const normalizedId = trimString(grupoMuscularId);
  if (!normalizedId) return undefined;
  const grupos = await listGruposMuscularesApi({ tenantId });
  return grupos.find((item) => item.id === normalizedId)?.nome;
}

async function findTemplateByIdentity(input: {
  tenantId: string;
  templateId?: string;
  templateName?: string;
  templateSnapshot?: Treino;
}): Promise<Treino | null> {
  const normalizedId = trimString(input.templateId);
  if (normalizedId) {
    try {
      const found = await getTreinoApi({ tenantId: input.tenantId, id: normalizedId });
      return mapTreinoApiToDomain(found);
    } catch (error) {
      logger.warn("[TreinoWorkspace] Template lookup by ID failed, falling back to name", { error });
    }
  }

  const search = trimString(input.templateName) ?? trimString(input.templateSnapshot?.templateNome) ?? trimString(input.templateSnapshot?.nome);
  const response = await listTreinosApi({
    tenantId: input.tenantId,
    tipoTreino: "PRE_MONTADO",
    search,
    page: 0,
    size: 200,
  });
  const matched = response.items
    .map(mapTreinoApiToDomain)
    .find((item) =>
      [item.id, item.nome, item.templateNome]
        .map((value) => value?.trim())
        .some((value) => value && value === normalizedId || value && search && value === search)
    );

  if (matched) return matched;
  if (input.templateSnapshot) {
    return decorateTreino({
      ...input.templateSnapshot,
      tenantId: input.tenantId,
      tipoTreino: "PRE_MONTADO",
      templateNome: input.templateSnapshot.templateNome ?? input.templateSnapshot.nome,
    });
  }
  return null;
}

export async function listTreinoGruposMusculares(input: {
  tenantId: string;
  ativo?: boolean;
  search?: string;
}): Promise<GrupoMuscular[]> {
  return (await listGruposMuscularesApi(input)).map(mapGrupoApiToDomain);
}

export async function saveTreinoGrupoMuscular(input: SaveGrupoMuscularInput): Promise<GrupoMuscular> {
  const response = input.id
    ? await updateGrupoMuscularApi({ tenantId: input.tenantId, id: input.id, data: input })
    : await createGrupoMuscularApi({ tenantId: input.tenantId, data: input });
  return mapGrupoApiToDomain(response);
}

export async function toggleTreinoGrupoMuscular(input: { tenantId: string; id: string }): Promise<GrupoMuscular> {
  return mapGrupoApiToDomain(await toggleGrupoMuscularApi(input));
}

export async function listTreinoExercicios(input: {
  tenantId: string;
  ativo?: boolean;
  search?: string;
}): Promise<Exercicio[]> {
  return (await listExerciciosApi({ tenantId: input.tenantId, ativo: input.ativo, search: input.search })).map(
    mapExercicioApiToDomain
  );
}

export async function saveTreinoExercicio(input: SaveExercicioInput): Promise<Exercicio> {
  const grupoMuscular = await resolveGrupoMuscularNome(input.tenantId, input.grupoMuscularId);
  const response = input.id
    ? await updateExercicioApi({
        tenantId: input.tenantId,
        id: input.id,
        data: {
          nome: input.nome,
          descricao: input.descricao,
          grupoMuscularId: input.grupoMuscularId,
          grupoMuscular,
          aparelho: input.equipamento,
          videoUrl: input.videoUrl,
          unidade: input.unidade,
        },
      })
    : await createExercicioApi({
        tenantId: input.tenantId,
        data: {
          nome: input.nome,
          descricao: input.descricao,
          grupoMuscularId: input.grupoMuscularId,
          grupoMuscular,
          aparelho: input.equipamento,
          videoUrl: input.videoUrl,
          unidade: input.unidade,
          ativo: true,
        },
      });
  return mapExercicioApiToDomain(response);
}

export async function toggleTreinoExercicio(input: { tenantId: string; id: string }): Promise<Exercicio> {
  return mapExercicioApiToDomain(await toggleExercicioApi(input));
}

export async function listTreinosWorkspace(input: ListTreinosWorkspaceInput): Promise<PaginatedResult<Treino>> {
  const response = await listTreinosApi({
    tenantId: input.tenantId,
    clienteId: input.alunoId,
    tipoTreino: input.tipoTreino,
    status: input.status,
    search: input.search,
    page: input.page,
    size: input.size,
  });

  const items = response.items
    .map(mapTreinoApiToDomain)
    .filter((item) => (input.apenasAtivos ? item.ativo !== false : true));

  return {
    ...response,
    items,
    total: input.apenasAtivos ? items.length : response.total,
  };
}

export async function listTreinoTemplatesWorkspace(
  input: ListTreinoTemplatesWorkspaceInput,
): Promise<TreinoTemplateListResult> {
  const response = await listTreinoTemplatesApi({
    tenantId: input.tenantId,
    professorId: input.professorId,
    status: input.status,
    categoria: input.categoria,
    perfilIndicacao: input.perfilIndicacao,
    precisaRevisao: input.precisaRevisao,
    search: input.search,
    page: input.page,
    size: input.size,
  });

  return {
    ...response,
    items: response.items.map(mapTemplateResumoApiToDomain),
    totais: {
      totalTemplates: response.totais.totalTemplates,
      publicados: response.totais.publicados,
      emRevisao: response.totais.emRevisao,
      comPendencias: response.totais.comPendencias,
    },
  };
}

export async function getTreinoWorkspace(input: { tenantId: string; id: string }): Promise<Treino | null> {
  try {
    return mapTreinoApiToDomain(await getTreinoApi(input));
  } catch (error) {
    if (error instanceof Error && /404|não encontrado/i.test(error.message)) {
      return null;
    }
    throw error;
  }
}

export async function saveTreinoWorkspace(input: SaveTreinoInput): Promise<Treino> {
  const response = input.id
    ? await updateTreinoApi({ tenantId: input.tenantId, id: input.id, data: toTreinoApiPayload(input) })
    : await createTreinoApi({ tenantId: input.tenantId, data: toTreinoApiPayload(input) });
  return mapTreinoApiToDomain(response);
}

export async function assignTreinoTemplate(input: AssignTemplateInput): Promise<Treino> {
  const resolvedTemplate = await findTemplateByIdentity(input);
  if (!resolvedTemplate?.id) {
    throw new Error("Template de treino não encontrado.");
  }

  const frequenciaSemanal = input.frequenciaSemanal ?? input.frequenciaPlanejada;
  const totalSemanas =
    input.totalSemanas
    ?? (
      frequenciaSemanal && input.quantidadePrevista
        ? Math.max(1, Math.ceil(input.quantidadePrevista / frequenciaSemanal))
        : undefined
    );

  return mapTreinoApiToDomain(
    await assignTreinoTemplateApi({
      tenantId: input.tenantId,
      id: resolvedTemplate.id,
      data: {
        destinoTipo: "CLIENTE",
        clienteId: input.alunoId,
        dataInicio: input.dataInicio,
        dataFim: input.dataFim,
        observacoes: input.observacoes,
        metaSessoesSemana: input.metaSessoesSemana,
        frequenciaSemanal,
        totalSemanas,
      },
    })
  );
}

export async function encerrarTreinoWorkspace(input: {
  tenantId: string;
  id: string;
  observacao?: string;
}): Promise<Treino> {
  return mapTreinoApiToDomain(
    await encerrarTreinoApi({ tenantId: input.tenantId, id: input.id, data: { observacao: input.observacao } })
  );
}

export async function registrarExecucaoTreinoWorkspace(input: {
  tenantId: string;
  id: string;
  observacao?: string;
  status?: TreinoExecucao["status"];
}): Promise<Treino> {
  return mapTreinoApiToDomain(
    await registrarExecucaoTreinoApi({
      tenantId: input.tenantId,
      id: input.id,
      data: { observacao: input.observacao, status: input.status },
    })
  );
}
