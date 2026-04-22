/**
 * Admin CRUD de Configuração de Agregadores (Wellhub / TotalPass).
 * Endpoint base: /api/v1/admin/agregadores/config/*
 *
 * ADR-012 — UI Admin para Configuração de Agregadores.
 *
 * Write-only secret lifecycle: `access_token` e `webhook_secret` nunca retornam
 * em GET. Só aparecem uma vez em respostas de POST create / rotate.
 *
 * Fase 3 frontend:
 *  - AG-7.7 / AG-7.8: schema, list/get, test-connection.
 *  - AG-7.9: create, update, rotate-token, rotate-webhook-secret, delete.
 *  - AG-7.10: monitor de eventos (reprocessar) — stub de listagem enquanto
 *    endpoint de GET de eventos não existe (TODO backend).
 */
import { apiRequest } from "./http";

// ─── Types ─────────────────────────────────────────────────────────────────

export type AgregadorTipo = "WELLHUB" | "TOTALPASS";

export type AgregadorSchemaFieldType =
  | "boolean"
  | "string"
  | "enum"
  | "number";

export interface AgregadorSchemaFlag {
  key: string;
  type: AgregadorSchemaFieldType;
  label?: string;
  default?: boolean | string | number | null;
  required?: boolean;
  options?: string[];
}

export interface AgregadorSchemaEntry {
  tipo: AgregadorTipo;
  nome: string;
  camposRequeridos: string[];
  camposOpcionais: string[];
  flags: AgregadorSchemaFlag[];
  webhookEndpoints: string[];
}

export interface AgregadorSchemaResponse {
  agregadores: AgregadorSchemaEntry[];
}

export interface AgregadorConfigResponse {
  tipo: AgregadorTipo;
  tenantId: string;
  enabled: boolean;
  externalGymId?: string | null;
  siteId?: string | null;
  flags?: Record<string, unknown> | null;
  hasToken?: boolean;
  hasWebhookSecret?: boolean;
  lastRotatedAt?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface AgregadorConfigListResponse {
  configs: AgregadorConfigResponse[];
}

export interface AgregadorTestConnectionResult {
  success: boolean;
  status?: string;
  message?: string;
  details?: Record<string, unknown> | null;
}

/** Payload de criação (POST /{tipo}). Secrets são opcionais: se omitidos, o
 *  backend pode gerar um novo `webhook_secret`. `access_token` sempre precisa
 *  ser fornecido pelo admin (sistema não gera tokens de parceiro). */
export interface AgregadorConfigCreateInput {
  tenantId: string;
  accessToken: string;
  webhookSecret?: string;
  externalGymId?: string;
  siteId?: string;
  enabled?: boolean;
  flags?: Record<string, unknown>;
}

/** Payload de atualização (PUT /{tipo}). Campos não-sensíveis somente. */
export interface AgregadorConfigUpdateInput {
  tenantId: string;
  externalGymId?: string;
  siteId?: string;
  enabled?: boolean;
  flags?: Record<string, unknown>;
}

/** Resposta de POST create / rotate. Secrets aparecem UMA ÚNICA VEZ. */
export interface AgregadorConfigSecretResponse {
  tipo: AgregadorTipo;
  tenantId: string;
  /** Secret bruto do webhook — presente apenas quando o sistema acaba de
   *  gerar (create sem webhookSecret explícito, ou rotate-webhook-secret). */
  webhookSecret?: string | null;
  /** Novo access_token gerado (em rotate-token). */
  accessToken?: string | null;
  webhookUrl?: string;
  warning?: string;
}

/** Shape assumido para listagem de eventos (AG-7.10). Endpoint ainda não existe;
 *  manter compatível para quando backend expuser `GET /admin/agregadores/eventos`. */
export interface AgregadorWebhookEvento {
  id: string;
  tenantId: string;
  agregador: AgregadorTipo;
  eventType: string;
  externalGymId?: string | null;
  externalUserId?: string | null;
  status: string;
  payload?: Record<string, unknown> | null;
  errorMessage?: string | null;
  retryCount?: number | null;
  createdAt: string;
  updatedAt?: string | null;
}

export interface AgregadorWebhookEventosPage {
  items: AgregadorWebhookEvento[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ListAgregadorEventosInput {
  tenantId: string;
  tipo?: AgregadorTipo;
  eventType?: string;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  pageSize?: number;
}

// ─── API calls ─────────────────────────────────────────────────────────────

/**
 * GET /api/v1/admin/agregadores/config/schema
 * Retorna metadata dos agregadores suportados (campos, flags, webhook endpoints).
 */
export async function getAgregadoresSchemaApi(): Promise<AgregadorSchemaResponse> {
  return apiRequest<AgregadorSchemaResponse>({
    path: "/api/v1/admin/agregadores/config/schema",
    includeContextHeader: false,
  });
}

/**
 * GET /api/v1/admin/agregadores/config?tenantId={uuid}
 * Lista configs do tenant. Secrets não retornam — apenas `hasToken`/`hasWebhookSecret`.
 */
export async function listAgregadoresConfigsApi(input: {
  tenantId: string;
}): Promise<AgregadorConfigResponse[]> {
  const response = await apiRequest<
    AgregadorConfigListResponse | AgregadorConfigResponse[]
  >({
    path: "/api/v1/admin/agregadores/config",
    query: { tenantId: input.tenantId },
    includeContextHeader: false,
  });
  if (Array.isArray(response)) return response;
  return response.configs ?? [];
}

/**
 * POST /api/v1/admin/agregadores/config/{tipo}/test-connection?tenantId={uuid}
 * Executa consultarStatusParceiro() + dry-run validate para validar credenciais.
 */
export async function testAgregadorConnectionApi(input: {
  tipo: AgregadorTipo;
  tenantId: string;
}): Promise<AgregadorTestConnectionResult> {
  return apiRequest<AgregadorTestConnectionResult>({
    path: `/api/v1/admin/agregadores/config/${input.tipo}/test-connection`,
    method: "POST",
    query: { tenantId: input.tenantId },
    includeContextHeader: false,
  });
}

/**
 * POST /api/v1/admin/agregadores/config/{tipo}
 * Cria config. Resposta pode retornar `webhookSecret` quando o sistema gera o
 * valor (payload omite `webhookSecret`).
 */
export async function createAgregadorConfigApi(input: {
  tipo: AgregadorTipo;
  payload: AgregadorConfigCreateInput;
}): Promise<AgregadorConfigSecretResponse> {
  const { tenantId, ...rest } = input.payload;
  return apiRequest<AgregadorConfigSecretResponse>({
    path: `/api/v1/admin/agregadores/config/${input.tipo}`,
    method: "POST",
    query: { tenantId },
    body: {
      tenantId,
      ...rest,
    },
    includeContextHeader: false,
  });
}

/**
 * PUT /api/v1/admin/agregadores/config/{tipo}
 * Atualiza campos não-sensíveis. Secrets ficam intocados.
 */
export async function updateAgregadorConfigApi(input: {
  tipo: AgregadorTipo;
  payload: AgregadorConfigUpdateInput;
}): Promise<AgregadorConfigResponse> {
  const { tenantId, ...rest } = input.payload;
  return apiRequest<AgregadorConfigResponse>({
    path: `/api/v1/admin/agregadores/config/${input.tipo}`,
    method: "PUT",
    query: { tenantId },
    body: {
      tenantId,
      ...rest,
    },
    includeContextHeader: false,
  });
}

/**
 * POST /api/v1/admin/agregadores/config/{tipo}/rotate-token
 * Troca o access_token pelo valor informado. Backend mantém grace period
 * de 24h (aceita token antigo + novo).
 */
export async function rotateAgregadorTokenApi(input: {
  tipo: AgregadorTipo;
  tenantId: string;
  newAccessToken: string;
}): Promise<AgregadorConfigSecretResponse> {
  return apiRequest<AgregadorConfigSecretResponse>({
    path: `/api/v1/admin/agregadores/config/${input.tipo}/rotate-token`,
    method: "POST",
    body: {
      tenantId: input.tenantId,
      newAccessToken: input.newAccessToken,
    },
    includeContextHeader: false,
  });
}

/**
 * POST /api/v1/admin/agregadores/config/{tipo}/rotate-webhook-secret
 * Gera novo webhook_secret. Resposta traz o valor UMA ÚNICA VEZ.
 */
export async function rotateAgregadorWebhookSecretApi(input: {
  tipo: AgregadorTipo;
  tenantId: string;
}): Promise<AgregadorConfigSecretResponse> {
  return apiRequest<AgregadorConfigSecretResponse>({
    path: `/api/v1/admin/agregadores/config/${input.tipo}/rotate-webhook-secret`,
    method: "POST",
    body: { tenantId: input.tenantId },
    includeContextHeader: false,
  });
}

/**
 * DELETE /api/v1/admin/agregadores/config/{tipo}?tenantId={uuid}
 * Soft delete — define enabled=false e limpa secrets. Linha persiste para
 * auditoria; "reconfigurar" repovoa os secrets.
 */
export async function deleteAgregadorConfigApi(input: {
  tipo: AgregadorTipo;
  tenantId: string;
}): Promise<void> {
  await apiRequest<unknown>({
    path: `/api/v1/admin/agregadores/config/${input.tipo}`,
    method: "DELETE",
    query: { tenantId: input.tenantId },
    includeContextHeader: false,
  });
}

/**
 * GET /api/v1/admin/agregadores/eventos (AG-7.10 — TODO backend).
 *
 * Endpoint de listagem ainda não existe. Esta função retorna um page vazio
 * para que a UI seja montada e testada. Quando o backend entregar, substituir
 * pelo fetch real sem mudar a assinatura / shape de retorno.
 *
 * TODO: AG-7.10.backend — criar `AgregadorEventoAdminController#list`.
 */
export async function listAgregadorEventosApi(
  _input: ListAgregadorEventosInput,
): Promise<AgregadorWebhookEventosPage> {
  const pageSize = _input.pageSize ?? 25;
  const page = _input.page ?? 0;
  return {
    items: [],
    total: 0,
    page,
    pageSize,
  };
}

/**
 * POST /api/v1/integracoes/agregadores/{tipo}/webhooks/{eventId}/reprocessar?tenantId={uuid}
 * Reprocessa um evento de webhook já persistido. Endpoint existe no
 * `AgregadoresController` (não-admin) — mas a UI admin pode invocá-lo para
 * operações pontuais de troubleshooting.
 */
export async function reprocessarAgregadorEventoApi(input: {
  tipo: AgregadorTipo;
  tenantId: string;
  eventId: string;
}): Promise<{ success: boolean; message?: string }> {
  return apiRequest<{ success: boolean; message?: string }>({
    path: `/api/v1/integracoes/agregadores/${input.tipo}/webhooks/${input.eventId}/reprocessar`,
    method: "POST",
    query: { tenantId: input.tenantId },
    includeContextHeader: false,
  });
}
