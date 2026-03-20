import type { Academia, HorarioFuncionamento, Tenant } from "@/lib/types";
import { ApiRequestError, apiRequest } from "./http";
import type { AuthUser } from "./auth";
import { getActiveTenantIdFromSession, getAvailableTenantsFromSession, getPreferredTenantId } from "./session";

const BOOTSTRAP_ENDPOINT_ENABLED = new Set(["1", "true", "yes", "on"]).has(
  (process.env.NEXT_PUBLIC_APP_BOOTSTRAP_ENABLED ?? "").trim().toLowerCase(),
);
const BOOTSTRAP_STRICT_MODE = new Set(["1", "true", "yes", "on"]).has(
  (process.env.NEXT_PUBLIC_APP_BOOTSTRAP_STRICT ?? "").trim().toLowerCase(),
);

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

interface TenantAccessFromBootstrapApiResponse {
  tenantId?: string | null;
  defaultTenant?: boolean;
}

interface TenantBootstrapUserApiResponse {
  id?: string;
  userId?: string;
  nome?: string;
  displayName?: string;
  email?: string;
  roles?: string[];
  userKind?: string;
  redeId?: string;
  redeSlug?: string;
  redeNome?: string;
  activeTenantId?: string;
  tenantBaseId?: string;
  availableTenants?: TenantAccessFromBootstrapApiResponse[] | null;
  availableScopes?: string[] | null;
  broadAccess?: boolean;
}

interface TenantBootstrapCapabilitiesApiResponse {
  canAccessElevatedModules?: boolean;
  canDeleteClient?: boolean;
}

interface TenantBootstrapApiResponse {
  user?: TenantBootstrapUserApiResponse;
  tenantContext?: TenantContextApiResponse;
  academia?: AcademiaApiResponse;
  branding?: TenantBrandingApi | null;
  capabilities?: TenantBootstrapCapabilitiesApiResponse;
}

export const isSessionBootstrapEndpointEnabled = (): boolean =>
  BOOTSTRAP_ENDPOINT_ENABLED || BOOTSTRAP_STRICT_MODE;

export const isSessionBootstrapFallbackEnabled = (): boolean => !BOOTSTRAP_STRICT_MODE;

function isMissingAppBootstrapEndpointError(error: unknown): boolean {
  return (
    isSessionBootstrapFallbackEnabled()
    && error instanceof ApiRequestError
    && [404, 405, 501].includes(error.status)
  );
}

function parseAvailableTenantsFromBootstrap(
  raw?: TenantAccessFromBootstrapApiResponse[] | null,
): AuthUser["availableTenants"] {
  if (!raw?.length) return [];
  return raw
    .map((item) => {
      const tenantId = typeof item.tenantId === "string" ? item.tenantId.trim() : "";
      if (!tenantId) return null;
      return {
        tenantId,
        defaultTenant: Boolean(item.defaultTenant),
      };
    })
    .filter((item): item is AuthUser["availableTenants"][number] => item !== null);
}

interface TenantContextApiResponse {
  currentTenantId: string;
  tenantAtual: TenantApiResponse;
  unidadesDisponiveis: TenantApiResponse[];
}

function normalizeTenantBranding(input?: TenantBrandingApi | null) {
  if (!input) return undefined;
  return {
    appName: input.appName ?? undefined,
    logoUrl: input.logoUrl ?? undefined,
    themePreset: input.themePreset ?? undefined,
    useCustomColors: input.useCustomColors ?? false,
    colors: input.colors ?? undefined,
  };
}

export function isSessionBootstrapMissingRouteError(error: unknown): boolean {
  return isMissingAppBootstrapEndpointError(error);
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
      ? normalizeTenantBranding(input.branding)
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
      ? normalizeTenantBranding(input.branding)
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

export async function getSessionBootstrapApi(): Promise<{
  tenantContext: {
    currentTenantId: string;
    tenantAtual: Tenant;
    unidadesDisponiveis: Tenant[];
  };
  user: AuthUser;
  academia?: Academia;
  branding?: Tenant["branding"];
  capabilities?: TenantBootstrapCapabilitiesApiResponse;
}> {
  const response = await apiRequest<TenantBootstrapApiResponse>({
    path: "/api/v1/app/bootstrap",
  });

  if (!response.tenantContext || !response.user) {
    throw new Error("Resposta de bootstrap incompleta: tenantContext ou user ausente.");
  }

  return {
    tenantContext: {
      currentTenantId: response.tenantContext.currentTenantId,
      tenantAtual: normalizeTenant(response.tenantContext.tenantAtual),
      unidadesDisponiveis: response.tenantContext.unidadesDisponiveis.map(normalizeTenant),
    },
    user: {
      id: response.user.id ?? response.user.userId,
      userId: response.user.userId ?? response.user.id,
      nome: response.user.nome,
      displayName: response.user.displayName ?? response.user.nome,
      email: response.user.email,
      roles: response.user.roles ?? [],
      userKind: response.user.userKind,
      networkId: response.user.redeId,
      networkSlug: response.user.redeSlug,
      networkName: response.user.redeNome,
      activeTenantId: response.user.activeTenantId,
      baseTenantId: response.user.tenantBaseId,
      availableTenants: parseAvailableTenantsFromBootstrap(response.user.availableTenants),
      availableScopes: (response.user.availableScopes ?? [])
        .map((item) => item.trim().toUpperCase())
        .filter((item): item is NonNullable<AuthUser["availableScopes"]>[number] => item === "UNIDADE" || item === "REDE" || item === "GLOBAL"),
      broadAccess: response.user.broadAccess,
    },
    academia: response.academia ? normalizeAcademia(response.academia) : undefined,
    branding: response.branding
      ? normalizeTenantBranding(response.branding)
      : undefined,
    capabilities: response.capabilities,
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
