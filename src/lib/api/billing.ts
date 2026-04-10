/**
 * ⚠️ MÓDULO FANTASMA — Billing recorrente
 *
 * Todos os endpoints abaixo (`/api/v1/billing/config`, `/api/v1/billing/assinaturas`)
 * **ainda não existem no backend Java** em 2026-04-10. Consumir este módulo hoje
 * retorna 404.
 *
 * Status formalizado em ADR-001: manter o arquivo como "pronto para ligar".
 * Roadmap: PRD Q2 Épico 3.2 (tasks 29-32). Quando o BE estiver pronto, ligar a
 * flag `NEXT_PUBLIC_BILLING_RECORRENTE_ENABLED`.
 *
 * Antes de consumir em nova tela: checar `isBillingRecurrenteEnabled()` e
 * esconder o fluxo quando `false`.
 *
 * @see docs/adr/ADR-001-modulos-fe-fantasma.md
 * @see docs/API_AUDIT_BACKEND_VS_FRONTEND.md seção A (P0)
 */
import type {
  Assinatura,
  BillingConfig,
  CicloAssinatura,
  ProvedorGateway,
  StatusAssinatura,
} from "@/lib/types";
import { apiRequest } from "./http";

// ─── Raw API response types ──────────────────────────────────────────────

type AssinaturaApiResponse = Partial<Assinatura> & {
  id?: string | null;
  status?: unknown;
  valor?: unknown;
  ciclo?: unknown;
  proximaCobranca?: string | null;
};

type BillingConfigApiResponse = Partial<BillingConfig> & {
  id?: string | null;
  provedorAtivo?: unknown;
  chaveApi?: string | null;
  ambiente?: unknown;
  statusConexao?: unknown;
  ativo?: unknown;
};

type AnyListResponse<T> =
  | T[]
  | { items?: T[]; content?: T[]; data?: T[]; rows?: T[] };

// ─── Helpers ─────────────────────────────────────────────────────────────

function cleanString(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const normalized = value.trim();
  return normalized || undefined;
}

function toNumber(value: unknown, fallback = 0): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function toBoolean(value: unknown, fallback = true): boolean {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    const n = value.trim().toLowerCase();
    if (n === "true" || n === "1") return true;
    if (n === "false" || n === "0") return false;
  }
  return fallback;
}

function extractItems<T>(response: AnyListResponse<T>): T[] {
  if (Array.isArray(response)) return response;
  return response.items ?? response.content ?? response.data ?? response.rows ?? [];
}

const STATUS_VALIDOS: StatusAssinatura[] = ["ATIVA", "PENDENTE", "CANCELADA", "SUSPENSA", "VENCIDA"];
const CICLOS_VALIDOS: CicloAssinatura[] = ["MENSAL", "TRIMESTRAL", "SEMESTRAL", "ANUAL"];
const PROVEDORES_VALIDOS: ProvedorGateway[] = ["PAGARME", "STRIPE", "MERCADO_PAGO", "CIELO_ECOMMERCE", "ASAAS", "OUTRO"];

function normalizeStatus(value: unknown): StatusAssinatura {
  const str = cleanString(value)?.toUpperCase();
  if (str && STATUS_VALIDOS.includes(str as StatusAssinatura)) return str as StatusAssinatura;
  return "PENDENTE";
}

function normalizeCiclo(value: unknown): CicloAssinatura {
  const str = cleanString(value)?.toUpperCase();
  if (str && CICLOS_VALIDOS.includes(str as CicloAssinatura)) return str as CicloAssinatura;
  return "MENSAL";
}

function normalizeProvedor(value: unknown): ProvedorGateway {
  const str = cleanString(value)?.toUpperCase();
  if (str && PROVEDORES_VALIDOS.includes(str as ProvedorGateway)) return str as ProvedorGateway;
  return "OUTRO";
}

function normalizeConexaoStatus(value: unknown): BillingConfig["statusConexao"] {
  const str = cleanString(value)?.toUpperCase();
  if (str === "ONLINE" || str === "OFFLINE") return str;
  return "NAO_CONFIGURADO";
}

// ─── Normalizers ─────────────────────────────────────────────────────────

function normalizeAssinatura(input: AssinaturaApiResponse): Assinatura {
  return {
    id: cleanString(input.id) ?? "",
    tenantId: cleanString(input.tenantId) ?? "",
    alunoId: cleanString(input.alunoId) ?? "",
    planoId: cleanString(input.planoId) ?? "",
    clienteNome: cleanString(input.clienteNome),
    planoNome: cleanString(input.planoNome),
    status: normalizeStatus(input.status),
    valor: toNumber(input.valor),
    ciclo: normalizeCiclo(input.ciclo),
    dataInicio: cleanString(input.dataInicio) ?? "",
    proximaCobranca: cleanString(input.proximaCobranca),
    dataFim: cleanString(input.dataFim),
    gatewayId: cleanString(input.gatewayId),
    gatewayAssinaturaId: cleanString(input.gatewayAssinaturaId),
    criadoEm: cleanString(input.criadoEm),
    atualizadoEm: cleanString(input.atualizadoEm),
  };
}

function normalizeBillingConfig(input: BillingConfigApiResponse): BillingConfig {
  return {
    id: cleanString(input.id) ?? "",
    tenantId: cleanString(input.tenantId) ?? "",
    provedorAtivo: normalizeProvedor(input.provedorAtivo),
    chaveApi: cleanString(input.chaveApi) ?? "",
    webhookUrl: cleanString(input.webhookUrl),
    webhookSecret: cleanString(input.webhookSecret),
    ambiente: cleanString(input.ambiente)?.toUpperCase() === "PRODUCAO" ? "PRODUCAO" : "SANDBOX",
    statusConexao: normalizeConexaoStatus(input.statusConexao),
    ultimoTesteEm: cleanString(input.ultimoTesteEm),
    ativo: toBoolean(input.ativo, false),
  };
}

// ─── Billing Config API ──────────────────────────────────────────────────

export async function getBillingConfigApi(input: {
  tenantId: string;
}): Promise<BillingConfig | null> {
  try {
    const response = await apiRequest<BillingConfigApiResponse>({
      path: "/api/v1/billing/config",
      query: { tenantId: input.tenantId },
    });
    return normalizeBillingConfig(response);
  } catch {
    return null;
  }
}

export async function saveBillingConfigApi(input: {
  tenantId: string;
  data: {
    provedorAtivo: ProvedorGateway;
    chaveApi: string;
    ambiente: "SANDBOX" | "PRODUCAO";
    ativo: boolean;
  };
}): Promise<BillingConfig> {
  const response = await apiRequest<BillingConfigApiResponse>({
    path: "/api/v1/billing/config",
    method: "PUT",
    query: { tenantId: input.tenantId },
    body: input.data,
  });
  return normalizeBillingConfig(response);
}

export async function testBillingConnectionApi(input: {
  tenantId: string;
}): Promise<{ success: boolean; message: string }> {
  return apiRequest<{ success: boolean; message: string }>({
    path: "/api/v1/billing/config/test",
    method: "POST",
    query: { tenantId: input.tenantId },
  });
}

// ─── Assinaturas API ─────────────────────────────────────────────────────

async function listAssinaturasApi(input: {
  tenantId: string;
  status?: StatusAssinatura;
  page?: number;
  size?: number;
}): Promise<Assinatura[]> {
  const response = await apiRequest<AnyListResponse<AssinaturaApiResponse>>({
    path: "/api/v1/billing/assinaturas",
    query: {
      tenantId: input.tenantId,
      status: input.status,
      page: input.page,
      size: input.size,
    },
  });
  return extractItems(response).map(normalizeAssinatura);
}

export async function createAssinaturaApi(input: {
  tenantId: string;
  data: {
    alunoId: string;
    planoId: string;
    dataInicio: string;
    ciclo?: CicloAssinatura;
  };
}): Promise<Assinatura> {
  const response = await apiRequest<AssinaturaApiResponse>({
    path: "/api/v1/billing/assinaturas",
    method: "POST",
    query: { tenantId: input.tenantId },
    body: input.data,
  });
  return normalizeAssinatura(response);
}

export async function cancelarAssinaturaApi(input: {
  tenantId: string;
  id: string;
}): Promise<Assinatura> {
  const response = await apiRequest<AssinaturaApiResponse>({
    path: `/api/v1/billing/assinaturas/${input.id}/cancelar`,
    method: "PATCH",
    query: { tenantId: input.tenantId },
  });
  return normalizeAssinatura(response);
}

async function getAssinaturaApi(input: {
  tenantId: string;
  id: string;
}): Promise<Assinatura> {
  const response = await apiRequest<AssinaturaApiResponse>({
    path: `/api/v1/billing/assinaturas/${input.id}`,
    query: { tenantId: input.tenantId },
  });
  return normalizeAssinatura(response);
}
