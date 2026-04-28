import { ApiRequestError, apiRequest } from "./http";

export type TreinoStatusApi = "RASCUNHO" | "ATIVO" | "ARQUIVADO" | "CANCELADO";
export type TreinoTipoApi = "PRE_MONTADO" | "CUSTOMIZADO";
export type TreinoTemplateStatusApi =
  | TreinoStatusApi
  | "PUBLICADO"
  | "EM_REVISAO";

export interface TreinoApiResponse {
  id: string;
  tenantId: string;
  clienteId?: string | null;
  alunoId?: string | null;
  professorId?: string | null;
  itens?: TreinoItemApiResponse[] | null;
  divisao?: string | null;
  metaSessoesSemana?: number | null;
  alunoNome?: string | null;
  clienteNome?: string | null;
  professorNome?: string | null;
  atividadeId?: string | null;
  atividadeNome?: string | null;
  nome: string;
  objetivo?: string | null;
  observacoes?: string | null;
  /** Wave C.2: meta específica do aluno. */
  objetivoIndividual?: string | null;
  /** Wave C.2: restrições/lesões. */
  restricoes?: string | null;
  /** Wave C.2: notas livres do professor. */
  notasProfessor?: string | null;
  frequenciaPlanejada?: number | null;
  quantidadePrevista?: number | null;
  dataInicio?: string | null;
  dataFim?: string | null;
  status?: TreinoStatusApi | null;
  tipoTreino?: TreinoTipoApi | null;
  treinoBaseId?: string | null;
  templateNome?: string | null;
  ativo: boolean;
  revisaoAtual?: number | null;
  ultimaRevisaoEm?: string | null;
  proximaRevisaoEm?: string | null;
  statusCiclo?: "PLANEJADO" | "EM_DIA" | "ATENCAO" | "ATRASADO" | "ENCERRADO" | null;
  atribuidoEm?: string | null;
  encerradoEm?: string | null;
  renovadoDeTreinoId?: string | null;
  execucoesPrevistas?: number | null;
  execucoesConcluidas?: number | null;
  aderenciaPercentual?: number | null;
  revisoes?: TreinoRevisaoApiResponse[] | null;
  execucoes?: TreinoExecucaoApiResponse[] | null;
  atualizadoPor?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  diasParaVencimento?: number | null;
  statusValidade?: "ATIVO" | "VENCENDO" | "VENCIDO" | null;
}

export interface TreinoItemApiResponse {
  id: string;
  treinoId: string;
  exercicioId: string;
  exercicioNomeSnapshot?: string | null;
  grupoMuscularId?: string | null;
  grupoMuscularNome?: string | null;
  ordem: number;
  series: number;
  repeticoes?: number | null;
  repeticoesMin?: number | null;
  repeticoesMax?: number | null;
  carga?: number | null;
  cargaSugerida?: number | null;
  intervaloSegundos?: number | null;
  tempoExecucaoSegundos?: number | null;
  observacao?: string | null;
  diaDaSemana?: string[] | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface TreinoRevisaoApiResponse {
  id: string;
  treinoId: string;
  tipo: "CRIACAO" | "REVISAO" | "RENOVACAO" | "ENCERRAMENTO" | "ATRIBUICAO";
  titulo: string;
  observacao?: string | null;
  createdAt?: string | null;
}

export interface TreinoExecucaoApiResponse {
  id: string;
  treinoId: string;
  alunoId?: string | null;
  data: string;
  status: "INICIADA" | "CONCLUIDA" | "PARCIAL" | "ABANDONADA" | "CANCELADA";
  observacao?: string | null;
  cargaMedia?: number | null;
  createdAt?: string | null;
}

type TreinoPagedApiResponse = {
  items?: TreinoApiResponse[];
  content?: TreinoApiResponse[];
  data?: TreinoApiResponse[];
  rows?: TreinoApiResponse[];
  page?: number;
  size?: number;
  total?: number;
  hasNext?: boolean;
};

export interface TemplateResumoApiResponse {
  id: string;
  nome: string;
  professorId?: string | null;
  professorNome?: string | null;
  status?: TreinoTemplateStatusApi | null;
  frequenciaSemanal?: number | null;
  totalSemanas?: number | null;
  categoria?: string | null;
  perfilIndicacao?: string | null;
  versaoTemplate?: number | null;
  precisaRevisao?: boolean | null;
  pendenciasAbertas?: number | null;
  atualizadoEm?: string | null;
  observacoes?: string | null;
  gruposMusculares?: string[] | null;
  totalAtribuicoes?: number | null;
}

export interface TemplateListTotalsApiResponse {
  totalTemplates?: number | null;
  publicados?: number | null;
  emRevisao?: number | null;
  comPendencias?: number | null;
}

type TemplateListPageApiResponse = {
  items?: TemplateResumoApiResponse[];
  content?: TemplateResumoApiResponse[];
  data?: TemplateResumoApiResponse[];
  rows?: TemplateResumoApiResponse[];
  page?: number;
  size?: number;
  total?: number;
  hasNext?: boolean;
  totais?: TemplateListTotalsApiResponse | null;
};

export interface ListTreinosApiInput {
  tenantId?: string;
  clienteId?: string;
  professorId?: string;
  tipoTreino?: TreinoTipoApi;
  status?: TreinoStatusApi;
  expiracao?: "VENCENDO" | "VENCIDO" | "TODOS";
  dataInicio?: string;
  dataFim?: string;
  search?: string;
  visor?: "TODOS" | "MEUS";
  page?: number;
  size?: number;
}

export interface ListTreinosApiResult {
  items: TreinoApiResponse[];
  page: number;
  size: number;
  total?: number;
  hasNext: boolean;
}

export interface ListTreinoTemplatesApiInput {
  tenantId?: string;
  professorId?: string;
  status?: TreinoTemplateStatusApi;
  categoria?: string;
  perfilIndicacao?: string;
  precisaRevisao?: boolean;
  search?: string;
  page?: number;
  size?: number;
}

export interface ListTreinoTemplatesApiResult {
  items: TemplateResumoApiResponse[];
  page: number;
  size: number;
  total?: number;
  hasNext: boolean;
  totais: {
    totalTemplates: number;
    publicados: number;
    emRevisao: number;
    comPendencias: number;
  };
}

type CreateTreinoApiInput = {
  clienteId?: string;
  professorId?: string;
  nome: string;
  objetivo?: string;
  observacoes?: string;
  /** Wave C.2 (Item 1): personalização do aluno editável via PUT/POST. */
  objetivoIndividual?: string;
  restricoes?: string;
  notasProfessor?: string;
  divisao?: string;
  metaSessoesSemana?: number;
  frequenciaSemanal?: number;
  totalSemanas?: number;
  dataInicio?: string;
  dataFim?: string;
  status?: TreinoStatusApi;
  tipoTreino?: TreinoTipoApi;
  treinoBaseId?: string;
  ativo?: boolean;
  itens?: Array<{
    exercicioId: string;
    ordem: number;
    series: number;
    repeticoes?: number;
    repeticoesMin?: number;
    repeticoesMax?: number;
    carga?: number;
    cargaSugerida?: number;
    intervaloSegundos?: number;
    tempoExecucaoSegundos?: number;
    observacao?: string;
    diaDaSemana?: string[];
  }>;
};

export type UpdateTreinoApiInput = {
  clienteId?: string | null;
  professorId?: string | null;
  nome: string;
  objetivo?: string | null;
  observacoes?: string | null;
  /** Wave C.2 (Item 1): personalização — null preserva valor existente no backend. */
  objetivoIndividual?: string | null;
  restricoes?: string | null;
  notasProfessor?: string | null;
  divisao?: string | null;
  metaSessoesSemana?: number | null;
  frequenciaSemanal?: number | null;
  totalSemanas?: number | null;
  dataInicio?: string | null;
  dataFim?: string | null;
  status?: TreinoStatusApi | null;
  tipoTreino?: TreinoTipoApi | null;
  treinoBaseId?: string | null;
  ativo?: boolean | null;
  itens?: Array<{
    exercicioId: string;
    ordem: number;
    series: number;
    repeticoes?: number;
    carga?: number;
    intervaloSegundos?: number;
    tempoExecucaoSegundos?: number;
    observacao?: string;
    diaDaSemana?: string[];
  }>;
};

export interface ExercicioApiResponse {
  id: string;
  tenantId: string;
  nome: string;
  grupoMuscularId?: string | null;
  descricao?: string | null;
  grupoMuscular?: string | null;
  grupoMuscularNome?: string | null;
  aparelho?: string | null;
  videoUrl?: string | null;
  midiaUrl?: string | null;
  thumbnailUrl?: string | null;
  unidade?: string | null;
  ativo: boolean;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface GrupoMuscularApiResponse {
  id: string;
  tenantId: string;
  nome: string;
  descricao?: string | null;
  categoria?: "SUPERIOR" | "INFERIOR" | "CORE" | "FUNCIONAL" | "OUTRO" | null;
  ativo: boolean;
  createdAt?: string | null;
  updatedAt?: string | null;
}

type ExercicioListApiResponse =
  | ExercicioApiResponse[]
  | {
      items?: ExercicioApiResponse[];
      content?: ExercicioApiResponse[];
      data?: ExercicioApiResponse[];
      rows?: ExercicioApiResponse[];
    };

type CreateExercicioApiInput = {
  nome: string;
  descricao?: string;
  grupoMuscularId?: string;
  grupoMuscular?: string;
  aparelho?: string;
  videoUrl?: string;
  unidade?: string;
  ativo?: boolean;
};

type UpdateExercicioApiInput = Partial<CreateExercicioApiInput> & {
  nome: string;
};

function toNumber(value: unknown, fallback: number): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function extractTreinoItems(value: TreinoPagedApiResponse): TreinoApiResponse[] {
  const candidates = [value.items, value.content, value.data, value.rows];
  const firstArray = candidates.find(Array.isArray);
  return Array.isArray(firstArray) ? firstArray : [];
}

function extractTemplateItems(value: TemplateListPageApiResponse): TemplateResumoApiResponse[] {
  const candidates = [value.items, value.content, value.data, value.rows];
  const firstArray = candidates.find(Array.isArray);
  return Array.isArray(firstArray) ? firstArray : [];
}

function normalizeTemplateTotals(
  totals: TemplateListTotalsApiResponse | null | undefined,
  fallbackTotal: number,
): ListTreinoTemplatesApiResult["totais"] {
  return {
    totalTemplates: toNumber(totals?.totalTemplates, fallbackTotal),
    publicados: toNumber(totals?.publicados, 0),
    emRevisao: toNumber(totals?.emRevisao, 0),
    comPendencias: toNumber(totals?.comPendencias, 0),
  };
}

function extractExercicios(value: ExercicioListApiResponse): ExercicioApiResponse[] {
  if (Array.isArray(value)) return value;
  const candidates = [value.items, value.content, value.data, value.rows];
  const firstArray = candidates.find(Array.isArray);
  return Array.isArray(firstArray) ? firstArray : [];
}

export async function listTreinosApi(input: ListTreinosApiInput): Promise<ListTreinosApiResult> {
  const response = await apiRequest<TreinoApiResponse[] | TreinoPagedApiResponse>({
    path: "/api/v1/treinos",
    query: {
      tenantId: input.tenantId,
      clienteId: input.clienteId,
      professorId: input.professorId,
      tipoTreino: input.tipoTreino,
      status: input.status,
      expiracao: input.expiracao,
      dataInicio: input.dataInicio,
      dataFim: input.dataFim,
      search: input.search,
      visor: input.visor,
      page: input.page,
      size: input.size,
    },
  });

  if (Array.isArray(response)) {
    return {
      items: response,
      page: input.page ?? 0,
      size: input.size ?? response.length,
      total: response.length,
      hasNext: false,
    };
  }

  const items = extractTreinoItems(response);
  const page = toNumber(response.page, input.page ?? 0);
  const fallbackSize = input.size ?? items.length;
  const size = toNumber(response.size, fallbackSize || 1);
  const total = response.total == null ? undefined : toNumber(response.total, items.length);
  const hasNext =
    typeof response.hasNext === "boolean"
      ? response.hasNext
      : typeof total === "number"
      ? (page + 1) * size < total
      : false;

  return {
    items,
    page,
    size,
    total,
    hasNext,
  };
}

export async function listTreinoTemplatesApi(
  input: ListTreinoTemplatesApiInput,
): Promise<ListTreinoTemplatesApiResult> {
  const response = await apiRequest<TemplateListPageApiResponse>({
    path: "/api/v1/treinos/templates",
    query: {
      tenantId: input.tenantId,
      professorId: input.professorId,
      status: input.status,
      categoria: input.categoria,
      perfilIndicacao: input.perfilIndicacao,
      precisaRevisao: input.precisaRevisao,
      search: input.search,
      page: input.page,
      size: input.size,
    },
  });

  const items = extractTemplateItems(response);
  const page = toNumber(response.page, input.page ?? 0);
  const fallbackSize = input.size ?? items.length;
  const size = toNumber(response.size, fallbackSize || 1);
  const total = response.total == null ? undefined : toNumber(response.total, items.length);
  const hasNext =
    typeof response.hasNext === "boolean"
      ? response.hasNext
      : typeof total === "number"
        ? (page + 1) * size < total
        : false;

  return {
    items,
    page,
    size,
    total,
    hasNext,
    totais: normalizeTemplateTotals(response.totais, total ?? items.length),
  };
}

export async function getTreinoApi(input: {
  tenantId?: string;
  id: string;
}): Promise<TreinoApiResponse> {
  return apiRequest<TreinoApiResponse>({
    path: `/api/v1/treinos/${input.id}`,
    method: "GET",
    query: { tenantId: input.tenantId },
  });
}

export async function createTreinoApi(input: {
  tenantId?: string;
  data: CreateTreinoApiInput;
}): Promise<TreinoApiResponse> {
  return apiRequest<TreinoApiResponse>({
    path: "/api/v1/treinos",
    method: "POST",
    query: { tenantId: input.tenantId },
    body: input.data,
  });
}

export async function updateTreinoApi(input: {
  tenantId?: string;
  id: string;
  data: UpdateTreinoApiInput;
}): Promise<TreinoApiResponse> {
  return apiRequest<TreinoApiResponse>({
    path: `/api/v1/treinos/${input.id}`,
    method: "PUT",
    query: { tenantId: input.tenantId },
    body: input.data,
  });
}

export async function listExerciciosApi(input?: {
  tenantId?: string;
  ativo?: boolean;
  search?: string;
  page?: number;
  size?: number;
}): Promise<ExercicioApiResponse[]> {
  const response = await apiRequest<ExercicioListApiResponse>({
    path: "/api/v1/exercicios",
    query: {
      tenantId: input?.tenantId,
      ativo: input?.ativo,
      search: input?.search,
      page: input?.page,
      size: input?.size,
    },
  });
  return extractExercicios(response);
}

export async function getExercicioApi(input: {
  tenantId?: string;
  id: string;
}): Promise<ExercicioApiResponse> {
  return apiRequest<ExercicioApiResponse>({
    path: `/api/v1/exercicios/${input.id}`,
    query: { tenantId: input.tenantId },
  });
}

export interface TemplateUsandoExercicioApiResponse {
  treinoId: string;
  treinoNome: string;
  versaoTemplate?: number | null;
  totalItens: number;
}

/**
 * Wave J.1 — "Usado em": templates padrão (PRE_MONTADO) ativos do
 * tenant que usam um dado exercício. Endpoint backend novo.
 */
export async function listTemplatesUsandoExercicioApi(input: {
  tenantId?: string;
  id: string;
}): Promise<TemplateUsandoExercicioApiResponse[]> {
  return apiRequest<TemplateUsandoExercicioApiResponse[]>({
    path: `/api/v1/exercicios/${input.id}/templates-usando`,
    query: { tenantId: input.tenantId },
  });
}

// ─── Wave J.2 — Progresso do aluno (endpoint real) ─────────────────
export interface ProgressoAlunoKpis {
  adesaoPct: number;
  sessoesCompletas: number;
  totalSessoes: number;
  totalVolume: number;
  totalPRs: number;
}

export interface ProgressoAlunoHistorico {
  id: string;
  data: string;
  treinoNome?: string | null;
  duracaoMin: number;
  completa: boolean;
}

export interface ProgressoAlunoProgressao {
  semana: string;
  cargaKg: number;
}

export interface ProgressoAlunoApiResponse {
  kpis: ProgressoAlunoKpis;
  heatmap: number[];
  historico: ProgressoAlunoHistorico[];
  progressao: ProgressoAlunoProgressao[];
  janelaDias: number;
}

export async function getProgressoAlunoApi(input: {
  tenantId?: string;
  alunoId: string;
  semanas?: number;
}): Promise<ProgressoAlunoApiResponse> {
  return apiRequest<ProgressoAlunoApiResponse>({
    path: `/api/v1/treinos/aluno/${input.alunoId}/progresso`,
    query: { tenantId: input.tenantId, semanas: input.semanas },
  });
}

export async function createExercicioApi(input: {
  tenantId?: string;
  data: CreateExercicioApiInput;
}): Promise<ExercicioApiResponse> {
  return apiRequest<ExercicioApiResponse>({
    path: "/api/v1/exercicios",
    method: "POST",
    query: { tenantId: input.tenantId },
    body: input.data,
  });
}

export async function updateExercicioApi(input: {
  tenantId?: string;
  id: string;
  data: UpdateExercicioApiInput;
}): Promise<ExercicioApiResponse> {
  return apiRequest<ExercicioApiResponse>({
    path: `/api/v1/exercicios/${input.id}`,
    method: "PUT",
    query: { tenantId: input.tenantId },
    body: input.data,
  });
}

export async function toggleExercicioApi(input: {
  tenantId?: string;
  id: string;
}): Promise<ExercicioApiResponse> {
  return apiRequest<ExercicioApiResponse>({
    path: `/api/v1/exercicios/${input.id}/toggle`,
    method: "PATCH",
    query: { tenantId: input.tenantId },
  });
}

type GrupoMuscularListApiResponse =
  | GrupoMuscularApiResponse[]
  | {
      items?: GrupoMuscularApiResponse[];
      content?: GrupoMuscularApiResponse[];
      data?: GrupoMuscularApiResponse[];
      rows?: GrupoMuscularApiResponse[];
    };

function extractGruposMusculares(value: GrupoMuscularListApiResponse): GrupoMuscularApiResponse[] {
  if (Array.isArray(value)) return value;
  const candidates = [value.items, value.content, value.data, value.rows];
  const firstArray = candidates.find(Array.isArray);
  return Array.isArray(firstArray) ? firstArray : [];
}

export async function listGruposMuscularesApi(input?: {
  tenantId?: string;
}): Promise<GrupoMuscularApiResponse[]> {
  const response = await apiRequest<GrupoMuscularListApiResponse>({
    path: "/api/v1/grupos-musculares",
    query: {
      tenantId: input?.tenantId,
    },
  });
  return extractGruposMusculares(response);
}

export async function duplicateTreinoTemplateApi(input: {
  tenantId?: string;
  id: string;
}): Promise<TreinoApiResponse> {
  return apiRequest<TreinoApiResponse>({
    path: `/api/v1/treinos/${input.id}/duplicar-template`,
    method: "POST",
    query: { tenantId: input.tenantId },
  });
}

export async function assignTreinoTemplateApi(input: {
  tenantId?: string;
  id: string;
  data: {
    destinoTipo: "CLIENTE";
    clienteId: string;
    professorId?: string;
    dataInicio?: string;
    dataFim?: string;
    observacoes?: string;
    metaSessoesSemana?: number;
    frequenciaSemanal?: number;
    totalSemanas?: number;
    /** Wave C.2: campos individualizados da atribuição. */
    objetivoIndividual?: string;
    restricoes?: string;
    notasProfessor?: string;
  };
}): Promise<TreinoApiResponse> {
  const paths = [
    `/api/v1/treinos/templates/${input.id}/atribuir`,
    `/api/v1/treinos/${input.id}/atribuir`,
  ];

  let lastError: unknown;
  for (const path of paths) {
    try {
      return await apiRequest<TreinoApiResponse>({
        path,
        method: "POST",
        query: { tenantId: input.tenantId },
        body: input.data,
      });
    } catch (error) {
      if (error instanceof ApiRequestError && error.status === 404) {
        lastError = error;
        continue;
      }
      throw error;
    }
  }

  throw lastError instanceof Error ? lastError : new Error("Não foi possível atribuir o treino padrão.");
}

export async function revisarTreinoApi(input: {
  tenantId?: string;
  id: string;
  data?: {
    observacao?: string;
    proximaRevisaoEm?: string;
  };
}): Promise<TreinoApiResponse> {
  return apiRequest<TreinoApiResponse>({
    path: `/api/v1/treinos/${input.id}/revisar`,
    method: "POST",
    query: { tenantId: input.tenantId },
    body: input.data,
  });
}

export async function encerrarTreinoApi(input: {
  tenantId?: string;
  id: string;
  data?: {
    observacao?: string;
  };
}): Promise<TreinoApiResponse> {
  return apiRequest<TreinoApiResponse>({
    path: `/api/v1/treinos/${input.id}/encerrar-ciclo`,
    method: "POST",
    query: { tenantId: input.tenantId },
    body: input.data,
  });
}

export async function renovarTreinoApi(input: {
  tenantId?: string;
  id: string;
  data?: {
    dataInicio?: string;
    dataFim?: string;
    quantidadePrevista?: number;
    metaSessoesSemana?: number;
    frequenciaPlanejada?: number;
  };
}): Promise<TreinoApiResponse> {
  return apiRequest<TreinoApiResponse>({
    path: `/api/v1/treinos/${input.id}/renovar`,
    method: "PATCH",
    query: { tenantId: input.tenantId },
    body: input.data,
  });
}

export async function registrarExecucaoTreinoApi(input: {
  tenantId?: string;
  id: string;
  data?: {
    data?: string;
    observacao?: string;
    cargaMedia?: number;
    status?: "INICIADA" | "CONCLUIDA" | "PARCIAL" | "ABANDONADA" | "CANCELADA";
    iniciadaEm?: string;
    finalizadaEm?: string;
  };
}): Promise<TreinoApiResponse> {
  return apiRequest<TreinoApiResponse>({
    path: `/api/v1/treinos/${input.id}/execucoes`,
    method: "POST",
    query: { tenantId: input.tenantId },
    body: input.data,
  });
}

// ─── Prescrição / Ciclo de Treino (Task #540) ────────────────────────────

/**
 * Consulta a prescrição/ciclo atual do treino.
 * GET /api/v1/treinos/{id}/prescricao — TreinoCicloService.TreinoCicloResponse.
 */
export async function getPrescricaoTreinoApi(input: {
  tenantId: string;
  id: string;
}): Promise<import("@/lib/types").TreinoCicloResponse | null> {
  try {
    return await apiRequest<import("@/lib/types").TreinoCicloResponse>({
      path: `/api/v1/treinos/${input.id}/prescricao`,
      query: { tenantId: input.tenantId },
    });
  } catch {
    return null;
  }
}

/**
 * Cria ou atualiza a prescrição inicial do treino.
 * POST /api/v1/treinos/{id}/prescricao — PrescricaoTreinoRequest.
 */
export async function criarPrescricaoTreinoApi(input: {
  tenantId: string;
  id: string;
  data: import("@/lib/types").PrescricaoTreinoPayload;
}): Promise<import("@/lib/types").TreinoCicloResponse> {
  return apiRequest<import("@/lib/types").TreinoCicloResponse>({
    path: `/api/v1/treinos/${input.id}/prescricao`,
    method: "POST",
    query: { tenantId: input.tenantId },
    body: input.data,
  });
}

/**
 * Encerra o ciclo/prescrição ativa do treino.
 * POST /api/v1/treinos/{id}/encerrar-ciclo.
 */
export async function encerrarCicloTreinoApi(input: {
  tenantId: string;
  id: string;
}): Promise<import("@/lib/types").TreinoCicloResponse> {
  return apiRequest<import("@/lib/types").TreinoCicloResponse>({
    path: `/api/v1/treinos/${input.id}/encerrar-ciclo`,
    method: "POST",
    query: { tenantId: input.tenantId },
  });
}

/**
 * Dashboard de aderência de treinos (visão do professor).
 * GET /api/v1/treinos/aderencia — TreinoCicloService.AderenciaTreinoResponse.
 * Task #539.
 */
export async function listAderenciaTreinosApi(input: {
  tenantId: string;
  clienteId?: string;
  professorId?: string;
  status?: "ATIVO" | "ENCERRADO" | "PAUSADO" | "CANCELADO";
}): Promise<import("@/lib/types").AderenciaTreino[]> {
  const response = await apiRequest<unknown>({
    path: "/api/v1/treinos/aderencia",
    query: {
      tenantId: input.tenantId,
      clienteId: input.clienteId,
      professorId: input.professorId,
      status: input.status,
    },
  });
  if (Array.isArray(response)) {
    return response as import("@/lib/types").AderenciaTreino[];
  }
  const list = (response as { items?: unknown; data?: unknown; content?: unknown })?.items ??
    (response as { data?: unknown })?.data ??
    (response as { content?: unknown })?.content ??
    [];
  return (Array.isArray(list) ? list : []) as import("@/lib/types").AderenciaTreino[];
}
