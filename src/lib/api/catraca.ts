import { apiRequest } from "./http";

export interface CatracaCredentialResponse {
  keyId: string;
  secret: string;
  bearerPlain: string;
  bearerBase64: string;
  tenantId: string;
  createdAt: string;
}

export interface CatracaAgentConexao {
  agentId: string;
  sessionId?: string;
  integrationKeyId?: string;
  tenantId?: string;
  lastAckAt?: string;
  lastPendingRequestSentAt?: string;
  lastPendingRequestId?: string;
  awaitingPingAck?: boolean;
}

export interface CatracaTenantConexao {
  tenantId: string;
  connectedAgents: number;
  agents?: CatracaAgentConexao[];
}

export interface CatracaWsStatusResponse {
  totalConnectedAgents: number;
  tenants: CatracaTenantConexao[];
}

interface CatracaWsStatusApiResponse {
  totalConnectedAgents?: number;
  tenants?: Array<
    CatracaTenantConexao & {
      agents?: unknown;
    }
  >;
  tenantId?: string;
  connectedAgents?: number;
  connectedTenantId?: string;
}

type RawCatracaAgentPayload = {
  agentId?: unknown;
  sessionId?: unknown;
  integrationKeyId?: unknown;
  tenantId?: unknown;
  lastAckAt?: unknown;
  lastPendingRequestSentAt?: unknown;
  lastPendingRequestId?: unknown;
  awaitingPingAck?: unknown;
};

export interface GenerateCatracaCredentialInput {
  tenantId: string;
  adminToken: string;
}

export interface LiberarAcessoCatracaInput {
  agentId: string;
  memberId: string;
  reason: string;
  issuedBy?: string;
  requestId?: string;
}

export interface LiberarAcessoCatracaResponse {
  requestId: string;
}

export interface CatracaAcesso {
  id: string;
  tenantId?: string;
  memberId?: string;
  memberNome?: string;
  memberDocumento?: string;
  memberFoto?: string;
  agentId?: string;
  gate?: string;
  status?: string;
  direction?: string;
  releaseType?: "MANUAL" | "AUTOMATICA" | string;
  reason?: string;
  createdBy?: string;
  issuedBy?: string;
  occurredAt?: string;
  createdAt?: string;
  raw: Record<string, unknown>;
}

export interface ListarAcessosCatracaInput {
  tenantId: string;
  page?: number;
  size?: number;
  startDate?: string;
  endDate?: string;
  memberId?: string;
  tipoLiberacao?: "TODOS" | "MANUAL" | "AUTOMATICA";
  status?: "TODOS" | "LIBERADO" | "BLOQUEADO";
  uniqueWindowMinutes?: number;
  timezone?: string;
}

export interface CatracaAcessosResponse {
  items: CatracaAcesso[];
  page: number;
  size: number;
  total?: number;
  hasNext: boolean;
}

export interface CatracaAcessosResumo {
  entradas: number;
  entradasManuais: number;
  bloqueados: number;
  frequenciaMediaPorCliente: number;
}

export interface CatracaAcessosSerieDiaria {
  date: string;
  entradas: number;
  manuais: number;
  bloqueados: number;
}

export interface CatracaAcessosRankingItem {
  posicao: number;
  memberId?: string;
  nome: string;
  fotoUrl?: string;
  contrato?: string;
  statusCliente?: string;
  frequencia: number;
}

export interface CatracaAcessosDashboardResponse extends CatracaAcessosResponse {
  resumo?: CatracaAcessosResumo;
  serieDiaria?: CatracaAcessosSerieDiaria[];
  rankingFrequencia?: CatracaAcessosRankingItem[];
}

function normalizeCatracaWsStatus(input: CatracaWsStatusApiResponse): CatracaWsStatusResponse {
  if (Array.isArray(input.tenants)) {
    const tenants = input.tenants.map((item) => {
      const rawAgents = Array.isArray(item.agents) ? item.agents : [];
      const agents = rawAgents
        .map((agent: unknown) => {
          if (agent && typeof agent === "object" && "agentId" in (agent as RawCatracaAgentPayload)) {
            const payload = agent as RawCatracaAgentPayload;
            if (typeof payload.agentId === "string" && payload.agentId.trim()) {
              return {
                agentId: payload.agentId.trim(),
                ...(typeof payload.sessionId === "string" ? { sessionId: payload.sessionId } : {}),
                ...(typeof payload.integrationKeyId === "string"
                  ? { integrationKeyId: payload.integrationKeyId }
                  : {}),
                ...(typeof payload.tenantId === "string" ? { tenantId: payload.tenantId } : {}),
                ...(typeof payload.lastAckAt === "string" ? { lastAckAt: payload.lastAckAt } : {}),
                ...(typeof payload.lastPendingRequestSentAt === "string"
                  ? { lastPendingRequestSentAt: payload.lastPendingRequestSentAt }
                  : {}),
                ...(typeof payload.lastPendingRequestId === "string"
                  ? { lastPendingRequestId: payload.lastPendingRequestId }
                  : {}),
                ...(typeof payload.awaitingPingAck === "boolean"
                  ? { awaitingPingAck: payload.awaitingPingAck }
                  : {}),
              };
            }
          }
          return null;
        })
        .filter(Boolean) as CatracaAgentConexao[];

      return {
        tenantId: String(item.tenantId),
        connectedAgents: Number(item.connectedAgents) || 0,
        agents,
      };
    });
    return {
      totalConnectedAgents: Number(input.totalConnectedAgents) || tenants.reduce((acc, item) => acc + item.connectedAgents, 0),
      tenants,
    };
  }

  if (input.tenantId) {
    const rawAgentsCandidate = (input as { agents?: unknown }).agents;
    const rawAgents: unknown[] = Array.isArray(rawAgentsCandidate) ? rawAgentsCandidate : [];
    const agents = rawAgents
      .map((agent: unknown) => {
        if (agent && typeof agent === "object" && "agentId" in (agent as RawCatracaAgentPayload)) {
          const payload = agent as RawCatracaAgentPayload;
          if (typeof payload.agentId === "string" && payload.agentId.trim()) {
            return {
              agentId: payload.agentId.trim(),
            };
          }
        }
        return null;
      })
      .filter(Boolean) as CatracaAgentConexao[];
    const tenant = {
      tenantId: input.tenantId,
      connectedAgents: Number(input.connectedAgents) || 0,
      ...(agents.length ? { agents } : {}),
    };
    return {
      totalConnectedAgents: tenant.connectedAgents,
      tenants: [tenant],
    };
  }

  return { totalConnectedAgents: 0, tenants: [] };
}

export async function gerarCatracaCredencialApi(input: GenerateCatracaCredentialInput): Promise<CatracaCredentialResponse> {
  return apiRequest<CatracaCredentialResponse>({
    path: "/api/v1/integracoes/catraca/credenciais",
    method: "POST",
    headers: {
      "X-Admin-Token": input.adminToken,
    },
    body: {
      tenantId: input.tenantId,
    },
  });
}

/**
 * ⚠️ ENDPOINTS S2S — exigem credencial de integração (não admin)
 *
 * `TurnstileWebSocketStatusController` no backend exige autenticação S2S
 * via `IntegrationAuthorizationService` com scope `turnstile:ws`. Quando
 * chamado com Bearer token de admin (sessão de usuário), o BE retorna
 * 500 com `AccessDeniedException` em vez de 401/403 (bug do BE — Spring
 * traduz como erro interno).
 *
 * Status atual:
 * - O painel `/administrativo/catraca-status` chama estas funções e
 *   captura o erro graciosamente, mostrando "0 conexões" em vez de
 *   quebrar a tela.
 * - Para o painel funcionar de fato, precisa de uma das soluções:
 *   1. BE expor versão admin de `/ws/status` que aceite Bearer token
 *      de usuário com role apropriada
 *   2. BFF/proxy no FE injetar credencial S2S (X-Integration-Key)
 *      antes de proxiar
 *
 * Validado no smoke test 2026-04-10 (commit ee89578) e documentado em
 * ADR-001 + comentário inline em `liberarAcessoCatracaApi`.
 */
export async function listarCatracaWsStatusApi(input?: { tenantId?: string }): Promise<CatracaWsStatusResponse> {
  const response = await apiRequest<CatracaWsStatusApiResponse>({
    path: "/api/v1/integracoes/catraca/ws/status",
    query: {
      tenantId: input?.tenantId,
    },
  });
  return normalizeCatracaWsStatus(response);
}

export async function obterCatracaWsStatusPorTenantApi(input: {
  tenantId: string;
}): Promise<CatracaWsStatusResponse> {
  const response = await apiRequest<CatracaWsStatusApiResponse>({
    path: `/api/v1/integracoes/catraca/ws/status/${input.tenantId}`,
  });
  return normalizeCatracaWsStatus(response);
}

/**
 * Liberação manual de catraca via WebSocket command. Mesmo problema das
 * funções `listarCatracaWsStatusApi` acima: endpoint S2S, retorna 500
 * quando chamado com auth admin. Mantida para futuro fluxo BFF/proxy.
 */
export async function liberarAcessoCatracaApi(
  input: LiberarAcessoCatracaInput
): Promise<LiberarAcessoCatracaResponse> {
  return apiRequest<LiberarAcessoCatracaResponse>({
    path: "/api/v1/integracoes/catraca/ws/commands/grant",
    method: "POST",
    body: {
      agentId: input.agentId,
      memberId: input.memberId,
      reason: input.reason,
      issuedBy: input.issuedBy,
      requestId: input.requestId,
    },
  });
}

// ─── Task #546: sync de faces ───────────────────────────────────────────

export interface SyncFacesResponse {
  sincronizados?: number;
  total?: number;
  status?: string;
  mensagem?: string;
}

/**
 * Sincroniza fotos dos alunos para a catraca da unidade (face recognition).
 * POST /api/v1/integracoes/catraca/faces/sync
 */
export async function syncCatracaFacesApi(input: {
  tenantId: string;
}): Promise<SyncFacesResponse> {
  return apiRequest<SyncFacesResponse>({
    path: "/api/v1/integracoes/catraca/faces/sync",
    method: "POST",
    query: { tenantId: input.tenantId },
  });
}

function toRecord(value: unknown): Record<string, unknown> | null {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return null;
  }
  return value as Record<string, unknown>;
}

function toNumber(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string" && value.trim() !== "" && Number.isFinite(Number(value))) {
    return Number(value);
  }
  return undefined;
}

function toStringByKeys(record: Record<string, unknown>, keys: string[]): string | undefined {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value.trim() !== "") {
      return value.trim();
    }
  }
  return undefined;
}

function toStringByKeysInRecord(
  value: unknown,
  keys: string[]
): string | undefined {
  const record = toRecord(value);
  if (!record) return undefined;
  return toStringByKeys(record, keys);
}

function toBooleanByKeys(record: Record<string, unknown>, keys: string[]): boolean | undefined {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "boolean") {
      return value;
    }
    if (typeof value === "string") {
      const normalized = value.trim().toLowerCase();
      if (["true", "1", "sim", "yes"].includes(normalized)) {
        return true;
      }
      if (["false", "0", "nao", "não", "no"].includes(normalized)) {
        return false;
      }
    }
  }
  return undefined;
}

function normalizeReleaseType(value?: string): "MANUAL" | "AUTOMATICA" | undefined {
  const normalized = value?.trim().toUpperCase();
  if (!normalized) return undefined;
  if (/(MANUAL|HUMAN|OPERADOR|OPERATOR)/.test(normalized)) {
    return "MANUAL";
  }
  if (/(AUTO|AUTOMAT|SISTEM|SYSTEM|RULE|POLICY)/.test(normalized)) {
    return "AUTOMATICA";
  }
  return undefined;
}

function inferReleaseType(
  record: Record<string, unknown>,
  metadata: Record<string, unknown> | null,
  issuedBy?: string
): "MANUAL" | "AUTOMATICA" | undefined {
  const explicitType = normalizeReleaseType(
    toStringByKeys(record, [
      "releaseType",
      "tipoLiberacao",
      "grantType",
      "origemLiberacao",
      "liberacaoTipo",
      "mode",
      "tipo",
      "origem",
    ]) ??
      toStringByKeysInRecord(metadata, [
        "releaseType",
        "tipoLiberacao",
        "grantType",
        "origemLiberacao",
        "liberacaoTipo",
        "mode",
        "tipo",
        "origem",
      ])
  );
  if (explicitType) return explicitType;

  const manualFlag = toBooleanByKeys(record, [
    "manual",
    "isManual",
    "liberacaoManual",
    "manualRelease",
    "manualGrant",
  ]);
  if (typeof manualFlag === "boolean") {
    return manualFlag ? "MANUAL" : "AUTOMATICA";
  }

  const actor = issuedBy?.trim().toLowerCase();
  if (!actor) return undefined;
  if (/(sistema|system|auto|automat|policy|rule|motor)/.test(actor)) {
    return "AUTOMATICA";
  }
  return "MANUAL";
}

function normalizeAcessoItem(item: unknown, index: number): CatracaAcesso | null {
  const record = toRecord(item);
  if (!record) return null;
  const metadata = toRecord(record.metadata);
  const createdBy = toStringByKeys(record, ["createdBy", "created_by"]);
  const issuedBy =
    toStringByKeysInRecord(metadata, ["issuedBy", "liberadoPor", "requestedBy", "actor"]) ??
    toStringByKeys(record, ["issuedBy", "liberadoPor", "requestedBy", "actor"]) ??
    createdBy;
  const releaseType = inferReleaseType(record, metadata, issuedBy);

  return {
    id:
      toStringByKeys(record, ["id", "requestId", "eventId", "accessId"]) ??
      `acesso-${index}-${Date.now().toString(36)}`,
    tenantId: toStringByKeys(record, ["tenantId"]),
    memberId: toStringByKeys(record, ["memberId", "alunoId", "clienteId", "userId"]),
    memberNome: toStringByKeys(record, [
      "memberName",
      "alunoNome",
      "clienteNome",
      "nomeCliente",
      "nomeAluno",
      "nome",
    ]),
    memberDocumento: toStringByKeys(record, [
      "memberDocument",
      "documento",
      "documentoAluno",
      "cpf",
      "clienteCpf",
      "alunoCpf",
    ]),
    memberFoto: toStringByKeys(record, [
      "memberPhoto",
      "memberFoto",
      "foto",
      "photoUrl",
      "fotoUrl",
      "imageUrl",
      "avatarUrl",
      "clienteFoto",
      "alunoFoto",
    ]),
    agentId: toStringByKeys(record, ["agentId", "deviceId"]),
    gate: toStringByKeys(record, ["gateName", "catraca", "turnstileName", "equipamento", "deviceName"]),
    status: toStringByKeys(record, ["status", "result", "resultado"]),
    direction: toStringByKeys(record, ["direction", "sentido", "accessDirection"]),
    releaseType,
    reason:
      toStringByKeys(record, ["reason", "motivo", "justificativa"]) ??
      toStringByKeysInRecord(metadata, ["reason", "motivo", "justificativa", "ackMessage"]),
    createdBy,
    issuedBy,
    occurredAt: toStringByKeys(record, ["occurredAt", "eventAt", "dataOcorrencia"]),
    createdAt: toStringByKeys(record, [
      "createdAt",
      "timestamp",
      "requestAt",
      "grantedAt",
      "dataHora",
      "data",
    ]),
    raw: record,
  };
}

function normalizeAcessosResponse(
  response: unknown,
  fallbackPage: number,
  fallbackSize: number
): CatracaAcessosResponse {
  if (Array.isArray(response)) {
    const items = response
      .map((item, index) => normalizeAcessoItem(item, index))
      .filter(Boolean) as CatracaAcesso[];
    return {
      items,
      page: fallbackPage,
      size: fallbackSize,
      hasNext: items.length >= fallbackSize,
      total: undefined,
    };
  }

  const payload = toRecord(response);
  if (!payload) {
    return {
      items: [],
      page: fallbackPage,
      size: fallbackSize,
      total: 0,
      hasNext: false,
    };
  }

  const listCandidate =
    payload.items ??
    payload.content ??
    payload.data ??
    payload.rows ??
    payload.results ??
    payload.acessos ??
    payload.logs;
  const list = Array.isArray(listCandidate) ? listCandidate : [];
  const items = list
    .map((item, index) => normalizeAcessoItem(item, index))
    .filter(Boolean) as CatracaAcesso[];

  const page = toNumber(payload.page) ?? toNumber(payload.number) ?? fallbackPage;
  const size = toNumber(payload.size) ?? toNumber(payload.pageSize) ?? toNumber(payload.limit) ?? fallbackSize;
  const total = toNumber(payload.total) ?? toNumber(payload.totalElements) ?? toNumber(payload.count);
  const hasNextValue = payload.hasNext;
  const hasNext =
    typeof hasNextValue === "boolean"
      ? hasNextValue
      : typeof total === "number"
      ? total > (page + 1) * size
      : items.length >= size;

  return {
    items,
    page,
    size,
    total,
    hasNext,
  };
}

function normalizeResumo(payload: Record<string, unknown>): CatracaAcessosResumo | undefined {
  const resumoRecord = toRecord(payload.resumo);
  if (!resumoRecord) return undefined;
  return {
    entradas: toNumber(resumoRecord.entradas) ?? 0,
    entradasManuais: toNumber(resumoRecord.entradasManuais) ?? toNumber(resumoRecord.manuais) ?? 0,
    bloqueados: toNumber(resumoRecord.bloqueados) ?? 0,
    frequenciaMediaPorCliente:
      toNumber(resumoRecord.frequenciaMediaPorCliente) ?? toNumber(resumoRecord.frequenciaMedia) ?? 0,
  };
}

function normalizeSerieDiaria(payload: Record<string, unknown>): CatracaAcessosSerieDiaria[] {
  const raw = payload.serieDiaria ?? payload.serie ?? payload.dailySeries;
  if (!Array.isArray(raw)) return [];
  return raw
    .map((entry) => {
      const record = toRecord(entry);
      if (!record) return null;
      const date = toStringByKeys(record, ["date", "dia", "data"]);
      if (!date) return null;
      return {
        date,
        entradas: toNumber(record.entradas) ?? toNumber(record.entrada) ?? 0,
        manuais: toNumber(record.manuais) ?? toNumber(record.entradaManual) ?? 0,
        bloqueados: toNumber(record.bloqueados) ?? 0,
      };
    })
    .filter(Boolean) as CatracaAcessosSerieDiaria[];
}

function normalizeRanking(payload: Record<string, unknown>): CatracaAcessosRankingItem[] {
  const raw = payload.rankingFrequencia ?? payload.ranking ?? payload.topClientes;
  if (!Array.isArray(raw)) return [];
  return raw
    .map((entry, index) => {
      const record = toRecord(entry);
      if (!record) return null;
      const nome = toStringByKeys(record, ["nome", "memberNome", "name", "cliente"]);
      if (!nome) return null;
      return {
        posicao: toNumber(record.posicao) ?? index + 1,
        memberId: toStringByKeys(record, ["memberId", "clienteId", "alunoId"]),
        nome,
        fotoUrl: toStringByKeys(record, ["fotoUrl", "memberFoto", "foto"]),
        contrato: toStringByKeys(record, ["contrato", "plano"]),
        statusCliente: toStringByKeys(record, ["statusCliente", "status"]),
        frequencia: toNumber(record.frequencia) ?? 0,
      };
    })
    .filter(Boolean) as CatracaAcessosRankingItem[];
}

async function listarAcessosCatracaApi(
  input: ListarAcessosCatracaInput
): Promise<CatracaAcessosResponse> {
  const page = Math.max(0, input.page ?? 0);
  const size = Math.min(200, Math.max(1, input.size ?? 20));
  const path =
    (process.env.NEXT_PUBLIC_CATRACA_ACESSOS_PATH ?? "").trim() ||
    "/api/v1/integracoes/catraca/acessos";

  const response = await apiRequest<unknown>({
    path,
    query: {
      tenantId: input.tenantId,
      page,
      size,
      startDate: input.startDate,
      endDate: input.endDate,
      memberId: input.memberId,
      envelope: true,
    },
  });

  return normalizeAcessosResponse(response, page, size);
}

export async function listarAcessosCatracaDashboardApi(
  input: ListarAcessosCatracaInput
): Promise<CatracaAcessosDashboardResponse> {
  const page = Math.max(0, input.page ?? 0);
  const size = Math.min(200, Math.max(1, input.size ?? 20));
  const response = await apiRequest<unknown>({
    path: "/api/v1/gerencial/catraca/acessos/dashboard",
    query: {
      tenantId: input.tenantId,
      page,
      size,
      startDate: input.startDate,
      endDate: input.endDate,
      memberId: input.memberId,
      tipoLiberacao: input.tipoLiberacao,
      status: input.status,
      uniqueWindowMinutes: input.uniqueWindowMinutes,
      timezone: input.timezone,
    },
  });

  const payload = toRecord(response);
  if (!payload) {
    return normalizeAcessosResponse(response, page, size);
  }

  const listaPayload = payload.lista ?? payload.listaAcessos ?? payload;
  const listaNormalizada = normalizeAcessosResponse(listaPayload, page, size);
  return {
    ...listaNormalizada,
    resumo: normalizeResumo(payload),
    serieDiaria: normalizeSerieDiaria(payload),
    rankingFrequencia: normalizeRanking(payload),
  };
}
