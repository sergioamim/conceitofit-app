import type { ContratoCreditoDias } from "@/lib/types";
import { apiRequest } from "./http";

type ContratoCreditoDiasApiResponse = Partial<ContratoCreditoDias>;

export interface EmitirContratoCreditoDiasApiInput {
  contratoId: string;
  dias: number;
  motivo: string;
}

export interface EstornarContratoCreditoDiasApiInput {
  creditoId: string;
  tenantId: string;
  motivo: string;
}

function toNumber(value: unknown, fallback = 0): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function toBoolean(value: unknown, fallback = false): boolean {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (normalized === "true") return true;
    if (normalized === "false") return false;
  }
  return fallback;
}

function normalizeContratoCreditoDiasResponse(
  input: ContratoCreditoDiasApiResponse,
): ContratoCreditoDias {
  return {
    id: typeof input.id === "string" ? input.id : "",
    tenantId: typeof input.tenantId === "string" ? input.tenantId : "",
    contratoId: typeof input.contratoId === "string" ? input.contratoId : "",
    alunoId: typeof input.alunoId === "string" ? input.alunoId : "",
    dias: toNumber(input.dias),
    motivo: typeof input.motivo === "string" ? input.motivo : "",
    origem: input.origem ?? "INDIVIDUAL",
    autorizadoPorUsuarioId: toNumber(input.autorizadoPorUsuarioId),
    autorizadoPorNome:
      typeof input.autorizadoPorNome === "string" ? input.autorizadoPorNome : undefined,
    autorizadoPorPapel:
      typeof input.autorizadoPorPapel === "string" ? input.autorizadoPorPapel : "",
    emitidoEm: typeof input.emitidoEm === "string" ? input.emitidoEm : "",
    notificarCliente: toBoolean(input.notificarCliente),
    dataFimAnterior:
      typeof input.dataFimAnterior === "string" ? input.dataFimAnterior : "",
    dataFimPosterior:
      typeof input.dataFimPosterior === "string" ? input.dataFimPosterior : "",
    estornado: toBoolean(input.estornado),
    estornadoEm:
      typeof input.estornadoEm === "string" ? input.estornadoEm : undefined,
    estornadoPorUsuarioId:
      input.estornadoPorUsuarioId == null
        ? undefined
        : toNumber(input.estornadoPorUsuarioId),
    estornadoPorNome:
      typeof input.estornadoPorNome === "string" ? input.estornadoPorNome : undefined,
    estornoMotivo:
      typeof input.estornoMotivo === "string" ? input.estornoMotivo : undefined,
  };
}

export async function listContratoCreditosDiasApi(input: {
  contratoId: string;
}): Promise<ContratoCreditoDias[]> {
  const response = await apiRequest<ContratoCreditoDiasApiResponse[]>({
    path: `/api/v1/contratos/${encodeURIComponent(input.contratoId)}/creditos-dias`,
  });
  return Array.isArray(response)
    ? response.map(normalizeContratoCreditoDiasResponse)
    : [];
}

export async function emitirContratoCreditoDiasApi(
  input: EmitirContratoCreditoDiasApiInput,
): Promise<ContratoCreditoDias> {
  const response = await apiRequest<ContratoCreditoDiasApiResponse>({
    path: `/api/v1/contratos/${encodeURIComponent(input.contratoId)}/creditos-dias`,
    method: "POST",
    body: {
      dias: input.dias,
      motivo: input.motivo,
    },
  });
  return normalizeContratoCreditoDiasResponse(response);
}

export async function estornarContratoCreditoDiasApi(
  input: EstornarContratoCreditoDiasApiInput,
): Promise<ContratoCreditoDias> {
  const response = await apiRequest<ContratoCreditoDiasApiResponse>({
    path: `/api/v1/contratos/creditos-dias/${encodeURIComponent(input.creditoId)}/estornar`,
    method: "POST",
    body: {
      tenantId: input.tenantId,
      motivo: input.motivo,
    },
  });
  return normalizeContratoCreditoDiasResponse(response);
}
