import type { Academia, Tenant } from "@/lib/types";
import { apiRequest } from "./http";

type EnderecoApi = {
  cep?: string | null;
  logradouro?: string | null;
  numero?: string | null;
  complemento?: string | null;
  bairro?: string | null;
  cidade?: string | null;
  estado?: string | null;
};

type TenantBrandingApi = {
  appName?: string | null;
  logoUrl?: string | null;
  themePreset?: Tenant["branding"] extends infer B
    ? B extends { themePreset?: infer P }
      ? P
      : never
    : never;
  useCustomColors?: boolean | null;
  colors?: Record<string, string> | null;
};

type TenantConfiguracoesApi = {
  impressaoCupom?: {
    modo?: "58MM" | "80MM" | "CUSTOM" | null;
    larguraCustomMm?: number | null;
  } | null;
};

type BackofficeAcademiaApiResponse = {
  id?: string | null;
  nome?: string | null;
  razaoSocial?: string | null;
  documento?: string | null;
  email?: string | null;
  telefone?: string | null;
  endereco?: EnderecoApi | null;
  branding?: TenantBrandingApi | null;
  ativo?: unknown;
};

type BackofficeUnidadeApiResponse = {
  id?: string | null;
  academiaId?: string | null;
  nome?: string | null;
  razaoSocial?: string | null;
  documento?: string | null;
  groupId?: string | null;
  subdomain?: string | null;
  email?: string | null;
  telefone?: string | null;
  ativo?: unknown;
  endereco?: EnderecoApi | null;
  branding?: TenantBrandingApi | null;
  configuracoes?: TenantConfiguracoesApi | null;
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

export function normalizeBackofficeAcademia(input: BackofficeAcademiaApiResponse, fallback?: Partial<Academia>): Academia {
  return {
    id: cleanString(input.id) ?? fallback?.id ?? "",
    nome: cleanString(input.nome) ?? fallback?.nome ?? "",
    razaoSocial: cleanString(input.razaoSocial) ?? fallback?.razaoSocial,
    documento: cleanString(input.documento) ?? fallback?.documento,
    email: cleanString(input.email) ?? fallback?.email,
    telefone: cleanString(input.telefone) ?? fallback?.telefone,
    endereco: input.endereco
      ? {
          cep: cleanString(input.endereco.cep) ?? fallback?.endereco?.cep,
          logradouro: cleanString(input.endereco.logradouro) ?? fallback?.endereco?.logradouro,
          numero: cleanString(input.endereco.numero) ?? fallback?.endereco?.numero,
          complemento: cleanString(input.endereco.complemento) ?? fallback?.endereco?.complemento,
          bairro: cleanString(input.endereco.bairro) ?? fallback?.endereco?.bairro,
          cidade: cleanString(input.endereco.cidade) ?? fallback?.endereco?.cidade,
          estado: cleanString(input.endereco.estado) ?? fallback?.endereco?.estado,
        }
      : fallback?.endereco,
    branding: input.branding
      ? {
          appName: cleanString(input.branding.appName) ?? fallback?.branding?.appName,
          logoUrl: cleanString(input.branding.logoUrl) ?? fallback?.branding?.logoUrl,
          themePreset: input.branding.themePreset ?? fallback?.branding?.themePreset,
          useCustomColors: input.branding.useCustomColors ?? fallback?.branding?.useCustomColors ?? false,
          colors: input.branding.colors ?? fallback?.branding?.colors,
        }
      : fallback?.branding,
    ativo: toBoolean(input.ativo, fallback?.ativo ?? true),
  };
}

export function normalizeBackofficeUnidade(input: BackofficeUnidadeApiResponse, fallback?: Partial<Tenant>): Tenant {
  const larguraRaw = Number(input.configuracoes?.impressaoCupom?.larguraCustomMm ?? fallback?.configuracoes?.impressaoCupom?.larguraCustomMm ?? 80);
  const larguraCustomMm = Number.isFinite(larguraRaw) ? Math.min(120, Math.max(40, larguraRaw)) : 80;

  return {
    id: cleanString(input.id) ?? fallback?.id ?? "",
    academiaId: cleanString(input.academiaId) ?? fallback?.academiaId ?? fallback?.groupId,
    nome: cleanString(input.nome) ?? fallback?.nome ?? "",
    razaoSocial: cleanString(input.razaoSocial) ?? fallback?.razaoSocial,
    documento: cleanString(input.documento) ?? fallback?.documento,
    groupId: cleanString(input.groupId) ?? fallback?.groupId ?? cleanString(input.academiaId) ?? fallback?.academiaId,
    subdomain: cleanString(input.subdomain) ?? fallback?.subdomain,
    email: cleanString(input.email) ?? fallback?.email,
    telefone: cleanString(input.telefone) ?? fallback?.telefone,
    ativo: toBoolean(input.ativo, fallback?.ativo ?? true),
    endereco: input.endereco
      ? {
          cep: cleanString(input.endereco.cep) ?? fallback?.endereco?.cep,
          logradouro: cleanString(input.endereco.logradouro) ?? fallback?.endereco?.logradouro,
          numero: cleanString(input.endereco.numero) ?? fallback?.endereco?.numero,
          complemento: cleanString(input.endereco.complemento) ?? fallback?.endereco?.complemento,
          bairro: cleanString(input.endereco.bairro) ?? fallback?.endereco?.bairro,
          cidade: cleanString(input.endereco.cidade) ?? fallback?.endereco?.cidade,
          estado: cleanString(input.endereco.estado) ?? fallback?.endereco?.estado,
        }
      : fallback?.endereco,
    branding: input.branding
      ? {
          appName: cleanString(input.branding.appName) ?? fallback?.branding?.appName,
          logoUrl: cleanString(input.branding.logoUrl) ?? fallback?.branding?.logoUrl,
          themePreset: input.branding.themePreset ?? fallback?.branding?.themePreset,
          useCustomColors: input.branding.useCustomColors ?? fallback?.branding?.useCustomColors ?? false,
          colors: input.branding.colors ?? fallback?.branding?.colors,
        }
      : fallback?.branding,
    configuracoes: {
      impressaoCupom: {
        modo: input.configuracoes?.impressaoCupom?.modo ?? fallback?.configuracoes?.impressaoCupom?.modo ?? "80MM",
        larguraCustomMm,
      },
    },
  };
}

export function buildBackofficeAcademiaPayload(data: Partial<Academia>) {
  return {
    nome: cleanString(data.nome) ?? "",
    razaoSocial: cleanString(data.razaoSocial),
    documento: cleanString(data.documento),
    email: cleanString(data.email),
    telefone: cleanString(data.telefone),
    endereco: data.endereco,
    branding: data.branding,
    ativo: data.ativo ?? true,
  };
}

export function buildBackofficeUnidadePayload(data: Partial<Tenant>) {
  const larguraRaw = Number(data.configuracoes?.impressaoCupom?.larguraCustomMm ?? 80);
  const larguraCustomMm = Number.isFinite(larguraRaw) ? Math.min(120, Math.max(40, larguraRaw)) : 80;

  return {
    academiaId: cleanString(data.academiaId) ?? cleanString(data.groupId),
    nome: cleanString(data.nome) ?? "",
    razaoSocial: cleanString(data.razaoSocial),
    documento: cleanString(data.documento),
    groupId: cleanString(data.groupId) ?? cleanString(data.academiaId),
    subdomain: cleanString(data.subdomain),
    email: cleanString(data.email),
    telefone: cleanString(data.telefone),
    endereco: data.endereco,
    branding: data.branding,
    configuracoes: {
      impressaoCupom: {
        modo: data.configuracoes?.impressaoCupom?.modo ?? "80MM",
        larguraCustomMm,
      },
    },
    ativo: data.ativo ?? true,
  };
}

export async function listBackofficeAcademiasApi(): Promise<Academia[]> {
  const response = await apiRequest<AnyListResponse<BackofficeAcademiaApiResponse>>({
    path: "/api/v1/admin/academias",
  });
  return extractItems(response).map((item) => normalizeBackofficeAcademia(item));
}

export async function getBackofficeAcademiaApi(id: string): Promise<Academia> {
  const response = await apiRequest<BackofficeAcademiaApiResponse>({
    path: `/api/v1/admin/academias/${id}`,
  });
  return normalizeBackofficeAcademia(response);
}

export async function createBackofficeAcademiaApi(data: Partial<Academia>): Promise<Academia> {
  const response = await apiRequest<BackofficeAcademiaApiResponse>({
    path: "/api/v1/admin/academias",
    method: "POST",
    body: buildBackofficeAcademiaPayload(data),
  });
  return normalizeBackofficeAcademia(response, data);
}

export async function updateBackofficeAcademiaApi(id: string, data: Partial<Academia>): Promise<Academia> {
  const response = await apiRequest<BackofficeAcademiaApiResponse>({
    path: `/api/v1/admin/academias/${id}`,
    method: "PUT",
    body: buildBackofficeAcademiaPayload(data),
  });
  return normalizeBackofficeAcademia(response, data);
}

export async function listBackofficeUnidadesApi(): Promise<Tenant[]> {
  const response = await apiRequest<AnyListResponse<BackofficeUnidadeApiResponse>>({
    path: "/api/v1/admin/unidades",
  });
  return extractItems(response).map((item) => normalizeBackofficeUnidade(item));
}

async function getBackofficeUnidadeApi(id: string): Promise<Tenant> {
  const response = await apiRequest<BackofficeUnidadeApiResponse>({
    path: `/api/v1/admin/unidades/${id}`,
  });
  return normalizeBackofficeUnidade(response);
}

export async function createBackofficeUnidadeApi(data: Partial<Tenant>): Promise<Tenant> {
  const response = await apiRequest<BackofficeUnidadeApiResponse>({
    path: "/api/v1/admin/unidades",
    method: "POST",
    body: buildBackofficeUnidadePayload(data),
  });
  return normalizeBackofficeUnidade(response, data);
}

export async function updateBackofficeUnidadeApi(id: string, data: Partial<Tenant>): Promise<Tenant> {
  const response = await apiRequest<BackofficeUnidadeApiResponse>({
    path: `/api/v1/admin/unidades/${id}`,
    method: "PUT",
    body: buildBackofficeUnidadePayload(data),
  });
  return normalizeBackofficeUnidade(response, data);
}

export async function toggleBackofficeUnidadeApi(id: string): Promise<Tenant> {
  const response = await apiRequest<BackofficeUnidadeApiResponse>({
    path: `/api/v1/admin/unidades/${id}/toggle`,
    method: "PATCH",
  });
  return normalizeBackofficeUnidade(response);
}

export async function deleteBackofficeUnidadeApi(id: string): Promise<void> {
  await apiRequest<void>({
    path: `/api/v1/admin/unidades/${id}`,
    method: "DELETE",
  });
}
