import type { AuthSessionScope, TenantAccess } from "./session";
import { apiRequest } from "./http";
import {
  buildTenantAccessFromEligibility,
  normalizeOperationalAccess,
  type OperationalAccessState,
} from "@/lib/tenant/tenant-operational-access";
import {
  clearOperationalTenantScope,
  filterTenantAccessByOperationalScope,
  getAvailableScopesFromSession,
  getAccessTokenType,
  getActiveTenantIdFromSession,
  getAvailableTenantsFromSession,
  getAuthSessionSnapshot,
  getBaseTenantIdFromSession,
  getBroadAccessFromSession,
  getDisplayNameFromSession,
  getForcePasswordChangeRequiredFromSession,
  getNetworkIdFromSession,
  getNetworkSubdomainFromSession,
  getNetworkNameFromSession,
  getNetworkSlugFromSession,
  getOperationalScopeDefaultTenantId,
  getSessionClaimsFromToken,
  getSessionModeFromSession,
  getUserIdFromSession,
  getUserKindFromSession,
  rememberBackofficeReturnSession,
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
  token?: string;
  refreshToken?: string;
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
  baseTenantId?: string;
  availableTenants?: TenantAccessApiResponse[];
  availableScopes?: string[];
  broadAccess?: boolean;
  operationalAccess?: OperationalAccessApiResponse;
  forcePasswordChange?: boolean;
  sessionMode?: string;
  sandboxMode?: boolean;
  sandboxRedeId?: string;
  sandboxUnidadeId?: string;
  sandboxExpiresAt?: string;
}

export interface AdminEntrarComoUnidadeRequest {
  academiaId: string;
  tenantId: string;
  justificativa?: string;
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

function normalizeSession(
  response: LoginApiResponse,
  options?: {
    preserveTenantContext?: boolean;
    fallbackActiveTenantId?: string;
    fallbackNetworkSubdomain?: string;
    fallbackNetworkSlug?: string;
  }
): AuthSession {
  const tokenClaims = getSessionClaimsFromToken(response.token);
  const operationalAccess = normalizeOperationalAccess(response.operationalAccess);
  const availableTenants = filterTenantAccessByOperationalScope(
    response.availableTenants?.map((item) => ({
      tenantId: item.tenantId,
      defaultTenant: item.defaultTenant,
    })) ?? buildTenantAccessFromEligibility(operationalAccess?.eligibleTenants ?? [])
  );
  const availableScopes = normalizeAvailableScopes(response.availableScopes);
  const scopedBaseTenantId = getOperationalScopeDefaultTenantId();

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
      tokenClaims.userId ??
      (options?.preserveTenantContext ? getUserIdFromSession() : undefined),
    userKind:
      response.userKind ??
      tokenClaims.userKind ??
      (options?.preserveTenantContext ? getUserKindFromSession() : undefined),
    displayName:
      response.displayName ??
      tokenClaims.displayName ??
      (options?.preserveTenantContext ? getDisplayNameFromSession() : undefined),
    networkId:
      response.redeId ??
      tokenClaims.networkId ??
      (options?.preserveTenantContext ? getNetworkIdFromSession() : undefined),
    networkSubdomain:
      response.redeSubdominio ??
      response.redeSlug ??
      tokenClaims.networkSubdomain ??
      tokenClaims.networkSlug ??
      options?.fallbackNetworkSubdomain ??
      options?.fallbackNetworkSlug ??
      (options?.preserveTenantContext ? getNetworkSubdomainFromSession() : undefined),
    networkSlug:
      response.redeSubdominio ??
      response.redeSlug ??
      tokenClaims.networkSubdomain ??
      tokenClaims.networkSlug ??
      options?.fallbackNetworkSubdomain ??
      options?.fallbackNetworkSlug ??
      (options?.preserveTenantContext ? getNetworkSlugFromSession() : undefined),
    networkName:
      response.redeNome ??
      tokenClaims.networkName ??
      (options?.preserveTenantContext ? getNetworkNameFromSession() : undefined),
    activeTenantId:
      response.activeTenantId ??
      tokenClaims.activeTenantId ??
      options?.fallbackActiveTenantId ??
      (options?.preserveTenantContext ? getActiveTenantIdFromSession() : undefined),
    baseTenantId:
      scopedBaseTenantId ??
      response.baseTenantId ??
      response.tenantBaseId ??
      tokenClaims.baseTenantId ??
      (options?.preserveTenantContext ? getBaseTenantIdFromSession() : undefined),
    availableTenants:
      availableTenants ??
      (options?.preserveTenantContext ? getAvailableTenantsFromSession() : undefined),
    availableScopes:
      availableScopes.length > 0
        ? availableScopes
        : tokenClaims.availableScopes && tokenClaims.availableScopes.length > 0
          ? tokenClaims.availableScopes
        : options?.preserveTenantContext
          ? getAvailableScopesFromSession()
          : undefined,
    broadAccess:
      typeof response.broadAccess === "boolean"
        ? response.broadAccess
        : typeof tokenClaims.broadAccess === "boolean"
          ? tokenClaims.broadAccess
        : options?.preserveTenantContext
          ? getBroadAccessFromSession()
          : undefined,
    forcePasswordChangeRequired:
      typeof response.forcePasswordChange === "boolean"
        ? response.forcePasswordChange
        : options?.preserveTenantContext
          ? getForcePasswordChangeRequiredFromSession()
          : false,
    sessionMode:
      response.sessionMode ??
      tokenClaims.sessionMode ??
      (options?.preserveTenantContext ? getSessionModeFromSession() : undefined),
    sandboxMode:
      typeof response.sandboxMode === "boolean"
        ? response.sandboxMode
        : tokenClaims.sandboxMode ?? false,
    sandboxRedeId: response.sandboxRedeId ?? tokenClaims.sandboxRedeId,
    sandboxUnidadeId: response.sandboxUnidadeId ?? tokenClaims.sandboxUnidadeId,
    sandboxExpiresAt: response.sandboxExpiresAt ?? tokenClaims.sandboxExpiresAt,
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

export interface AccessibleNetworkUnit {
  id: string;
  nome: string;
  matriz: boolean;
}

export interface AccessibleNetworkContext {
  redeId: string;
  redeName: string;
  unidades: AccessibleNetworkUnit[];
}

export interface AccessibleContextsResponse {
  redes: AccessibleNetworkContext[];
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
  channel?: "APP" | "BACKOFFICE" | "WEB";
}): Promise<AuthSession> {
  clearOperationalTenantScope();
  const identifier = input.identifier?.trim();
  const email = input.email?.trim();
  const response = await apiRequest<LoginApiResponse>({
    path: input.redeIdentifier ? "/api/v1/auth/rede/login" : "/api/v1/auth/login",
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
  void import("@/lib/shared/analytics")
    .then(({ trackLogin }) => {
      trackLogin(session.activeTenantId, session.userId);
    })
    .catch(() => undefined);
  return session;
}

export async function getAccessibleContextsApi(): Promise<AccessibleContextsResponse> {
  const response = await apiRequest<{
    redes?: Array<{
      redeId?: string;
      redeName?: string;
      unidades?: Array<{
        id?: string;
        nome?: string;
        matriz?: boolean;
      }>;
    }>;
  }>({
    path: "/api/v1/auth/contexts",
    includeContextHeader: false,
  });

  return {
    redes: (response.redes ?? [])
      .map((rede) => {
        const redeId = typeof rede.redeId === "string" ? rede.redeId.trim() : "";
        if (!redeId) return null;
        return {
          redeId,
          redeName: typeof rede.redeName === "string" && rede.redeName.trim()
            ? rede.redeName.trim()
            : "Rede",
          unidades: (rede.unidades ?? [])
            .map((unidade) => {
              const unidadeId = typeof unidade.id === "string" ? unidade.id.trim() : "";
              const unidadeNome = typeof unidade.nome === "string" ? unidade.nome.trim() : "";
              if (!unidadeId || !unidadeNome) return null;
              return {
                id: unidadeId,
                nome: unidadeNome,
                matriz: Boolean(unidade.matriz),
              };
            })
            .filter((unidade): unidade is AccessibleNetworkUnit => unidade !== null),
        };
      })
      .filter((rede): rede is AccessibleNetworkContext => rede !== null),
  };
}

export async function adminLoginApi(input: {
  email: string;
  password: string;
}): Promise<AuthSession> {
  // Fluxo administrativo é global e não participa da resolução por rede.
  clearOperationalTenantScope();
  const response = await apiRequest<LoginApiResponse>({
    path: "/api/v1/admin/auth/login",
    method: "POST",
    includeContextHeader: false,
    body: {
      email: input.email.trim(),
      password: input.password,
    },
  });
  const session = normalizeSession(response);
  saveAuthSession(session);
  void import("@/lib/shared/analytics")
    .then(({ trackLogin }) => {
      trackLogin(session.activeTenantId, session.userId);
    })
    .catch(() => undefined);
  return session;
}

export async function adminEntrarComoUnidadeApi(input: AdminEntrarComoUnidadeRequest): Promise<AuthSession> {
  rememberBackofficeReturnSession(getAuthSessionSnapshot());
  const response = await apiRequest<LoginApiResponse>({
    path: "/api/v1/admin/auth/entrar-como-unidade",
    method: "POST",
    includeContextHeader: false,
    body: {
      academiaId: input.academiaId,
      tenantId: input.tenantId,
      justificativa: input.justificativa,
    },
  });
  const session = normalizeSession(response, {
    preserveTenantContext: true,
    fallbackActiveTenantId: input.tenantId,
  });
  // O handoff Admin -> Operacional precisa ficar consistente mesmo quando o backend
  // ainda não refletiu `session_mode`/claims novos no payload imediato do browser.
  // Se mantivermos o modo anterior (`BACKOFFICE_ADMIN`), o shell operacional se
  // protege redirecionando de volta para `/admin`.
  const operationalSession: AuthSession = {
    ...session,
    activeTenantId: session.activeTenantId ?? input.tenantId,
    sessionMode: "BACKOFFICE_TO_OPERATIONAL",
  };
  saveAuthSession(operationalSession);
  void import("@/lib/shared/analytics")
    .then(({ trackLogin }) => {
      trackLogin(operationalSession.activeTenantId, operationalSession.userId);
    })
    .catch(() => undefined);
  return operationalSession;
}

export async function refreshTokenApi(refreshToken?: string): Promise<AuthSession> {
  const normalizedRefreshToken = typeof refreshToken === "string" ? refreshToken.trim() : "";
  const response = await apiRequest<LoginApiResponse>({
    path: "/api/v1/auth/refresh",
    method: "POST",
    includeContextHeader: false,
    body: normalizedRefreshToken ? { refreshToken: normalizedRefreshToken } : undefined,
  });
  const session = normalizeSession(response, { preserveTenantContext: true });
  saveAuthSession(session);
  return session;
}

export async function logoutApi(): Promise<void> {
  await apiRequest<void>({
    path: "/api/v1/auth/logout",
    method: "POST",
    includeContextHeader: false,
    retryOnAuthFailure: false,
  });
}

export async function meApi(): Promise<AuthUser> {
  const response = await apiRequest<MeApiResponse>({
    path: "/api/v1/auth/me",
  });
  const operationalAccess = normalizeOperationalAccess(response.operationalAccess);
  const availableTenants = filterTenantAccessByOperationalScope(
    parseAvailableTenants(response.availableTenants).length > 0
      ? parseAvailableTenants(response.availableTenants)
      : buildTenantAccessFromEligibility(operationalAccess?.eligibleTenants ?? [])
  );
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
    baseTenantId: getOperationalScopeDefaultTenantId() ?? response.tenantBaseId,
    availableTenants,
    availableScopes: normalizeAvailableScopes(response.availableScopes),
    broadAccess: response.broadAccess,
    operationalAccess,
  };
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

/**
 * Consulta contexto visual de uma rede pelo identifier.
 *
 * ⚠️ ENDPOINT NÃO IMPLEMENTADO NO BACKEND (debito conhecido — smoke
 * test 2026-04-10). O `AuthController.java` não expõe `/auth/rede-contexto`.
 * Esta função tem **fallback completo via `buildDefaultAccessNetworkContext`**:
 * em caso de 404 (qualquer erro com `allowDefaultFallback != false`) retorna
 * um contexto padrão derivado do identifier. O fluxo de login funciona,
 * apenas perde branding customizado da rede (logo, supportText, etc).
 *
 * Quando o BE implementar, basta marcar o endpoint disponível — nenhuma
 * mudança no FE necessária.
 */
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

export async function changePasswordApi(input: {
  currentPassword: string;
  newPassword: string;
  confirmNewPassword: string;
}): Promise<{ message: string }> {
  const response = await apiRequest<Partial<LoginApiResponse> & { message?: string }>({
    path: "/api/v1/auth/change-password",
    method: "POST",
    body: {
      currentPassword: input.currentPassword,
      newPassword: input.newPassword,
      confirmNewPassword: input.confirmNewPassword,
    },
  });

  if (response.token && response.refreshToken) {
    const session = normalizeSession(response as LoginApiResponse, { preserveTenantContext: true });
    saveAuthSession(session);
  }

  return {
    message: response.message?.trim() || "Senha atualizada com sucesso.",
  };
}

export async function changeForcedPasswordApi(input: {
  newPassword: string;
  confirmNewPassword: string;
}): Promise<{ message: string }> {
  const response = await apiRequest<Partial<LoginApiResponse> & { message?: string }>({
    path: "/api/v1/auth/first-access/complete",
    method: "POST",
    includeContextHeader: false,
    headers: buildNetworkHeader(getNetworkSubdomainFromSession()),
    body: {
      newPassword: input.newPassword,
      confirmNewPassword: input.confirmNewPassword,
    },
  });

  if (response.token && response.refreshToken) {
    const session = normalizeSession(response as LoginApiResponse, { preserveTenantContext: true });
    saveAuthSession({
      ...session,
      forcePasswordChangeRequired: false,
    });
  } else {
    const snapshot = getAuthSessionSnapshot();
    if (snapshot) {
      saveAuthSession({
        ...snapshot,
        forcePasswordChangeRequired: false,
      });
    }
  }

  return {
    message: response.message?.trim() || "Senha atualizada com sucesso.",
  };
}
