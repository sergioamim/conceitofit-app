import { apiRequest } from "./http";

export type TreinoStatusApi = "RASCUNHO" | "ATIVO" | "ARQUIVADO" | "CANCELADO";
export type TreinoTipoApi = "PRE_MONTADO" | "CUSTOMIZADO";

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
  dataInicio?: string | null;
  dataFim?: string | null;
  status?: TreinoStatusApi | null;
  tipoTreino?: TreinoTipoApi | null;
  treinoBaseId?: string | null;
  ativo: boolean;
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

type CreateTreinoApiInput = {
  clienteId?: string;
  professorId?: string;
  nome: string;
  objetivo?: string;
  observacoes?: string;
  divisao?: string;
  metaSessoesSemana?: number;
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
  descricao?: string | null;
  grupoMuscular?: string | null;
  aparelho?: string | null;
  videoUrl?: string | null;
  unidade?: string | null;
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
  grupoMuscular?: string;
  aparelho?: string;
  videoUrl?: string;
  unidade?: string;
  ativo?: boolean;
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

export async function deleteExercicioApi(input: {
  tenantId?: string;
  id: string;
}): Promise<void> {
  await apiRequest<void>({
    path: `/api/v1/exercicios/${input.id}`,
    method: "DELETE",
    query: { tenantId: input.tenantId },
  });
}
