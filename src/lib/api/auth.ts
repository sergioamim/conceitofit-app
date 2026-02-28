import type { Tenant } from "@/lib/types";
import type { TenantAccess } from "./session";
import { apiRequest } from "./http";
import { saveAuthSession, type AuthSession } from "./session";

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
}

interface TenantAccessApiResponse {
  tenantId: string;
  defaultTenant: boolean;
}

interface LoginApiResponse {
  token: string;
  refreshToken: string;
  type?: string;
  expiresIn?: number;
  activeTenantId?: string;
  availableTenants?: TenantAccessApiResponse[];
}

interface MeApiResponse {
  id?: string;
  nome?: string;
  email?: string;
  roles?: string[];
  activeTenantId?: string;
  availableTenants?: TenantAccessApiResponse[];
}

interface SwitchTenantApiRequest {
  tenantId: string;
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
  };
}

function normalizeSession(response: LoginApiResponse): AuthSession {
  return {
    token: response.token,
    refreshToken: response.refreshToken,
    type: response.type ?? "Bearer",
    expiresIn: response.expiresIn,
    activeTenantId: response.activeTenantId,
    availableTenants: response.availableTenants?.map((item) => ({
      tenantId: item.tenantId,
      defaultTenant: item.defaultTenant,
    })),
  };
}

export interface AuthUser {
  id?: string;
  nome?: string;
  email?: string;
  roles?: string[];
  activeTenantId?: string;
  availableTenants: TenantAccess[];
}

function parseAvailableTenants(raw?: TenantAccessApiResponse[]): TenantAccess[] {
  if (!raw?.length) return [];
  return raw
    .map((item) => {
      const tenantId = typeof item.tenantId === "string" ? item.tenantId.trim() : "";
      return tenantId
        ? {
            tenantId,
            defaultTenant: Boolean(item.defaultTenant),
          }
        : null;
    })
    .filter((item): item is TenantAccess => item !== null);
}

export async function loginApi(input: {
  email: string;
  password: string;
}): Promise<AuthSession> {
  const response = await apiRequest<LoginApiResponse>({
    path: "/api/v1/auth/login",
    method: "POST",
    includeContextHeader: false,
    body: {
      email: input.email,
      password: input.password,
    },
  });
  const session = normalizeSession(response);
  saveAuthSession(session);
  return session;
}

export async function refreshTokenApi(refreshToken: string): Promise<AuthSession> {
  const response = await apiRequest<LoginApiResponse>({
    path: "/api/v1/auth/refresh",
    method: "POST",
    includeContextHeader: false,
    body: { refreshToken },
  });
  const session = normalizeSession(response);
  saveAuthSession(session);
  return session;
}

export async function meApi(): Promise<AuthUser> {
  const response = await apiRequest<MeApiResponse>({
    path: "/api/v1/auth/me",
  });
  return {
    id: response.id,
    nome: response.nome,
    email: response.email,
    roles: response.roles ?? [],
    activeTenantId: response.activeTenantId,
    availableTenants: parseAvailableTenants(response.availableTenants),
  };
}

export async function switchTenantApi(tenantId: string): Promise<AuthSession> {
  const response = await apiRequest<LoginApiResponse>({
    path: "/api/v1/auth/context/tenant",
    method: "POST",
    body: { tenantId } satisfies SwitchTenantApiRequest,
  });
  const session = normalizeSession(response);
  saveAuthSession(session);
  return session;
}
