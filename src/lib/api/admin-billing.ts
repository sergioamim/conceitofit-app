import type {
  CicloPlanoPlataforma,
  ContratoPlataforma,
  PlanoPlataforma,
  StatusContratoPlataforma,
} from "@/lib/types";
import { apiRequest } from "./http";

type PlanoPlataformaApiResponse = Partial<PlanoPlataforma> & {
  id?: string | null;
  nome?: string | null;
  descricao?: string | null;
  precoMensal?: unknown;
  precoAnual?: unknown;
  ciclo?: CicloPlanoPlataforma | null;
  maxUnidades?: unknown;
  maxAlunos?: unknown;
  featuresIncluidas?: unknown;
  ativo?: unknown;
};

type PlanoPlataformaPayload = Omit<PlanoPlataforma, "id">;

type ContratoPlataformaApiResponse = Partial<ContratoPlataforma> & {
  id?: string | null;
  academiaId?: string | null;
  planoId?: string | null;
  planoNome?: string | null;
  academiaNome?: string | null;
  dataInicio?: string | null;
  dataFim?: string | null;
  ciclo?: CicloPlanoPlataforma | null;
  valorMensal?: unknown;
  status?: StatusContratoPlataforma | null;
  motivoSuspensao?: string | null;
  historicoPlanosIds?: unknown;
};

type ContratoPlataformaPayload = Omit<ContratoPlataforma, "id" | "planoNome" | "academiaNome">;

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

function toNumber(value: unknown, fallback = 0): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function toOptionalNumber(value: unknown): number | undefined {
  if (value == null || value === "") return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
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

function normalizeFeatures(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => cleanString(item))
    .filter((item): item is string => Boolean(item));
}

function normalizeIds(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => cleanString(item))
    .filter((item): item is string => Boolean(item));
}

function normalizePlanoPlataforma(
  input: PlanoPlataformaApiResponse,
  fallback?: Partial<PlanoPlataformaPayload> & { id?: string }
): PlanoPlataforma {
  return {
    id: cleanString(input.id) ?? fallback?.id ?? "",
    nome: cleanString(input.nome) ?? fallback?.nome ?? "",
    descricao: cleanString(input.descricao) ?? fallback?.descricao,
    precoMensal: toNumber(input.precoMensal, fallback?.precoMensal ?? 0),
    precoAnual: toOptionalNumber(input.precoAnual) ?? fallback?.precoAnual,
    ciclo: input.ciclo ?? fallback?.ciclo ?? "MENSAL",
    maxUnidades: toOptionalNumber(input.maxUnidades) ?? fallback?.maxUnidades,
    maxAlunos: toOptionalNumber(input.maxAlunos) ?? fallback?.maxAlunos,
    featuresIncluidas: normalizeFeatures(input.featuresIncluidas).length
      ? normalizeFeatures(input.featuresIncluidas)
      : fallback?.featuresIncluidas ?? [],
    ativo: toBoolean(input.ativo, fallback?.ativo ?? true),
  };
}

function buildPlanoPayload(data: PlanoPlataformaPayload): Record<string, unknown> {
  return {
    nome: cleanString(data.nome) ?? "",
    descricao: cleanString(data.descricao),
    precoMensal: data.precoMensal,
    precoAnual: data.precoAnual,
    ciclo: data.ciclo,
    maxUnidades: data.maxUnidades,
    maxAlunos: data.maxAlunos,
    featuresIncluidas: data.featuresIncluidas,
    ativo: data.ativo,
  };
}

function normalizeContratoPlataforma(
  input: ContratoPlataformaApiResponse,
  fallback?: Partial<ContratoPlataformaPayload> & { id?: string }
): ContratoPlataforma {
  return {
    id: cleanString(input.id) ?? fallback?.id ?? "",
    academiaId: cleanString(input.academiaId) ?? fallback?.academiaId ?? "",
    planoId: cleanString(input.planoId) ?? fallback?.planoId ?? "",
    planoNome: cleanString(input.planoNome) ?? "",
    academiaNome: cleanString(input.academiaNome) ?? "",
    dataInicio: cleanString(input.dataInicio) ?? fallback?.dataInicio ?? "",
    dataFim: cleanString(input.dataFim) ?? fallback?.dataFim,
    ciclo: input.ciclo ?? fallback?.ciclo ?? "MENSAL",
    valorMensal: toNumber(input.valorMensal, fallback?.valorMensal ?? 0),
    status: input.status ?? fallback?.status ?? "ATIVO",
    motivoSuspensao: cleanString(input.motivoSuspensao) ?? fallback?.motivoSuspensao,
    historicoPlanosIds: normalizeIds(input.historicoPlanosIds).length
      ? normalizeIds(input.historicoPlanosIds)
      : fallback?.historicoPlanosIds ?? [],
  };
}

function buildContratoPayload(data: ContratoPlataformaPayload): Record<string, unknown> {
  return {
    academiaId: data.academiaId,
    planoId: data.planoId,
    dataInicio: data.dataInicio,
    dataFim: data.dataFim,
    ciclo: data.ciclo,
    valorMensal: data.valorMensal,
    status: data.status,
    motivoSuspensao: cleanString(data.motivoSuspensao),
    historicoPlanosIds: data.historicoPlanosIds,
  };
}

export async function listAdminPlanos(): Promise<PlanoPlataforma[]> {
  const response = await apiRequest<AnyListResponse<PlanoPlataformaApiResponse>>({
    path: "/api/v1/admin/financeiro/planos",
  });
  return extractItems(response).map((item) => normalizePlanoPlataforma(item));
}

export async function createAdminPlano(data: PlanoPlataformaPayload): Promise<PlanoPlataforma> {
  const response = await apiRequest<PlanoPlataformaApiResponse>({
    path: "/api/v1/admin/financeiro/planos",
    method: "POST",
    body: buildPlanoPayload(data),
  });
  return normalizePlanoPlataforma(response, data);
}

export async function updateAdminPlano(id: string, data: PlanoPlataformaPayload): Promise<PlanoPlataforma> {
  const response = await apiRequest<PlanoPlataformaApiResponse>({
    path: `/api/v1/admin/financeiro/planos/${id}`,
    method: "PUT",
    body: buildPlanoPayload(data),
  });
  return normalizePlanoPlataforma(response, { ...data, id });
}

export async function toggleAdminPlano(id: string): Promise<PlanoPlataforma> {
  const response = await apiRequest<PlanoPlataformaApiResponse>({
    path: `/api/v1/admin/financeiro/planos/${id}/toggle`,
    method: "PATCH",
  });
  return normalizePlanoPlataforma(response, { id });
}

export async function listAdminContratos(): Promise<ContratoPlataforma[]> {
  const response = await apiRequest<AnyListResponse<ContratoPlataformaApiResponse>>({
    path: "/api/v1/admin/financeiro/contratos",
  });
  return extractItems(response).map((item) => normalizeContratoPlataforma(item));
}

export async function createAdminContrato(data: ContratoPlataformaPayload): Promise<ContratoPlataforma> {
  const response = await apiRequest<ContratoPlataformaApiResponse>({
    path: "/api/v1/admin/financeiro/contratos",
    method: "POST",
    body: buildContratoPayload(data),
  });
  return normalizeContratoPlataforma(response, data);
}

export async function updateAdminContrato(id: string, data: ContratoPlataformaPayload): Promise<ContratoPlataforma> {
  const response = await apiRequest<ContratoPlataformaApiResponse>({
    path: `/api/v1/admin/financeiro/contratos/${id}`,
    method: "PUT",
    body: buildContratoPayload(data),
  });
  return normalizeContratoPlataforma(response, { ...data, id });
}

export async function suspenderAdminContrato(id: string, motivoSuspensao?: string): Promise<ContratoPlataforma> {
  const response = await apiRequest<ContratoPlataformaApiResponse>({
    path: `/api/v1/admin/financeiro/contratos/${id}/suspender`,
    method: "PATCH",
    body: {
      motivoSuspensao: cleanString(motivoSuspensao),
    },
  });
  return normalizeContratoPlataforma(response, { id, status: "SUSPENSO", motivoSuspensao });
}

export async function reativarAdminContrato(id: string): Promise<ContratoPlataforma> {
  const response = await apiRequest<ContratoPlataformaApiResponse>({
    path: `/api/v1/admin/financeiro/contratos/${id}/reativar`,
    method: "PATCH",
  });
  return normalizeContratoPlataforma(response, { id, status: "ATIVO" });
}
