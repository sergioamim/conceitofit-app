import type {
  AuditLogAction,
  AuditLogEntityType,
  AuditLogEntry,
  PaginatedResult,
} from "@/lib/types";
import type { AuthSession, AuthSessionScope, TenantAccess } from "./session";
import { apiRequest } from "./http";

/* ── API response types (lenient) ─────────────── */

type AuditLogEntryApiResponse = Partial<AuditLogEntry> & {
  id?: string | null;
  timestamp?: string | null;
  userId?: string | null;
  userName?: string | null;
  action?: string | null;
  entityType?: string | null;
  entityId?: string | null;
  entityName?: string | null;
  academiaId?: string | null;
  academiaNome?: string | null;
  tenantId?: string | null;
  tenantNome?: string | null;
  detalhes?: string | null;
  ip?: string | null;
};

type AnyListResponse<T> =
  | T[]
  | {
      items?: T[];
      content?: T[];
      data?: T[];
      rows?: T[];
      result?: T[];
      itens?: T[];
      total?: number;
      page?: number;
      size?: number;
      hasNext?: boolean;
    };

type RawTenantAccess = {
  tenantId?: unknown;
  defaultTenant?: unknown;
};

type RawImpersonationSessionPayload = {
  token?: unknown;
  refreshToken?: unknown;
  type?: unknown;
  expiresIn?: unknown;
  userId?: unknown;
  userKind?: unknown;
  displayName?: unknown;
  redeId?: unknown;
  redeSubdominio?: unknown;
  redeSlug?: unknown;
  redeNome?: unknown;
  activeTenantId?: unknown;
  tenantBaseId?: unknown;
  availableTenants?: unknown;
  availableScopes?: unknown;
  broadAccess?: unknown;
};

type RawImpersonationResponse = {
  auditContextId?: unknown;
  targetUserId?: unknown;
  targetUserName?: unknown;
  redirectTo?: unknown;
  session?: RawImpersonationSessionPayload | null;
} & RawImpersonationSessionPayload;

/* ── Helpers ──────────────────────────────────── */

function cleanString(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const normalized = value.trim();
  return normalized || undefined;
}

const VALID_ACTIONS = new Set<AuditLogAction>([
  "CRIOU", "EDITOU", "EXCLUIU", "SUSPENDEU", "ATIVOU", "CANCELOU", "IMPORTOU", "IMPERSONOU", "ENCERROU_IMPERSONACAO",
]);

const VALID_ENTITY_TYPES = new Set<AuditLogEntityType>([
  "ACADEMIA", "UNIDADE", "USUARIO", "CONTRATO", "ALUNO", "MATRICULA", "PAGAMENTO", "PERFIL", "PLANO",
]);

function normalizeEntry(raw: AuditLogEntryApiResponse): AuditLogEntry {
  return {
    id: cleanString(raw.id) ?? "",
    timestamp: cleanString(raw.timestamp) ?? "",
    userId: cleanString(raw.userId) ?? "",
    userName: cleanString(raw.userName) ?? "—",
    action: VALID_ACTIONS.has(raw.action as AuditLogAction)
      ? (raw.action as AuditLogAction)
      : "EDITOU",
    entityType: VALID_ENTITY_TYPES.has(raw.entityType as AuditLogEntityType)
      ? (raw.entityType as AuditLogEntityType)
      : "ACADEMIA",
    entityId: cleanString(raw.entityId) ?? "",
    entityName: cleanString(raw.entityName) ?? "—",
    academiaId: cleanString(raw.academiaId),
    academiaNome: cleanString(raw.academiaNome),
    tenantId: cleanString(raw.tenantId),
    tenantNome: cleanString(raw.tenantNome),
    detalhes: cleanString(raw.detalhes),
    ip: cleanString(raw.ip),
  };
}

function extractItems<T>(payload: AnyListResponse<T>): T[] {
  if (Array.isArray(payload)) return payload;
  return (
    payload.items ??
    payload.content ??
    payload.data ??
    payload.rows ??
    payload.result ??
    payload.itens ??
    []
  );
}

function toBoolean(value: unknown, fallback = false): boolean {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value === 1;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (["true", "1", "sim", "yes", "on"].includes(normalized)) return true;
    if (["false", "0", "nao", "não", "no", "off"].includes(normalized)) return false;
  }
  return fallback;
}

function toNumber(value: unknown): number | undefined {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function normalizeAvailableScopes(value: unknown): AuthSessionScope[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => (typeof item === "string" ? item.trim().toUpperCase() : ""))
    .filter((item): item is AuthSessionScope => item === "UNIDADE" || item === "REDE" || item === "GLOBAL");
}

function normalizeAvailableTenants(value: unknown): TenantAccess[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const candidate = item as RawTenantAccess;
      const tenantId = cleanString(candidate.tenantId);
      if (!tenantId) return null;
      return {
        tenantId,
        defaultTenant: toBoolean(candidate.defaultTenant),
      };
    })
    .filter((item): item is TenantAccess => item !== null);
}

function normalizeImpersonationSession(payload: RawImpersonationSessionPayload): AuthSession {
  return {
    token: cleanString(payload.token) ?? "",
    refreshToken: cleanString(payload.refreshToken) ?? "",
    type: cleanString(payload.type) ?? "Bearer",
    expiresIn: toNumber(payload.expiresIn),
    userId: cleanString(payload.userId),
    userKind: cleanString(payload.userKind),
    displayName: cleanString(payload.displayName),
    networkId: cleanString(payload.redeId),
    networkSubdomain: cleanString(payload.redeSubdominio) ?? cleanString(payload.redeSlug),
    networkSlug: cleanString(payload.redeSubdominio) ?? cleanString(payload.redeSlug),
    networkName: cleanString(payload.redeNome),
    activeTenantId: cleanString(payload.activeTenantId),
    baseTenantId: cleanString(payload.tenantBaseId),
    availableTenants: normalizeAvailableTenants(payload.availableTenants),
    availableScopes: normalizeAvailableScopes(payload.availableScopes),
    broadAccess: toBoolean(payload.broadAccess),
  };
}

/* ── Public API ───────────────────────────────── */

export interface ListAuditLogsInput {
  page?: number;
  size?: number;
  action?: string;
  entityType?: string;
  academiaId?: string;
  userId?: string;
  startDate?: string;
  endDate?: string;
  query?: string;
}

export interface StartImpersonationInput {
  userId: string;
  justification: string;
}

export interface StartImpersonationResult {
  auditContextId?: string;
  targetUserId?: string;
  targetUserName?: string;
  redirectTo?: string;
  session: AuthSession;
}

export interface EndImpersonationInput {
  auditContextId?: string;
  targetUserId?: string;
  targetUserName?: string;
}

export async function listAuditLogsApi(
  input: ListAuditLogsInput = {}
): Promise<PaginatedResult<AuditLogEntry>> {
  const query: Record<string, string | number | boolean | undefined> = {
    page: input.page ?? 0,
    size: input.size ?? 20,
  };
  if (input.action) query.action = input.action;
  if (input.entityType) query.entityType = input.entityType;
  if (input.academiaId) query.academiaId = input.academiaId;
  if (input.userId) query.userId = input.userId;
  if (input.startDate) query.startDate = input.startDate;
  if (input.endDate) query.endDate = input.endDate;
  if (input.query) query.query = input.query;

  const response = await apiRequest<AnyListResponse<AuditLogEntryApiResponse>>({
    path: "/api/v1/administrativo/audit-log",
    query,
  });

  const rawItems = extractItems(response);
  const items = rawItems.map(normalizeEntry);
  const meta = Array.isArray(response) ? undefined : response;

  return {
    items,
    page: meta?.page ?? (input.page ?? 0),
    size: meta?.size ?? (input.size ?? 20),
    total: meta?.total,
    hasNext: meta?.hasNext ?? items.length >= (input.size ?? 20),
  };
}

export async function impersonateUserApi(input: StartImpersonationInput): Promise<StartImpersonationResult> {
  const response = await apiRequest<RawImpersonationResponse>({
    path: `/api/v1/administrativo/audit-log/usuarios/${encodeURIComponent(input.userId)}/impersonate`,
    method: "POST",
    body: {
      justification: input.justification,
    },
  });

  const rawSession = response.session ?? response;
  return {
    auditContextId: cleanString(response.auditContextId),
    targetUserId: cleanString(response.targetUserId) ?? input.userId,
    targetUserName: cleanString(response.targetUserName),
    redirectTo: cleanString(response.redirectTo),
    session: normalizeImpersonationSession(rawSession),
  };
}

export async function endImpersonationApi(input: EndImpersonationInput): Promise<void> {
  await apiRequest<void>({
    path: "/api/v1/administrativo/audit-log/impersonation/end",
    method: "POST",
    body: {
      auditContextId: input.auditContextId,
      targetUserId: input.targetUserId,
      targetUserName: input.targetUserName,
    },
  });
}
