/**
 * CRM API client.
 *
 * ⚠️ DÉBITOS CONHECIDOS (smoke test 2026-04-10, audit P1 2026-03-28):
 *
 * Os endpoints abaixo NÃO existem no backend Java atual e retornam 404.
 * Todas as funções consumidoras já estão protegidas com
 * `mapUnavailableCapability` que converte 404/405/501 em mensagem amigável
 * "Backend ainda não expõe ... neste ambiente". O FE não quebra — apenas
 * a feature fica em estado "indisponível":
 *
 *   - GET  /api/v1/crm/pipeline-stages    → listCrmPipelineStagesApi
 *   - GET  /api/v1/crm/cadencias          → listCrmCadenciasApi
 *   - POST /api/v1/crm/cadencias          → createCrmCadenciaApi
 *   - PUT  /api/v1/crm/cadencias/{id}     → updateCrmCadenciaApi
 *   - GET  /api/v1/crm/atividades         → listCrmActivitiesApi
 *
 * Quando o BE implementar, basta nenhum trabalho FE — funções continuam
 * como estão e param de retornar erro amigável.
 *
 * Ver tambem: src/lib/api/crm-cadencias.ts (modulo separado, mesma
 * estrategia) e ADR-001 secao 5.
 */
import type {
  CampanhaCRM,
  CampanhaStatus,
  ConverterProspectInput,
  ConverterProspectResponse,
  CrmActivity,
  CrmAutomation,
  CrmCadencia,
  CrmPipelineStage,
  CrmPlaybook,
  CrmTask,
  CrmTaskPrioridade,
  CrmTaskStatus,
  CrmTaskTipo,
  CreateProspectInput,
  OrigemProspect,
  Prospect,
  ProspectAgendamento,
  ProspectMensagem,
  StatusAgendamento,
  StatusProspect,
} from "@/lib/types";
import { ApiRequestError, apiRequest } from "./http";

type ProspectApiResponse = Partial<
  Pick<
    Prospect,
    | "id"
    | "tenantId"
    | "responsavelId"
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

type GenericListResponse<T> =
  | T[]
  | {
      items?: T[];
      content?: T[];
      data?: T[];
      rows?: T[];
      result?: T[];
      itens?: T[];
    };

function extractListItems<T>(response: GenericListResponse<T>): T[] {
  if (Array.isArray(response)) return response;
  return response.items ?? response.content ?? response.data ?? response.rows ?? response.result ?? response.itens ?? [];
}

type CrmPlaybookUpsertData = {
  nome: string;
  objetivo: string;
  stageStatus: StatusProspect;
  ativo: boolean;
  passos: Array<{
    id?: string;
    titulo: string;
    descricao?: string;
    acao: CrmPlaybook["passos"][number]["acao"];
    prazoHoras: number;
    obrigatoria: boolean;
  }>;
};

type CrmCadenciaUpsertData = {
  nome: string;
  objetivo: string;
  stageStatus: StatusProspect;
  gatilho: CrmCadencia["gatilho"];
  ativo: boolean;
  passos: Array<{
    id?: string;
    titulo: string;
    acao: CrmCadencia["passos"][number]["acao"];
    delayDias: number;
    template?: string;
    automatica: boolean;
  }>;
};

function mapUnavailableCapability(error: unknown, message: string): never {
  if (error instanceof ApiRequestError && [404, 405, 501].includes(error.status)) {
    throw new Error(message);
  }
  throw error;
}

export function buildProspectUpsertApiRequest(
  tenantId: string,
  data: Pick<
    CreateProspectInput,
    "nome" | "telefone" | "email" | "cpf" | "origem" | "observacoes" | "responsavelId"
  >
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
    responsavelId: cleanString(input.responsavelId) ?? fallback?.responsavelId,
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
  data: Pick<
    CreateProspectInput,
    "nome" | "telefone" | "email" | "cpf" | "origem" | "observacoes" | "responsavelId"
  >;
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
    responsavelId: input.data.responsavelId,
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
    path: "/api/v1/academia/prospects/check-duplicate",
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

async function listCrmPipelineStagesApi(input: {
  tenantId: string;
}): Promise<CrmPipelineStage[]> {
  try {
    const response = await apiRequest<GenericListResponse<CrmPipelineStage>>({
      path: "/api/v1/crm/pipeline-stages",
      query: { tenantId: input.tenantId },
    });
    return extractListItems(response);
  } catch (error) {
    mapUnavailableCapability(error, "Backend ainda não expõe estágios do pipeline CRM neste ambiente.");
  }
}

export async function listCrmTasksApi(input: {
  tenantId: string;
  status?: CrmTaskStatus;
  prioridade?: CrmTaskPrioridade;
  prospectId?: string;
  responsavelId?: string;
}): Promise<CrmTask[]> {
  const response = await apiRequest<GenericListResponse<CrmTask>>({
    path: "/api/v1/crm/tarefas",
    query: {
      tenantId: input.tenantId,
      status: input.status,
      prioridade: input.prioridade,
      prospectId: input.prospectId,
      responsavelId: input.responsavelId,
    },
  });
  return extractListItems(response);
}

export async function createCrmTaskApi(input: {
  tenantId: string;
  data: {
    prospectId?: string;
    stageStatus?: StatusProspect;
    titulo: string;
    descricao?: string;
    tipo: CrmTaskTipo;
    prioridade: CrmTaskPrioridade;
    status?: CrmTaskStatus;
    responsavelId?: string;
    vencimentoEm: string;
  };
}): Promise<CrmTask> {
  try {
    return await apiRequest<CrmTask>({
      path: "/api/v1/crm/tarefas",
      method: "POST",
      query: { tenantId: input.tenantId },
      body: input.data,
    });
  } catch (error) {
    mapUnavailableCapability(error, "Backend ainda não expõe criação de tarefas CRM neste ambiente.");
  }
}

export async function updateCrmTaskApi(input: {
  tenantId: string;
  id: string;
  data: Partial<{
    prospectId?: string;
    stageStatus?: StatusProspect;
    titulo: string;
    descricao?: string;
    tipo: CrmTaskTipo;
    prioridade: CrmTaskPrioridade;
    status: CrmTaskStatus;
    responsavelId?: string;
    vencimentoEm: string;
  }>;
}): Promise<CrmTask> {
  try {
    return await apiRequest<CrmTask>({
      path: `/api/v1/crm/tarefas/${input.id}`,
      method: "PUT",
      query: { tenantId: input.tenantId },
      body: input.data,
    });
  } catch (error) {
    mapUnavailableCapability(error, "Backend ainda não expõe atualização de tarefas CRM neste ambiente.");
  }
}

export async function listCrmPlaybooksApi(input: {
  tenantId: string;
}): Promise<CrmPlaybook[]> {
  const response = await apiRequest<GenericListResponse<CrmPlaybook>>({
    path: "/api/v1/crm/playbooks",
    query: { tenantId: input.tenantId },
  });
  return extractListItems(response);
}

export async function createCrmPlaybookApi(input: {
  tenantId: string;
  data: CrmPlaybookUpsertData;
}): Promise<CrmPlaybook> {
  return apiRequest<CrmPlaybook>({
    path: "/api/v1/crm/playbooks",
    method: "POST",
    query: { tenantId: input.tenantId },
    body: input.data,
  });
}

export async function updateCrmPlaybookApi(input: {
  tenantId: string;
  id: string;
  data: Partial<CrmPlaybookUpsertData>;
}): Promise<CrmPlaybook> {
  return apiRequest<CrmPlaybook>({
    path: `/api/v1/crm/playbooks/${input.id}`,
    method: "PUT",
    query: { tenantId: input.tenantId },
    body: input.data,
  });
}

export async function listCrmCadenciasApi(input: {
  tenantId: string;
}): Promise<CrmCadencia[]> {
  try {
    const response = await apiRequest<GenericListResponse<CrmCadencia>>({
      path: "/api/v1/crm/cadencias",
      query: { tenantId: input.tenantId },
    });
    return extractListItems(response);
  } catch (error) {
    mapUnavailableCapability(error, "Backend ainda não expõe cadências CRM neste ambiente.");
  }
}

export async function createCrmCadenciaApi(input: {
  tenantId: string;
  data: CrmCadenciaUpsertData;
}): Promise<CrmCadencia> {
  try {
    return await apiRequest<CrmCadencia>({
      path: "/api/v1/crm/cadencias",
      method: "POST",
      query: { tenantId: input.tenantId },
      body: input.data,
    });
  } catch (error) {
    mapUnavailableCapability(error, "Backend ainda não expõe criação de cadências CRM neste ambiente.");
  }
}

export async function updateCrmCadenciaApi(input: {
  tenantId: string;
  id: string;
  data: Partial<CrmCadenciaUpsertData>;
}): Promise<CrmCadencia> {
  try {
    return await apiRequest<CrmCadencia>({
      path: `/api/v1/crm/cadencias/${input.id}`,
      method: "PUT",
      query: { tenantId: input.tenantId },
      body: input.data,
    });
  } catch (error) {
    mapUnavailableCapability(error, "Backend ainda não expõe atualização de cadências CRM neste ambiente.");
  }
}

export async function listCrmAutomacoesApi(input: {
  tenantId: string;
}): Promise<CrmAutomation[]> {
  const response = await apiRequest<GenericListResponse<CrmAutomation>>({
    path: "/api/v1/crm/automacoes",
    query: { tenantId: input.tenantId },
  });
  return extractListItems(response);
}

export async function updateCrmAutomacaoApi(input: {
  tenantId: string;
  id: string;
  data: Partial<Omit<CrmAutomation, "id" | "tenantId" | "dataCriacao" | "dataAtualizacao">>;
}): Promise<CrmAutomation> {
  return apiRequest<CrmAutomation>({
    path: `/api/v1/crm/automacoes/${input.id}`,
    method: "PUT",
    query: { tenantId: input.tenantId },
    body: input.data,
  });
}

async function listCrmActivitiesApi(input: {
  tenantId: string;
  prospectId?: string;
  limit?: number;
}): Promise<CrmActivity[]> {
  try {
    const response = await apiRequest<GenericListResponse<CrmActivity>>({
      path: "/api/v1/crm/atividades",
      query: {
        tenantId: input.tenantId,
        prospectId: input.prospectId,
        limit: input.limit,
      },
    });
    return extractListItems(response);
  } catch (error) {
    mapUnavailableCapability(error, "Backend ainda não expõe histórico de atividades CRM neste ambiente.");
  }
}

export async function listCrmCampanhasApi(input: {
  tenantId: string;
  status?: CampanhaStatus;
}): Promise<CampanhaCRM[]> {
  try {
    const response = await apiRequest<GenericListResponse<CampanhaCRM>>({
      path: "/api/v1/crm/campanhas",
      query: {
        tenantId: input.tenantId,
        status: input.status,
      },
    });
    return extractListItems(response);
  } catch (error) {
    mapUnavailableCapability(error, "Backend ainda não expõe campanhas CRM neste ambiente.");
  }
}

export async function createCrmCampanhaApi(input: {
  tenantId: string;
  data: Omit<
    CampanhaCRM,
    "id" | "tenantId" | "disparosRealizados" | "ultimaExecucao" | "dataCriacao" | "dataAtualizacao" | "audienceEstimado"
  >;
}): Promise<CampanhaCRM> {
  try {
    return await apiRequest<CampanhaCRM>({
      path: "/api/v1/crm/campanhas",
      method: "POST",
      query: { tenantId: input.tenantId },
      body: input.data,
    });
  } catch (error) {
    mapUnavailableCapability(error, "Backend ainda não expõe criação de campanhas CRM neste ambiente.");
  }
}

export async function updateCrmCampanhaApi(input: {
  tenantId: string;
  id: string;
  data: Partial<
    Omit<
      CampanhaCRM,
      "id" | "tenantId" | "disparosRealizados" | "ultimaExecucao" | "dataCriacao" | "dataAtualizacao" | "audienceEstimado"
    >
  >;
}): Promise<CampanhaCRM> {
  try {
    return await apiRequest<CampanhaCRM>({
      path: `/api/v1/crm/campanhas/${input.id}`,
      method: "PUT",
      query: { tenantId: input.tenantId },
      body: input.data,
    });
  } catch (error) {
    mapUnavailableCapability(error, "Backend ainda não expõe atualização de campanhas CRM neste ambiente.");
  }
}

export async function dispararCrmCampanhaApi(input: {
  tenantId: string;
  id: string;
}): Promise<CampanhaCRM> {
  try {
    return await apiRequest<CampanhaCRM>({
      path: `/api/v1/crm/campanhas/${input.id}/disparar`,
      method: "POST",
      query: { tenantId: input.tenantId },
    });
  } catch (error) {
    mapUnavailableCapability(error, "Backend ainda não expõe disparo auditável de campanhas CRM neste ambiente.");
  }
}

export async function encerrarCrmCampanhaApi(input: {
  tenantId: string;
  id: string;
}): Promise<CampanhaCRM> {
  try {
    return await apiRequest<CampanhaCRM>({
      path: `/api/v1/crm/campanhas/${input.id}/encerrar`,
      method: "PATCH",
      query: { tenantId: input.tenantId },
    });
  } catch (error) {
    mapUnavailableCapability(error, "Backend ainda não expõe encerramento de campanhas CRM neste ambiente.");
  }
}

// ---------------------------------------------------------------------------
// Dashboard de Retenção
// ---------------------------------------------------------------------------

export interface DashboardRetencao {
  leadsEmAberto: number;
  conversoes30Dias: number;
  matriculasVencendo7Dias: number;
  alunosInadimplentes: number;
  tarefasPendentes: number;
  tarefasAtrasadas: number;
  automacoesAtivas: number;
  playbooksAtivos: number;
  eventos30Dias: number;
  permissoes: {
    podeGerirAutomacoes: boolean;
    podeGerirTarefas: boolean;
    podeVerDashboard: boolean;
  };
}

export async function getCrmDashboardRetencaoApi(input: {
  tenantId: string;
}): Promise<DashboardRetencao> {
  try {
    return await apiRequest<DashboardRetencao>({
      path: "/api/v1/crm/dashboard/retencao",
      query: { tenantId: input.tenantId },
    });
  } catch (error) {
    mapUnavailableCapability(error, "Backend ainda não expõe dashboard de retenção CRM neste ambiente.");
  }
}
