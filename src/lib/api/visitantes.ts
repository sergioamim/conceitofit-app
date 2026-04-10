/**
 * API client para gestão de visitantes na catraca (day-use, aula experimental,
 * convidado). Consome VisitanteController do backend Java.
 *
 * Task #541. Base: /api/v1/visitantes
 */
import { apiRequest } from "./http";

export type TipoVisitante = "DAY_USE" | "AULA_EXPERIMENTAL" | "CONVIDADO";

export interface Visitante {
  id: string;
  tenantId: string;
  nome: string;
  documento?: string;
  tipo: TipoVisitante;
  codigoAcesso: string;
  validoAte: string;
  maxEntradas: number;
  entradasRealizadas: number;
  valorCobrado?: number;
  contaReceberId?: string | null;
  revogado: boolean;
  alunoResponsavelId?: string | null;
  createdAt?: string | null;
}

export interface RegistrarVisitantePayload {
  nome: string;
  documento?: string;
  telefone?: string;
  email?: string;
  tipo: TipoVisitante;
  alunoResponsavelId?: string;
  validoAte: string; // ISO datetime
  maxEntradas?: number;
  valorCobrado?: number;
  observacoes?: string;
}

export interface ValidacaoVisitanteResult {
  valido: boolean;
  motivo?: string;
  visitanteId?: string;
  nome?: string;
  tipo?: TipoVisitante;
  entradasRealizadas?: number;
  maxEntradas?: number;
}

/**
 * Normaliza resposta do BE (que retorna Map<String,Object>) para tipo forte.
 */
function normalizeVisitante(raw: Record<string, unknown>): Visitante {
  return {
    id: String(raw.id ?? ""),
    tenantId: String(raw.tenantId ?? ""),
    nome: String(raw.nome ?? ""),
    documento: raw.documento ? String(raw.documento) : undefined,
    tipo: (raw.tipo as TipoVisitante) ?? "DAY_USE",
    codigoAcesso: String(raw.codigoAcesso ?? ""),
    validoAte: String(raw.validoAte ?? ""),
    maxEntradas: Number(raw.maxEntradas ?? 1),
    entradasRealizadas: Number(raw.entradasRealizadas ?? 0),
    valorCobrado: raw.valorCobrado != null ? Number(raw.valorCobrado) : undefined,
    contaReceberId: (raw.contaReceberId as string | null | undefined) ?? null,
    revogado: Boolean(raw.revogado),
    alunoResponsavelId: (raw.alunoResponsavelId as string | null | undefined) ?? null,
    createdAt: (raw.createdAt as string | null | undefined) ?? null,
  };
}

export async function listVisitantesAtivosApi(input: {
  tenantId: string;
}): Promise<Visitante[]> {
  const response = await apiRequest<Record<string, unknown>[]>({
    path: "/api/v1/visitantes",
    query: { tenantId: input.tenantId },
  });
  return Array.isArray(response) ? response.map(normalizeVisitante) : [];
}

export async function registrarVisitanteApi(input: {
  tenantId: string;
  data: RegistrarVisitantePayload;
}): Promise<Visitante> {
  const response = await apiRequest<Record<string, unknown>>({
    path: "/api/v1/visitantes",
    method: "POST",
    query: { tenantId: input.tenantId },
    body: input.data,
  });
  return normalizeVisitante(response);
}

export async function validarAcessoVisitanteApi(input: {
  tenantId: string;
  codigoAcesso: string;
}): Promise<ValidacaoVisitanteResult> {
  const response = await apiRequest<Record<string, unknown>>({
    path: "/api/v1/visitantes/validar",
    method: "POST",
    query: { tenantId: input.tenantId },
    body: { codigoAcesso: input.codigoAcesso },
  });
  return {
    valido: Boolean(response.valido),
    motivo: (response.motivo as string | undefined) ?? undefined,
    visitanteId: (response.visitanteId as string | undefined) ?? undefined,
    nome: (response.nome as string | undefined) ?? undefined,
    tipo: (response.tipo as TipoVisitante | undefined) ?? undefined,
    entradasRealizadas:
      response.entradasRealizadas != null ? Number(response.entradasRealizadas) : undefined,
    maxEntradas: response.maxEntradas != null ? Number(response.maxEntradas) : undefined,
  };
}

export async function registrarEntradaVisitanteApi(input: {
  tenantId: string;
  codigoAcesso: string;
  deviceId?: string;
}): Promise<Visitante> {
  const response = await apiRequest<Record<string, unknown>>({
    path: "/api/v1/visitantes/entrada",
    method: "POST",
    query: { tenantId: input.tenantId },
    body: { codigoAcesso: input.codigoAcesso, deviceId: input.deviceId },
  });
  return normalizeVisitante(response);
}

export async function revogarVisitanteApi(input: {
  tenantId: string;
  visitanteId: string;
}): Promise<void> {
  await apiRequest<Record<string, unknown>>({
    path: `/api/v1/visitantes/${input.visitanteId}`,
    method: "DELETE",
    query: { tenantId: input.tenantId },
  });
}
