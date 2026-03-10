import type {
  ConverterProspectInput,
  ConverterProspectResponse,
  CreateProspectInput,
  OrigemProspect,
  Prospect,
  ProspectAgendamento,
  ProspectMensagem,
  StatusAgendamento,
  StatusProspect,
} from "@/lib/types";
import { apiRequest } from "./http";

type ProspectApiResponse = Partial<
  Pick<
    Prospect,
    | "id"
    | "tenantId"
    | "nome"
    | "telefone"
    | "email"
    | "cpf"
    | "origem"
    | "status"
    | "observacoes"
    | "dataCriacao"
    | "dataUltimoContato"
    | "motivoPerda"
  >
>;

type ProspectListApiResponse =
  | ProspectApiResponse[]
  | {
      items?: ProspectApiResponse[];
      content?: ProspectApiResponse[];
      data?: ProspectApiResponse[];
      rows?: ProspectApiResponse[];
      result?: ProspectApiResponse[];
      itens?: ProspectApiResponse[];
    };

export interface ProspectUpsertApiRequest {
  tenantId: string;
  nome: string;
  telefone: string;
  email?: string;
  cpf?: string;
  origem: OrigemProspect;
  observacoes?: string;
}

const MAX_PROSPECT_NAME_LENGTH = 100;
const MAX_PROSPECT_PHONE_LENGTH = 20;
const MAX_PROSPECT_EMAIL_LENGTH = 100;
const MAX_PROSPECT_CPF_LENGTH = 14;

function cleanString(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const normalized = value.trim();
  return normalized || undefined;
}

function limitString(value: string | undefined, maxLength: number): string | undefined {
  if (!value) return undefined;
  return value.slice(0, maxLength);
}

function extractProspectItems(response: ProspectListApiResponse): ProspectApiResponse[] {
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

export function buildProspectUpsertApiRequest(
  tenantId: string,
  data: Pick<CreateProspectInput, "nome" | "telefone" | "email" | "cpf" | "origem" | "observacoes">
): ProspectUpsertApiRequest {
  return {
    tenantId,
    nome: limitString(cleanString(data.nome) ?? "", MAX_PROSPECT_NAME_LENGTH) ?? "",
    telefone: limitString(cleanString(data.telefone) ?? "", MAX_PROSPECT_PHONE_LENGTH) ?? "",
    email: limitString(cleanString(data.email), MAX_PROSPECT_EMAIL_LENGTH),
    cpf: limitString(cleanString(data.cpf), MAX_PROSPECT_CPF_LENGTH),
    origem: data.origem,
    observacoes: cleanString(data.observacoes),
  };
}

export function normalizeProspectApiResponse(
  input: ProspectApiResponse,
  fallback?: Partial<Prospect>
): Prospect {
  return {
    id: cleanString(input.id) ?? fallback?.id ?? "",
    tenantId: cleanString(input.tenantId) ?? fallback?.tenantId ?? "",
    responsavelId: fallback?.responsavelId,
    nome: cleanString(input.nome) ?? fallback?.nome ?? "",
    telefone: cleanString(input.telefone) ?? fallback?.telefone ?? "",
    email: cleanString(input.email) ?? fallback?.email,
    cpf: cleanString(input.cpf) ?? fallback?.cpf,
    origem: input.origem ?? fallback?.origem ?? "OUTROS",
    status: input.status ?? fallback?.status ?? "NOVO",
    observacoes: cleanString(input.observacoes) ?? fallback?.observacoes,
    dataCriacao: cleanString(input.dataCriacao) ?? fallback?.dataCriacao ?? new Date().toISOString(),
    dataUltimoContato: cleanString(input.dataUltimoContato) ?? fallback?.dataUltimoContato,
    motivoPerda: cleanString(input.motivoPerda) ?? fallback?.motivoPerda,
    statusLog: fallback?.statusLog,
  };
}

function normalizeProspectList(
  response: ProspectListApiResponse,
  fallback: { tenantId: string }
): Prospect[] {
  return extractProspectItems(response).map((item) => normalizeProspectApiResponse(item, fallback));
}

export async function listProspectsApi(input: {
  tenantId: string;
  status?: StatusProspect;
  origem?: OrigemProspect;
}): Promise<Prospect[]> {
  const response = await apiRequest<ProspectListApiResponse>({
    path: "/api/v1/academia/prospects",
    query: {
      tenantId: input.tenantId,
      status: input.status,
      origem: input.origem,
    },
  });

  return normalizeProspectList(response, { tenantId: input.tenantId });
}

export async function getProspectApi(input: {
  tenantId: string;
  id: string;
}): Promise<Prospect> {
  const response = await apiRequest<ProspectApiResponse>({
    path: `/api/v1/academia/prospects/${input.id}`,
    query: { tenantId: input.tenantId },
  });

  return normalizeProspectApiResponse(response, {
    id: input.id,
    tenantId: input.tenantId,
  });
}

export async function createProspectApi(input: {
  tenantId: string;
  data: CreateProspectInput;
}): Promise<Prospect> {
  const response = await apiRequest<ProspectApiResponse>({
    path: "/api/v1/academia/prospects",
    method: "POST",
    query: { tenantId: input.tenantId },
    body: buildProspectUpsertApiRequest(input.tenantId, input.data),
  });

  return normalizeProspectApiResponse(response, {
    tenantId: input.tenantId,
    nome: input.data.nome,
    telefone: input.data.telefone,
    email: input.data.email,
    cpf: input.data.cpf,
    origem: input.data.origem,
    observacoes: input.data.observacoes,
    responsavelId: input.data.responsavelId,
  });
}

export async function updateProspectApi(input: {
  tenantId: string;
  id: string;
  data: Pick<CreateProspectInput, "nome" | "telefone" | "email" | "cpf" | "origem" | "observacoes">;
}): Promise<Prospect> {
  const response = await apiRequest<ProspectApiResponse>({
    path: `/api/v1/academia/prospects/${input.id}`,
    method: "PUT",
    query: { tenantId: input.tenantId },
    body: buildProspectUpsertApiRequest(input.tenantId, input.data),
  });

  return normalizeProspectApiResponse(response, {
    id: input.id,
    tenantId: input.tenantId,
    nome: input.data.nome,
    telefone: input.data.telefone,
    email: input.data.email,
    cpf: input.data.cpf,
    origem: input.data.origem,
    observacoes: input.data.observacoes,
  });
}

export async function deleteProspectApi(input: {
  tenantId: string;
  id: string;
}): Promise<void> {
  await apiRequest<void>({
    path: `/api/v1/academia/prospects/${input.id}`,
    method: "DELETE",
    query: { tenantId: input.tenantId },
  });
}

export async function updateProspectStatusApi(input: {
  tenantId: string;
  id: string;
  status: StatusProspect;
}): Promise<Prospect> {
  const response = await apiRequest<ProspectApiResponse>({
    path: `/api/v1/academia/prospects/${input.id}/status`,
    method: "PATCH",
    query: {
      tenantId: input.tenantId,
      status: input.status,
    },
  });

  return normalizeProspectApiResponse(response, {
    id: input.id,
    tenantId: input.tenantId,
    status: input.status,
  });
}

export async function marcarProspectPerdidoApi(input: {
  tenantId: string;
  id: string;
  motivo?: string;
}): Promise<Prospect> {
  const response = await apiRequest<ProspectApiResponse>({
    path: `/api/v1/academia/prospects/${input.id}/perdido`,
    method: "POST",
    query: {
      tenantId: input.tenantId,
      motivo: input.motivo,
    },
  });

  return normalizeProspectApiResponse(response, {
    id: input.id,
    tenantId: input.tenantId,
    status: "PERDIDO",
    motivoPerda: input.motivo,
  });
}

export async function checkProspectDuplicateApi(input: {
  tenantId: string;
  telefone?: string;
  cpf?: string;
  email?: string;
}): Promise<boolean> {
  return apiRequest<boolean>({
    path: "/api/v1/academia/prospects/verificar-duplicado",
    query: {
      tenantId: input.tenantId,
      telefone: cleanString(input.telefone),
      cpf: cleanString(input.cpf),
      email: cleanString(input.email),
    },
  });
}

export async function converterProspectApi(input: {
  tenantId: string;
  data: ConverterProspectInput;
}): Promise<ConverterProspectResponse> {
  return apiRequest<ConverterProspectResponse>({
    path: "/api/v1/academia/prospects/converter",
    method: "POST",
    query: { tenantId: input.tenantId },
    body: input.data,
  });
}

export async function listProspectMensagensApi(input: {
  tenantId: string;
  prospectId: string;
}): Promise<ProspectMensagem[]> {
  return apiRequest<ProspectMensagem[]>({
    path: `/api/v1/crm/prospects/${input.prospectId}/mensagens`,
    query: { tenantId: input.tenantId },
  });
}

export async function addProspectMensagemApi(input: {
  tenantId: string;
  prospectId: string;
  data: {
    texto: string;
    autorNome: string;
    autorId?: string;
  };
}): Promise<ProspectMensagem> {
  return apiRequest<ProspectMensagem>({
    path: `/api/v1/crm/prospects/${input.prospectId}/mensagens`,
    method: "POST",
    query: { tenantId: input.tenantId },
    body: input.data,
  });
}

export async function listProspectAgendamentosApi(input: {
  tenantId: string;
  prospectId: string;
}): Promise<ProspectAgendamento[]> {
  return apiRequest<ProspectAgendamento[]>({
    path: `/api/v1/crm/prospects/${input.prospectId}/agendamentos`,
    query: { tenantId: input.tenantId },
  });
}

export async function criarProspectAgendamentoApi(input: {
  tenantId: string;
  prospectId: string;
  data: {
    funcionarioId: string;
    titulo: string;
    data: string;
    hora: string;
    observacoes?: string;
  };
}): Promise<ProspectAgendamento> {
  return apiRequest<ProspectAgendamento>({
    path: `/api/v1/crm/prospects/${input.prospectId}/agendamentos`,
    method: "POST",
    query: { tenantId: input.tenantId },
    body: input.data,
  });
}

export async function updateProspectAgendamentoApi(input: {
  tenantId: string;
  id: string;
  status: StatusAgendamento;
}): Promise<void> {
  await apiRequest<void>({
    path: `/api/v1/crm/prospect-agendamentos/${input.id}/status`,
    method: "PATCH",
    query: {
      tenantId: input.tenantId,
      status: input.status,
    },
  });
}
