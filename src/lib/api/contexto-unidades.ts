import type { Academia, HorarioFuncionamento, Tenant } from "@/lib/types";
import { ApiRequestError, apiRequest } from "./http";
import { getActiveTenantIdFromSession, getAvailableTenantsFromSession, getPreferredTenantId } from "./session";

interface EnderecoApi {
  cep?: string | null;
  logradouro?: string | null;
  numero?: string | null;
  complemento?: string | null;
  bairro?: string | null;
  cidade?: string | null;
  estado?: string | null;
}

interface TenantBrandingApi {
  appName?: string | null;
  logoUrl?: string | null;
  themePreset?: Tenant["branding"] extends infer B
    ? B extends { themePreset?: infer P }
      ? P
      : never
    : never;
  useCustomColors?: boolean;
  colors?: Record<string, string> | null;
}

interface TenantConfiguracoesApi {
  impressaoCupom?: {
    modo: "58MM" | "80MM" | "CUSTOM";
    larguraCustomMm?: number | null;
  } | null;
}

interface TenantApiResponse {
  id: string;
  academiaId?: string | null;
  nome: string;
  razaoSocial?: string | null;
  documento?: string | null;
  groupId?: string | null;
  subdomain?: string | null;
  email?: string | null;
  telefone?: string | null;
  ativo?: boolean;
  endereco?: EnderecoApi | null;
  branding?: TenantBrandingApi | null;
  configuracoes?: TenantConfiguracoesApi | null;
}

interface AcademiaApiResponse {
  id: string;
  nome: string;
  razaoSocial?: string | null;
  documento?: string | null;
  email?: string | null;
  telefone?: string | null;
  endereco?: EnderecoApi | null;
  branding?: TenantBrandingApi | null;
  ativo?: boolean | null;
}

interface TenantContextApiResponse {
  currentTenantId: string;
  tenantAtual: TenantApiResponse;
  unidadesDisponiveis: TenantApiResponse[];
}

function normalizeTenant(input: TenantApiResponse): Tenant {
  return {
    id: input.id,
    academiaId: input.academiaId ?? undefined,
    nome: input.nome,
    razaoSocial: input.razaoSocial ?? undefined,
    documento: input.documento ?? undefined,
    groupId: input.groupId ?? undefined,
    subdomain: input.subdomain ?? undefined,
    email: input.email ?? undefined,
    telefone: input.telefone ?? undefined,
    ativo: input.ativo ?? true,
    endereco: input.endereco
      ? {
          cep: input.endereco.cep ?? undefined,
          logradouro: input.endereco.logradouro ?? undefined,
          numero: input.endereco.numero ?? undefined,
          complemento: input.endereco.complemento ?? undefined,
          bairro: input.endereco.bairro ?? undefined,
          cidade: input.endereco.cidade ?? undefined,
          estado: input.endereco.estado ?? undefined,
        }
      : undefined,
    branding: input.branding
      ? {
          appName: input.branding.appName ?? undefined,
          logoUrl: input.branding.logoUrl ?? undefined,
          themePreset: input.branding.themePreset ?? undefined,
          useCustomColors: input.branding.useCustomColors ?? false,
          colors: input.branding.colors ?? undefined,
        }
      : undefined,
    configuracoes: input.configuracoes
      ? {
          impressaoCupom: input.configuracoes.impressaoCupom
            ? {
                modo: input.configuracoes.impressaoCupom.modo,
                larguraCustomMm: input.configuracoes.impressaoCupom.larguraCustomMm ?? undefined,
              }
            : undefined,
        }
      : undefined,
  };
}

function normalizeAcademia(input: AcademiaApiResponse): Academia {
  return {
    id: input.id,
    nome: input.nome,
    razaoSocial: input.razaoSocial ?? undefined,
    documento: input.documento ?? undefined,
    email: input.email ?? undefined,
    telefone: input.telefone ?? undefined,
    endereco: input.endereco
      ? {
          cep: input.endereco.cep ?? undefined,
          logradouro: input.endereco.logradouro ?? undefined,
          numero: input.endereco.numero ?? undefined,
          complemento: input.endereco.complemento ?? undefined,
          bairro: input.endereco.bairro ?? undefined,
          cidade: input.endereco.cidade ?? undefined,
          estado: input.endereco.estado ?? undefined,
        }
      : undefined,
    branding: input.branding
      ? {
          appName: input.branding.appName ?? undefined,
          logoUrl: input.branding.logoUrl ?? undefined,
          themePreset: input.branding.themePreset ?? undefined,
          useCustomColors: input.branding.useCustomColors ?? false,
          colors: input.branding.colors ?? undefined,
        }
      : undefined,
    ativo: input.ativo ?? undefined,
  };
}

function resolveTenantContextFallbackId(): string | undefined {
  const activeTenantId = getActiveTenantIdFromSession()?.trim();
  if (activeTenantId) return activeTenantId;

  const preferredTenantId = getPreferredTenantId()?.trim();
  if (preferredTenantId) return preferredTenantId;

  return getAvailableTenantsFromSession()
    .map((item) => item.tenantId.trim())
    .find(Boolean);
}

function isMissingTenantContextError(error: unknown): boolean {
  if (!(error instanceof ApiRequestError) || error.status !== 400) {
    return false;
  }

  const message = [
    error.message,
    error.error,
    error.responseBody,
  ]
    .filter((value): value is string => typeof value === "string" && value.trim().length > 0)
    .join(" ")
    .toLowerCase();

  return message.includes("x-context-id sem unidade ativa");
}

async function withTenantContextRetry<T>(loader: () => Promise<T>): Promise<T> {
  try {
    return await loader();
  } catch (error) {
    if (!isMissingTenantContextError(error)) {
      throw error;
    }

    const tenantId = resolveTenantContextFallbackId();
    if (!tenantId) {
      throw error;
    }

    await setTenantContextApi(tenantId);
    return loader();
  }
}

export async function getTenantContextApi(): Promise<{
  currentTenantId: string;
  tenantAtual: Tenant;
  unidadesDisponiveis: Tenant[];
}> {
  const response = await apiRequest<TenantContextApiResponse>({
    path: "/api/v1/context/unidade-ativa",
  });
  return {
    currentTenantId: response.currentTenantId,
    tenantAtual: normalizeTenant(response.tenantAtual),
    unidadesDisponiveis: response.unidadesDisponiveis.map(normalizeTenant),
  };
}

export async function setTenantContextApi(tenantId: string): Promise<{
  currentTenantId: string;
  tenantAtual: Tenant;
  unidadesDisponiveis: Tenant[];
}> {
  const response = await apiRequest<TenantContextApiResponse>({
    path: `/api/v1/context/unidade-ativa/${tenantId}`,
    method: "PUT",
  });
  return {
    currentTenantId: response.currentTenantId,
    tenantAtual: normalizeTenant(response.tenantAtual),
    unidadesDisponiveis: response.unidadesDisponiveis.map(normalizeTenant),
  };
}

export async function getTenantAtualApi(): Promise<Tenant> {
  const response = await apiRequest<TenantApiResponse>({
    path: "/api/v1/context/tenant-atual",
  });
  return normalizeTenant(response);
}

export async function updateTenantAtualApi(data: Partial<Tenant>): Promise<Tenant> {
  const response = await apiRequest<TenantApiResponse>({
    path: "/api/v1/context/tenant-atual",
    method: "PUT",
    body: {
      nome: data.nome,
      razaoSocial: data.razaoSocial,
      email: data.email,
      telefone: data.telefone,
      ativo: data.ativo,
    },
  });
  return normalizeTenant(response);
}

export async function listUnidadesApi(): Promise<Tenant[]> {
  const response = await apiRequest<TenantApiResponse[]>({
    path: "/api/v1/unidades",
  });
  return response.map(normalizeTenant);
}

export async function createUnidadeApi(data: Omit<Tenant, "id">): Promise<Tenant> {
  const response = await apiRequest<TenantApiResponse>({
    path: "/api/v1/unidades",
    method: "POST",
    body: {
      nome: data.nome,
      razaoSocial: data.razaoSocial,
      documento: data.documento,
      groupId: data.groupId,
      email: data.email,
      telefone: data.telefone,
      subdomain: data.subdomain,
      ativo: data.ativo,
      configuracoes: data.configuracoes,
    },
  });
  return normalizeTenant(response);
}

export async function updateUnidadeApi(id: string, data: Partial<Tenant>): Promise<Tenant> {
  const response = await apiRequest<TenantApiResponse>({
    path: `/api/v1/unidades/${id}`,
    method: "PUT",
    body: {
      nome: data.nome,
      razaoSocial: data.razaoSocial,
      documento: data.documento,
      groupId: data.groupId,
      email: data.email,
      telefone: data.telefone,
      subdomain: data.subdomain,
      ativo: data.ativo,
      configuracoes: data.configuracoes,
    },
  });
  return normalizeTenant(response);
}

export async function toggleUnidadeApi(id: string): Promise<Tenant> {
  const response = await apiRequest<TenantApiResponse>({
    path: `/api/v1/unidades/${id}/toggle`,
    method: "PATCH",
  });
  return normalizeTenant(response);
}

export async function deleteUnidadeApi(id: string): Promise<void> {
  await apiRequest<void>({
    path: `/api/v1/unidades/${id}`,
    method: "DELETE",
  });
}

export async function listAcademiasApi(_tenantId?: string): Promise<Academia[]> {
  void _tenantId;
  const response = await withTenantContextRetry(() => apiRequest<AcademiaApiResponse>({
    path: "/api/v1/academia",
  }));
  return [normalizeAcademia(response)];
}

export async function getAcademiaAtualApi(_tenantId?: string): Promise<Academia> {
  void _tenantId;
  const response = await withTenantContextRetry(() => apiRequest<AcademiaApiResponse>({
    path: "/api/v1/academia",
  }));
  return normalizeAcademia(response);
}

export async function updateAcademiaAtualApi(input: {
  tenantId?: string;
  data: Partial<Academia>;
}): Promise<Academia> {
  const response = await withTenantContextRetry(() => apiRequest<AcademiaApiResponse>({
    path: "/api/v1/academia",
    method: "PUT",
    body: {
      nome: input.data.nome,
      razaoSocial: input.data.razaoSocial,
      documento: input.data.documento,
      email: input.data.email,
      telefone: input.data.telefone,
      endereco: input.data.endereco,
      ativo: input.data.ativo,
      branding: input.data.branding,
    },
  }));
  return normalizeAcademia(response);
}

export async function listHorariosApi(tenantId?: string): Promise<HorarioFuncionamento[]> {
  return apiRequest<HorarioFuncionamento[]>({
    path: "/api/v1/context/horarios-funcionamento",
    query: { tenantId },
  });
}

export async function updateHorariosApi(input: {
  tenantId?: string;
  data: HorarioFuncionamento[];
}): Promise<HorarioFuncionamento[]> {
  return apiRequest<HorarioFuncionamento[]>({
    path: "/api/v1/context/horarios-funcionamento",
    method: "PUT",
    query: { tenantId: input.tenantId },
    body: input.data,
  });
}
