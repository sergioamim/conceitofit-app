import type { TenantAccess } from "./session";
import { apiRequest } from "./http";
import {
  getAccessTokenType,
  getActiveTenantIdFromSession,
  getAvailableTenantsFromSession,
  saveAuthSession,
  type AuthSession,
} from "./session";

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

function normalizeSession(
  response: LoginApiResponse,
  options?: {
    preserveTenantContext?: boolean;
    fallbackActiveTenantId?: string;
  }
): AuthSession {
  const availableTenants = response.availableTenants?.map((item) => ({
    tenantId: item.tenantId,
    defaultTenant: item.defaultTenant,
  }));

  return {
    token: response.token,
    refreshToken: response.refreshToken,
    type:
      response.type ??
      (options?.preserveTenantContext ? getAccessTokenType() : undefined) ??
      "Bearer",
    expiresIn: response.expiresIn,
    activeTenantId:
      response.activeTenantId ??
      options?.fallbackActiveTenantId ??
      (options?.preserveTenantContext ? getActiveTenantIdFromSession() : undefined),
    availableTenants:
      availableTenants ??
      (options?.preserveTenantContext ? getAvailableTenantsFromSession() : undefined),
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
  const session = normalizeSession(response, { preserveTenantContext: true });
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
  const session = normalizeSession(response, {
    preserveTenantContext: true,
    fallbackActiveTenantId: tenantId,
  });
  saveAuthSession(session);
  return session;
}
