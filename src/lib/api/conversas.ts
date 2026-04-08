import type {
  ConversaResponse,
  ConversaPageResponse,
  ConversaFilters,
  CriarConversaRequest,
  MensagemResponse,
  MensagemPageResponse,
  EnviarMensagemRequest,
  CriarTarefaConversaRequest,
} from "@/lib/shared/types/whatsapp-crm";
import { apiRequest } from "./http";

// ---------------------------------------------------------------------------
// Conversas — CRUD + filtros
// ---------------------------------------------------------------------------

export async function listConversasApi(opts: {
  tenantId: string;
  filters?: ConversaFilters;
  page?: number;
  size?: number;
}): Promise<ConversaPageResponse> {
  const query: Record<string, string | number | undefined> = {
    tenantId: opts.tenantId,
    page: opts.page ?? 0,
    size: opts.size ?? 20,
  };

  const f = opts.filters ?? {};
  if (f.unidadeId) query.unidadeId = f.unidadeId;
  if (f.status) query.status = f.status;
  if (f.queue) query.queue = f.queue;
  if (f.ownerUserId) query.ownerUserId = f.ownerUserId;
  if (f.periodoInicio) query.periodoInicio = f.periodoInicio;
  if (f.periodoFim) query.periodoFim = f.periodoFim;
  if (f.busca) query.busca = f.busca;

  return apiRequest<ConversaPageResponse>({
    path: "/api/v1/conversas",
    query,
  });
}

export async function getConversaDetailApi(opts: {
  tenantId: string;
  id: string;
}): Promise<ConversaResponse> {
  return apiRequest<ConversaResponse>({
    path: `/api/v1/conversas/${opts.id}`,
    query: { tenantId: opts.tenantId },
  });
}

export async function createConversaApi(opts: {
  tenantId: string;
  data: CriarConversaRequest;
}): Promise<ConversaResponse> {
  return apiRequest<ConversaResponse>({
    path: "/api/v1/conversas",
    method: "POST",
    query: { tenantId: opts.tenantId },
    body: opts.data,
  });
}

// ---------------------------------------------------------------------------
// Conversas — Ações de roteamento e status
// ---------------------------------------------------------------------------

export async function updateConversaStatusApi(opts: {
  tenantId: string;
  id: string;
  status: ConversaResponse["status"];
}): Promise<ConversaResponse> {
  return apiRequest<ConversaResponse>({
    path: `/api/v1/conversas/${opts.id}`,
    method: "PATCH",
    query: { tenantId: opts.tenantId },
    body: { status: opts.status },
  });
}

export async function assignConversaOwnerApi(opts: {
  tenantId: string;
  id: string;
  ownerUserId: string;
}): Promise<ConversaResponse> {
  return apiRequest<ConversaResponse>({
    path: `/api/v1/conversas/${opts.id}/owner`,
    method: "PATCH",
    query: {
      tenantId: opts.tenantId,
      ownerUserId: opts.ownerUserId,
    },
  });
}

export async function moveConversaQueueApi(opts: {
  tenantId: string;
  id: string;
  queue: string;
}): Promise<ConversaResponse> {
  return apiRequest<ConversaResponse>({
    path: `/api/v1/conversas/${opts.id}/queue`,
    method: "PATCH",
    query: {
      tenantId: opts.tenantId,
      queue: opts.queue,
    },
  });
}

export async function reattribuirConversaUnidadeApi(opts: {
  tenantId: string;
  id: string;
  unidadeId: string;
}): Promise<ConversaResponse> {
  return apiRequest<ConversaResponse>({
    path: `/api/v1/conversas/${opts.id}/unidade`,
    method: "PATCH",
    query: {
      tenantId: opts.tenantId,
      unidadeId: opts.unidadeId,
    },
  });
}

// ---------------------------------------------------------------------------
// Thread de mensagens
// ---------------------------------------------------------------------------

export async function getConversaThreadApi(opts: {
  tenantId: string;
  id: string;
  page?: number;
  size?: number;
}): Promise<MensagemPageResponse> {
  return apiRequest<MensagemPageResponse>({
    path: `/api/v1/conversas/${opts.id}/thread`,
    query: {
      tenantId: opts.tenantId,
      page: opts.page ?? 0,
      size: opts.size ?? 50,
    },
  });
}

// ---------------------------------------------------------------------------
// Envio de mensagem
// ---------------------------------------------------------------------------

export async function sendMessageApi(opts: {
  tenantId: string;
  conversationId: string;
  data: EnviarMensagemRequest;
  idempotencyKey?: string;
}): Promise<MensagemResponse> {
  const headers: Record<string, string> = {};
  if (opts.idempotencyKey) {
    headers["X-Idempotency-Key"] = opts.idempotencyKey;
  }

  return apiRequest<MensagemResponse>({
    path: `/api/v1/conversas/${opts.conversationId}/mensagens`,
    method: "POST",
    query: { tenantId: opts.tenantId },
    body: opts.data,
    headers,
  });
}

// ---------------------------------------------------------------------------
// Tarefas vinculadas à conversa
// ---------------------------------------------------------------------------

export async function createConversaTaskApi(opts: {
  tenantId: string;
  conversationId: string;
  data: CriarTarefaConversaRequest;
}): Promise<void> {
  await apiRequest<void>({
    path: `/api/v1/conversas/${opts.conversationId}/tarefas`,
    method: "POST",
    query: { tenantId: opts.tenantId },
    body: opts.data,
  });
}
