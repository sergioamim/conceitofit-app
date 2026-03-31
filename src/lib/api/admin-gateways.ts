import type { GatewayPagamento, ProvedorGateway } from "@/lib/types";
import { apiRequest } from "./http";

type GatewayApiResponse = Partial<GatewayPagamento> & {
  id?: string | null;
  nome?: string | null;
  provedor?: ProvedorGateway | null;
  chaveApi?: string | null;
  ambiente?: unknown;
  ativo?: unknown;
  criadoEm?: string | null;
  atualizadoEm?: string | null;
};

type GatewayPayload = Omit<GatewayPagamento, "id" | "criadoEm" | "atualizadoEm">;

type AnyListResponse<T> =
  | T[]
  | {
      items?: T[];
      content?: T[];
      data?: T[];
      rows?: T[];
      result?: T[];
      itens?: T[];
    };

function cleanString(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const normalized = value.trim();
  return normalized || undefined;
}

function toBoolean(value: unknown, fallback = true): boolean {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value === 1;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (normalized === "true" || normalized === "1" || normalized === "sim") return true;
    if (normalized === "false" || normalized === "0" || normalized === "nao" || normalized === "não") return false;
  }
  return fallback;
}

function extractItems<T>(response: AnyListResponse<T>): T[] {
  if (Array.isArray(response)) return response;
  return response.items ?? response.content ?? response.data ?? response.rows ?? response.result ?? response.itens ?? [];
}

const PROVEDORES_VALIDOS: ProvedorGateway[] = [
  "PAGARME", "STRIPE", "MERCADO_PAGO", "CIELO_ECOMMERCE", "ASAAS", "OUTRO",
];

function normalizeProvedor(value: unknown): ProvedorGateway {
  const str = cleanString(value)?.toUpperCase();
  if (str && PROVEDORES_VALIDOS.includes(str as ProvedorGateway)) return str as ProvedorGateway;
  return "OUTRO";
}

function normalizeAmbiente(value: unknown): "SANDBOX" | "PRODUCAO" {
  const str = cleanString(value)?.toUpperCase();
  if (str === "PRODUCAO" || str === "PRODUCTION") return "PRODUCAO";
  return "SANDBOX";
}

function normalizeGateway(
  input: GatewayApiResponse,
  fallback?: Partial<GatewayPayload> & { id?: string },
): GatewayPagamento {
  return {
    id: cleanString(input.id) ?? fallback?.id ?? "",
    nome: cleanString(input.nome) ?? fallback?.nome ?? "",
    provedor: normalizeProvedor(input.provedor) ?? fallback?.provedor ?? "OUTRO",
    chaveApi: cleanString(input.chaveApi) ?? fallback?.chaveApi ?? "",
    ambiente: normalizeAmbiente(input.ambiente) ?? fallback?.ambiente ?? "SANDBOX",
    ativo: toBoolean(input.ativo, fallback?.ativo ?? true),
    criadoEm: cleanString(input.criadoEm),
    atualizadoEm: cleanString(input.atualizadoEm),
  };
}

function buildGatewayPayload(data: GatewayPayload): Record<string, unknown> {
  return {
    nome: cleanString(data.nome) ?? "",
    provedor: data.provedor,
    chaveApi: cleanString(data.chaveApi) ?? "",
    ambiente: data.ambiente,
    ativo: data.ativo,
  };
}

export async function listAdminGateways(): Promise<GatewayPagamento[]> {
  const response = await apiRequest<AnyListResponse<GatewayApiResponse>>({
    path: "/api/v1/admin/financeiro/gateways",
  });
  return extractItems(response).map((item) => normalizeGateway(item));
}

export async function createAdminGateway(data: GatewayPayload): Promise<GatewayPagamento> {
  const response = await apiRequest<GatewayApiResponse>({
    path: "/api/v1/admin/financeiro/gateways",
    method: "POST",
    body: buildGatewayPayload(data),
  });
  return normalizeGateway(response, data);
}

export async function updateAdminGateway(id: string, data: GatewayPayload): Promise<GatewayPagamento> {
  const response = await apiRequest<GatewayApiResponse>({
    path: `/api/v1/admin/financeiro/gateways/${id}`,
    method: "PUT",
    body: buildGatewayPayload(data),
  });
  return normalizeGateway(response, { ...data, id });
}

export async function ativarAdminGateway(id: string): Promise<GatewayPagamento> {
  const response = await apiRequest<GatewayApiResponse>({
    path: `/api/v1/admin/financeiro/gateways/${id}/ativar`,
    method: "PATCH",
  });
  return normalizeGateway(response, { id, ativo: true });
}

export async function desativarAdminGateway(id: string): Promise<GatewayPagamento> {
  const response = await apiRequest<GatewayApiResponse>({
    path: `/api/v1/admin/financeiro/gateways/${id}/desativar`,
    method: "PATCH",
  });
  return normalizeGateway(response, { id, ativo: false });
}
