import type {
  Atividade,
  AtividadeOcorrenciaAvulsa,
  AtividadeGrade,
  Cargo,
  CategoriaAtividade,
  Funcionario,
  Sala,
} from "@/lib/types";
import { apiRequest } from "./http";
import { normalizeFuncionarioRecord, serializeFuncionarioNotificacoes } from "@/lib/tenant/administrativo-colaboradores";

type AtividadeApiResponse = {
  id?: string;
  tenantId?: string;
  nome?: string;
  descricao?: string | null;
  categoria?: CategoriaAtividade | null;
  icone?: string | null;
  cor?: string | null;
  permiteCheckin?: unknown;
  checkinObrigatorio?: unknown;
  ativo?: unknown;
};

type AtividadeListApiResponse =
  | AtividadeApiResponse[]
  | {
      items?: AtividadeApiResponse[];
      content?: AtividadeApiResponse[];
      data?: AtividadeApiResponse[];
      rows?: AtividadeApiResponse[];
      result?: AtividadeApiResponse[];
      itens?: AtividadeApiResponse[];
    };

type FuncionarioApiResponse = Partial<Funcionario> & {
  id?: string;
  tenantId?: string;
  nome?: string;
  cargoId?: string;
  cargo?: string;
  ativo?: boolean;
  podeMinistrarAulas?: boolean;
};

type FuncionarioListApiResponse =
  | FuncionarioApiResponse[]
  | {
      items?: FuncionarioApiResponse[];
      content?: FuncionarioApiResponse[];
      data?: FuncionarioApiResponse[];
      rows?: FuncionarioApiResponse[];
      result?: FuncionarioApiResponse[];
      itens?: FuncionarioApiResponse[];
    };

export interface AtividadeUpsertApiRequest {
  nome: string;
  descricao?: string;
  categoria: CategoriaAtividade;
  icone?: string;
  cor?: string;
  permiteCheckin: boolean;
  checkinObrigatorio: boolean;
}

const MAX_ATIVIDADE_NAME_LENGTH = 100;
const MAX_ATIVIDADE_ICON_LENGTH = 10;
const MAX_ATIVIDADE_COLOR_LENGTH = 10;
const MAX_ATIVIDADE_DESCRIPTION_LENGTH = 500;

function cleanString(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const normalized = value.trim();
  return normalized || undefined;
}

function limitString(value: string | undefined, maxLength: number): string | undefined {
  if (!value) return undefined;
  return value.slice(0, maxLength);
}

function toBoolean(value: unknown, fallback = false): boolean {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (normalized === "true" || normalized === "1" || normalized === "sim") return true;
    if (normalized === "false" || normalized === "0" || normalized === "nao" || normalized === "não") {
      return false;
    }
  }
  if (typeof value === "number") return value === 1;
  return fallback;
}

function extractAtividadeItems(response: AtividadeListApiResponse): AtividadeApiResponse[] {
  if (Array.isArray(response)) {
    return response;
  }

  return (
    response.items ??
    response.content ??
    response.data ??
    response.rows ??
    response.result ??
    response.itens ??
    []
  );
}

function extractFuncionarioItems(response: FuncionarioListApiResponse): FuncionarioApiResponse[] {
  if (Array.isArray(response)) {
    return response;
  }

  return (
    response.items ??
    response.content ??
    response.data ??
    response.rows ??
    response.result ??
    response.itens ??
    []
  );
}

export function buildAtividadeUpsertApiRequest(
  data: Pick<
    Atividade,
    "nome" | "descricao" | "categoria" | "icone" | "cor" | "permiteCheckin" | "checkinObrigatorio"
  >
): AtividadeUpsertApiRequest {
  const permiteCheckin = toBoolean(data.permiteCheckin, true);

  return {
    nome: limitString(cleanString(data.nome) ?? "", MAX_ATIVIDADE_NAME_LENGTH) ?? "",
    descricao: limitString(cleanString(data.descricao), MAX_ATIVIDADE_DESCRIPTION_LENGTH),
    categoria: data.categoria,
    icone: limitString(cleanString(data.icone), MAX_ATIVIDADE_ICON_LENGTH),
    cor: limitString(cleanString(data.cor), MAX_ATIVIDADE_COLOR_LENGTH),
    permiteCheckin,
    checkinObrigatorio: permiteCheckin
      ? toBoolean(data.checkinObrigatorio, false)
      : false,
  };
}

export function normalizeAtividadeApiResponse(
  input: AtividadeApiResponse,
  fallback?: Partial<Atividade>
): Atividade {
  const permiteCheckin = toBoolean(input.permiteCheckin, fallback?.permiteCheckin ?? true);

  return {
    id: cleanString(input.id) ?? fallback?.id ?? "",
    tenantId: cleanString(input.tenantId) ?? fallback?.tenantId ?? "",
    nome: cleanString(input.nome) ?? fallback?.nome ?? "",
    descricao: cleanString(input.descricao) ?? fallback?.descricao,
    categoria: input.categoria ?? fallback?.categoria ?? "OUTRA",
    icone: cleanString(input.icone) ?? fallback?.icone ?? "",
    cor: cleanString(input.cor) ?? fallback?.cor ?? "#3de8a0",
    permiteCheckin,
    checkinObrigatorio: permiteCheckin
      ? toBoolean(input.checkinObrigatorio, fallback?.checkinObrigatorio ?? false)
      : false,
    ativo: toBoolean(input.ativo, fallback?.ativo ?? true),
  };
}

export async function listCargosApi(apenasAtivos?: boolean): Promise<Cargo[]> {
  return apiRequest<Cargo[]>({
    path: "/api/v1/administrativo/cargos",
    query: { apenasAtivos: apenasAtivos ?? false },
  });
}

export async function createCargoApi(data: { nome: string }): Promise<Cargo> {
  return apiRequest<Cargo>({
    path: "/api/v1/administrativo/cargos",
    method: "POST",
    body: data,
  });
}

export async function updateCargoApi(id: string, data: Partial<Cargo>): Promise<Cargo> {
  return apiRequest<Cargo>({
    path: `/api/v1/administrativo/cargos/${id}`,
    method: "PUT",
    body: { nome: data.nome, ativo: data.ativo },
  });
}

export async function toggleCargoApi(id: string): Promise<Cargo> {
  return apiRequest<Cargo>({
    path: `/api/v1/administrativo/cargos/${id}/toggle`,
    method: "PATCH",
  });
}

export async function deleteCargoApi(id: string): Promise<void> {
  await apiRequest<void>({
    path: `/api/v1/administrativo/cargos/${id}`,
    method: "DELETE",
  });
}

export async function listFuncionariosApi(apenasAtivos?: boolean): Promise<Funcionario[]> {
  const response = await apiRequest<FuncionarioListApiResponse>({
    path: "/api/v1/administrativo/funcionarios",
    query: { apenasAtivos: apenasAtivos ?? true },
  });
  return extractFuncionarioItems(response).map((item) => normalizeFuncionarioRecord(item));
}

export async function createFuncionarioApi(
  data: Omit<Funcionario, "id" | "ativo">
): Promise<Funcionario> {
  const payload = {
    ...data,
    notificacoes: serializeFuncionarioNotificacoes(data.notificacoes),
  };
  const response = await apiRequest<FuncionarioApiResponse>({
    path: "/api/v1/administrativo/funcionarios",
    method: "POST",
    body: payload,
  });
  return normalizeFuncionarioRecord(response, data.tenantId);
}

export async function updateFuncionarioApi(id: string, data: Partial<Funcionario>): Promise<Funcionario> {
  const payload = {
    ...data,
    notificacoes: serializeFuncionarioNotificacoes(data.notificacoes),
  };
  const response = await apiRequest<FuncionarioApiResponse>({
    path: `/api/v1/administrativo/funcionarios/${id}`,
    method: "PUT",
    body: payload,
  });
  return normalizeFuncionarioRecord(response, data.tenantId);
}

export async function toggleFuncionarioApi(id: string): Promise<Funcionario> {
  const response = await apiRequest<FuncionarioApiResponse>({
    path: `/api/v1/administrativo/funcionarios/${id}/toggle`,
    method: "PATCH",
  });
  return normalizeFuncionarioRecord(response);
}

export async function deleteFuncionarioApi(id: string): Promise<void> {
  await apiRequest<void>({
    path: `/api/v1/administrativo/funcionarios/${id}`,
    method: "DELETE",
  });
}

export async function listSalasApi(apenasAtivas?: boolean): Promise<Sala[]> {
  return apiRequest<Sala[]>({
    path: "/api/v1/administrativo/salas",
    query: { apenasAtivas: apenasAtivas ?? false },
  });
}

export async function createSalaApi(data: Omit<Sala, "id" | "tenantId" | "ativo">): Promise<Sala> {
  return apiRequest<Sala>({
    path: "/api/v1/administrativo/salas",
    method: "POST",
    body: data,
  });
}

export async function updateSalaApi(id: string, data: Partial<Sala>): Promise<Sala> {
  return apiRequest<Sala>({
    path: `/api/v1/administrativo/salas/${id}`,
    method: "PUT",
    body: data,
  });
}

export async function toggleSalaApi(id: string): Promise<Sala> {
  return apiRequest<Sala>({
    path: `/api/v1/administrativo/salas/${id}/toggle`,
    method: "PATCH",
  });
}

export async function deleteSalaApi(id: string): Promise<void> {
  await apiRequest<void>({
    path: `/api/v1/administrativo/salas/${id}`,
    method: "DELETE",
  });
}

export async function listAtividadesApi(params: {
  tenantId: string;
  apenasAtivas?: boolean;
  categoria?: CategoriaAtividade;
}): Promise<Atividade[]> {
  const response = await apiRequest<AtividadeListApiResponse>({
    path: "/api/v1/administrativo/atividades",
    query: {
      tenantId: params.tenantId,
      apenasAtivas: params.apenasAtivas,
      categoria: params.categoria,
    },
  });

  return extractAtividadeItems(response).map((item) =>
    normalizeAtividadeApiResponse(item, {
      tenantId: params.tenantId,
    })
  );
}

export async function createAtividadeApi(input: {
  tenantId: string;
  data: Omit<Atividade, "id" | "tenantId" | "ativo">;
}): Promise<Atividade> {
  const response = await apiRequest<AtividadeApiResponse>({
    path: "/api/v1/administrativo/atividades",
    method: "POST",
    query: { tenantId: input.tenantId },
    body: buildAtividadeUpsertApiRequest(input.data),
  });

  return normalizeAtividadeApiResponse(response, {
    tenantId: input.tenantId,
    ...input.data,
    ativo: true,
  });
}

export async function updateAtividadeApi(input: {
  tenantId: string;
  id: string;
  data: Omit<Atividade, "id" | "tenantId">;
}): Promise<Atividade> {
  const response = await apiRequest<AtividadeApiResponse>({
    path: `/api/v1/administrativo/atividades/${input.id}`,
    method: "PUT",
    query: { tenantId: input.tenantId },
    body: buildAtividadeUpsertApiRequest(input.data),
  });

  return normalizeAtividadeApiResponse(response, {
    id: input.id,
    tenantId: input.tenantId,
    ...input.data,
  });
}

export async function toggleAtividadeApi(input: {
  tenantId: string;
  id: string;
}): Promise<Atividade> {
  const response = await apiRequest<AtividadeApiResponse>({
    path: `/api/v1/administrativo/atividades/${input.id}/toggle`,
    method: "PATCH",
    query: { tenantId: input.tenantId },
  });

  return normalizeAtividadeApiResponse(response, {
    id: input.id,
    tenantId: input.tenantId,
  });
}

export async function deleteAtividadeApi(input: {
  tenantId: string;
  id: string;
}): Promise<void> {
  await apiRequest<void>({
    path: `/api/v1/administrativo/atividades/${input.id}`,
    method: "DELETE",
    query: { tenantId: input.tenantId },
  });
}

export async function listAtividadeGradesApi(params?: {
  tenantId?: string;
  atividadeId?: string;
  apenasAtivas?: boolean;
}): Promise<AtividadeGrade[]> {
  return apiRequest<AtividadeGrade[]>({
    path: "/api/v1/administrativo/atividades-grade",
    query: {
      tenantId: params?.tenantId,
      atividadeId: params?.atividadeId,
      apenasAtivas: params?.apenasAtivas,
    },
  });
}

export async function createAtividadeGradeApi(
  data: Omit<AtividadeGrade, "id" | "tenantId" | "ativo">
): Promise<AtividadeGrade> {
  return apiRequest<AtividadeGrade>({
    path: "/api/v1/administrativo/atividades-grade",
    method: "POST",
    body: data,
  });
}

export async function updateAtividadeGradeApi(
  id: string,
  data: Partial<AtividadeGrade>
): Promise<AtividadeGrade> {
  return apiRequest<AtividadeGrade>({
    path: `/api/v1/administrativo/atividades-grade/${id}`,
    method: "PUT",
    body: data,
  });
}

export async function toggleAtividadeGradeApi(id: string): Promise<AtividadeGrade> {
  return apiRequest<AtividadeGrade>({
    path: `/api/v1/administrativo/atividades-grade/${id}/toggle`,
    method: "PATCH",
  });
}

export async function deleteAtividadeGradeApi(id: string): Promise<void> {
  await apiRequest<void>({
    path: `/api/v1/administrativo/atividades-grade/${id}`,
    method: "DELETE",
  });
}

export async function criarOcorrenciaAtividadeGradeApi(input: {
  tenantId: string;
  atividadeGradeId: string;
  data: {
    data: string;
    horaInicio: string;
    horaFim: string;
    capacidade: number;
    local?: string;
    salaNome?: string;
    instrutorNome?: string;
    observacoes?: string;
  };
}): Promise<AtividadeOcorrenciaAvulsa> {
  return apiRequest<AtividadeOcorrenciaAvulsa>({
    path: `/api/v1/administrativo/atividades-grade/${input.atividadeGradeId}/ocorrencias`,
    method: "POST",
    query: {
      tenantId: input.tenantId,
    },
    body: {
      tenantId: input.tenantId,
      ...input.data,
    },
  });
}
