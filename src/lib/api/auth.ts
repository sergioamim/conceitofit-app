import type { AuthSessionScope, TenantAccess } from "./session";
import { apiRequest } from "./http";
import {
  buildTenantAccessFromEligibility,
  normalizeOperationalAccess,
  type OperationalAccessState,
} from "@/lib/tenant/tenant-operational-access";
import {
  getAvailableScopesFromSession,
  getAccessTokenType,
  getActiveTenantIdFromSession,
  getAvailableTenantsFromSession,
  getBaseTenantIdFromSession,
  getBroadAccessFromSession,
  getDisplayNameFromSession,
  getNetworkIdFromSession,
  getNetworkNameFromSession,
  getNetworkSubdomainFromSession,
  getNetworkSlugFromSession,
  getUserIdFromSession,
  getUserKindFromSession,
  saveAuthSession,
  type AuthSession,
} from "./session";

interface TenantAccessApiResponse {
  tenantId: string;
  defaultTenant: boolean;
}

interface OperationalAccessApiResponse {
  blocked?: boolean;
  message?: string;
  eligibleTenants?: Array<{
    tenantId?: string;
    tenantNome?: string;
    defaultTenant?: boolean;
    blockedReasons?: Array<{ code?: string; message?: string }>;
  }>;
  blockedTenants?: Array<{
    tenantId?: string;
    tenantNome?: string;
    defaultTenant?: boolean;
    blockedReasons?: Array<{ code?: string; message?: string }>;
  }>;
}

interface LoginApiResponse {
  token: string;
  refreshToken: string;
  type?: string;
  expiresIn?: number;
  userId?: string;
  userKind?: string;
  displayName?: string;
  redeId?: string;
  redeSubdominio?: string;
  redeSlug?: string;
  redeNome?: string;
  activeTenantId?: string;
  tenantBaseId?: string;
  availableTenants?: TenantAccessApiResponse[];
  availableScopes?: string[];
  broadAccess?: boolean;
  operationalAccess?: OperationalAccessApiResponse;
}

interface MeApiResponse {
  id?: string;
  userId?: string;
  nome?: string;
  displayName?: string;
  email?: string;
  roles?: string[];
  userKind?: string;
  redeId?: string;
  redeSubdominio?: string;
  redeSlug?: string;
  redeNome?: string;
  activeTenantId?: string;
  tenantBaseId?: string;
  availableTenants?: TenantAccessApiResponse[];
  availableScopes?: string[];
  broadAccess?: boolean;
  operationalAccess?: OperationalAccessApiResponse;
}

interface AccessNetworkContextApiResponse {
  id?: string;
  subdomain?: string;
  slug?: string;
  nome?: string;
  appName?: string;
  logoUrl?: string;
  supportText?: string;
  accentLabel?: string;
  helpEmail?: string;
}

interface SwitchTenantApiRequest {
  tenantId: string;
}

function normalizeSession(
  response: LoginApiResponse,
  options?: {
    preserveTenantContext?: boolean;
    fallbackActiveTenantId?: string;
    fallbackNetworkSubdomain?: string;
    fallbackNetworkSlug?: string;
  }
): AuthSession {
  const operationalAccess = normalizeOperationalAccess(response.operationalAccess);
  const availableTenants = response.availableTenants?.map((item) => ({
    tenantId: item.tenantId,
    defaultTenant: item.defaultTenant,
  })) ?? buildTenantAccessFromEligibility(operationalAccess?.eligibleTenants ?? []);
  const availableScopes = normalizeAvailableScopes(response.availableScopes);

  return {
    token: response.token,
    refreshToken: response.refreshToken,
    type:
      response.type ??
      (options?.preserveTenantContext ? getAccessTokenType() : undefined) ??
      "Bearer",
    expiresIn: response.expiresIn,
    userId:
      response.userId ??
      (options?.preserveTenantContext ? getUserIdFromSession() : undefined),
    userKind:
      response.userKind ??
      (options?.preserveTenantContext ? getUserKindFromSession() : undefined),
    displayName:
      response.displayName ??
      (options?.preserveTenantContext ? getDisplayNameFromSession() : undefined),
    networkId:
      response.redeId ??
      (options?.preserveTenantContext ? getNetworkIdFromSession() : undefined),
    networkSubdomain:
      response.redeSubdominio ??
      response.redeSlug ??
      options?.fallbackNetworkSubdomain ??
      options?.fallbackNetworkSlug ??
      (options?.preserveTenantContext ? getNetworkSubdomainFromSession() : undefined),
    networkSlug:
      response.redeSubdominio ??
      response.redeSlug ??
      options?.fallbackNetworkSubdomain ??
      options?.fallbackNetworkSlug ??
      (options?.preserveTenantContext ? getNetworkSlugFromSession() : undefined),
    networkName:
      response.redeNome ??
      (options?.preserveTenantContext ? getNetworkNameFromSession() : undefined),
    activeTenantId:
      response.activeTenantId ??
      options?.fallbackActiveTenantId ??
      (options?.preserveTenantContext ? getActiveTenantIdFromSession() : undefined),
    baseTenantId:
      response.tenantBaseId ??
      (options?.preserveTenantContext ? getBaseTenantIdFromSession() : undefined),
    availableTenants:
      availableTenants ??
      (options?.preserveTenantContext ? getAvailableTenantsFromSession() : undefined),
    availableScopes:
      availableScopes.length > 0
        ? availableScopes
        : options?.preserveTenantContext
          ? getAvailableScopesFromSession()
          : undefined,
    broadAccess:
      typeof response.broadAccess === "boolean"
        ? response.broadAccess
        : options?.preserveTenantContext
          ? getBroadAccessFromSession()
          : undefined,
  };
}

export interface AuthUser {
  id?: string;
  userId?: string;
  nome?: string;
  displayName?: string;
  email?: string;
  roles?: string[];
  userKind?: string;
  networkId?: string;
  networkSubdomain?: string;
  networkSlug?: string;
  networkName?: string;
  activeTenantId?: string;
  baseTenantId?: string;
  availableTenants: TenantAccess[];
  availableScopes?: AuthSessionScope[];
  broadAccess?: boolean;
  operationalAccess?: OperationalAccessState;
}

export interface AccessNetworkContext {
  id?: string;
  subdomain: string;
  slug: string;
  name: string;
  appName: string;
  logoUrl?: string;
  supportText: string;
  accentLabel?: string;
  helpEmail?: string;
}

function normalizeAvailableScopes(raw?: string[]): AuthSessionScope[] {
  if (!raw?.length) return [];
  return raw
    .map((item) => item.trim().toUpperCase())
    .filter((item): item is AuthSessionScope => item === "UNIDADE" || item === "REDE" || item === "GLOBAL");
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

function buildNetworkHeader(redeIdentifier?: string): Record<string, string> | undefined {
  const normalizedIdentifier = redeIdentifier?.trim();
  if (!normalizedIdentifier) return undefined;
  return {
    "X-Rede-Identifier": normalizedIdentifier,
  };
}

export async function loginApi(input: {
  email?: string;
  identifier?: string;
  password: string;
  redeIdentifier?: string;
  channel?: "APP" | "BACKOFFICE";
}): Promise<AuthSession> {
  const identifier = input.identifier?.trim();
  const email = input.email?.trim();
  const response = await apiRequest<LoginApiResponse>({
    path: "/api/v1/auth/login",
    method: "POST",
    includeContextHeader: false,
    headers: buildNetworkHeader(input.redeIdentifier),
    body: identifier
      ? {
          identifier,
          password: input.password,
          channel: input.channel ?? "APP",
        }
      : {
          email: email ?? "",
          password: input.password,
        },
  });
  const session = normalizeSession(response, {
    fallbackNetworkSubdomain: input.redeIdentifier?.trim() || undefined,
    fallbackNetworkSlug: input.redeIdentifier?.trim() || undefined,
  });
  saveAuthSession(session);
  import("@/lib/shared/analytics").then(({ trackLogin }) => {
    trackLogin(session.activeTenantId, session.userId);
  });
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
  const operationalAccess = normalizeOperationalAccess(response.operationalAccess);
  return {
    id: response.id ?? response.userId,
    userId: response.userId ?? response.id,
    nome: response.nome,
    displayName: response.displayName ?? response.nome,
    email: response.email,
    roles: response.roles ?? [],
    userKind: response.userKind,
    networkId: response.redeId,
    networkSubdomain: response.redeSubdominio ?? response.redeSlug,
    networkSlug: response.redeSlug,
    networkName: response.redeNome,
    activeTenantId: response.activeTenantId,
    baseTenantId: response.tenantBaseId,
    availableTenants:
      parseAvailableTenants(response.availableTenants).length > 0
        ? parseAvailableTenants(response.availableTenants)
        : buildTenantAccessFromEligibility(operationalAccess?.eligibleTenants ?? []),
    availableScopes: normalizeAvailableScopes(response.availableScopes),
    broadAccess: response.broadAccess,
    operationalAccess,
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

function buildDefaultAccessNetworkContext(networkSubdomain: string): AccessNetworkContext {
  const normalizedSubdomain = networkSubdomain.trim().toLowerCase();
  const name = normalizedSubdomain
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

  return {
    subdomain: normalizedSubdomain || "rede",
    slug: normalizedSubdomain || "rede",
    name: name || "Rede",
    appName: name ? `${name} Acesso` : "Acesso da rede",
    supportText: "Autentique-se no contexto correto da rede para evitar conflito com identificadores iguais em redes diferentes.",
    accentLabel: "Acesso por rede",
  };
}

export async function getAccessNetworkContextApi(
  redeIdentifier: string,
  options?: {
    allowDefaultFallback?: boolean;
  }
): Promise<AccessNetworkContext> {
  const normalizedIdentifier = redeIdentifier.trim();
  try {
    const response = await apiRequest<AccessNetworkContextApiResponse>({
      path: "/api/v1/auth/rede-contexto",
      includeContextHeader: false,
      headers: buildNetworkHeader(normalizedIdentifier),
    });

    const fallbackContext = buildDefaultAccessNetworkContext(normalizedIdentifier);
    return {
      id: response.id,
      subdomain: response.subdomain?.trim() || response.slug?.trim() || fallbackContext.subdomain,
      slug: response.slug?.trim() || response.subdomain?.trim() || fallbackContext.slug,
      name: response.nome?.trim() || fallbackContext.name,
      appName: response.appName?.trim() || fallbackContext.appName,
      logoUrl: response.logoUrl?.trim() || undefined,
      supportText: response.supportText?.trim() || fallbackContext.supportText,
      accentLabel: response.accentLabel?.trim() || fallbackContext.accentLabel,
      helpEmail: response.helpEmail?.trim() || undefined,
    };
  } catch (error) {
    if (options?.allowDefaultFallback === false) {
      throw error;
    }
    return buildDefaultAccessNetworkContext(normalizedIdentifier);
  }
}

export async function requestPasswordRecoveryApi(input: {
  redeIdentifier: string;
  identifier: string;
  channel?: "APP" | "BACKOFFICE";
}): Promise<{ message: string }> {
  const response = await apiRequest<{ message?: string }>({
    path: "/api/v1/auth/forgot-password",
    method: "POST",
    includeContextHeader: false,
    headers: buildNetworkHeader(input.redeIdentifier),
    body: {
      identifier: input.identifier.trim(),
      channel: input.channel ?? "APP",
    },
  });

  return {
    message: response.message?.trim() || "Se o identificador existir nesta rede, enviaremos as instruções de recuperação.",
  };
}

export async function requestFirstAccessApi(input: {
  redeIdentifier: string;
  identifier: string;
  channel?: "APP" | "BACKOFFICE";
}): Promise<{ message: string }> {
  const response = await apiRequest<{ message?: string }>({
    path: "/api/v1/auth/first-access",
    method: "POST",
    includeContextHeader: false,
    headers: buildNetworkHeader(input.redeIdentifier),
    body: {
      identifier: input.identifier.trim(),
      channel: input.channel ?? "APP",
    },
  });

  return {
    message: response.message?.trim() || "Se o identificador estiver apto para primeiro acesso nesta rede, enviaremos as próximas instruções.",
  };
}
