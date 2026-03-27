import type {
  AuditLogAction,
  AuditLogEntityType,
  AuditLogEntry,
  PaginatedResult,
} from "@/lib/types";
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

/* ── Helpers ──────────────────────────────────── */

function cleanString(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const normalized = value.trim();
  return normalized || undefined;
}

const VALID_ACTIONS = new Set<AuditLogAction>([
  "CRIOU", "EDITOU", "EXCLUIU", "SUSPENDEU", "ATIVOU", "CANCELOU", "IMPORTOU",
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
