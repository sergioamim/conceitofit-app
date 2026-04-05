export interface TenantAccess {
  tenantId: string;
  defaultTenant: boolean;
}

export type AuthSessionScope = "UNIDADE" | "REDE" | "GLOBAL";

export interface AuthSession {
  token?: string;
  refreshToken?: string;
  type?: string;
  expiresIn?: number;
  userId?: string;
  userKind?: string;
  displayName?: string;
  networkId?: string;
  networkSubdomain?: string;
  networkSlug?: string;
  networkName?: string;
  activeTenantId?: string;
  baseTenantId?: string;
  availableTenants?: TenantAccess[];
  availableScopes?: AuthSessionScope[];
  broadAccess?: boolean;
  forcePasswordChangeRequired?: boolean;
}

export interface AuthSessionTokenClaims {
  userId?: string;
  userKind?: string;
  displayName?: string;
  networkId?: string;
  networkSubdomain?: string;
  networkSlug?: string;
  networkName?: string;
  activeTenantId?: string;
  baseTenantId?: string;
  availableScopes?: AuthSessionScope[];
  broadAccess?: boolean;
  scope?: string;
  sessionMode?: string;
}

export interface ImpersonationSessionState {
  targetUserId: string;
  targetUserName: string;
  actorDisplayName?: string;
  justification: string;
  startedAt: string;
  auditContextId?: string;
  returnPath?: string;
  originalSession: AuthSession;
}

export interface BackofficeReturnSessionState {
  originalSession: AuthSession;
  storedAt: string;
}

export interface OperationalTenantScopeState {
  academiaId: string;
  tenantIds: string[];
  defaultTenantId?: string;
  storedAt: string;
}

import {
  getAccessToken as getAccessTokenFromStore,
  getRefreshToken as getRefreshTokenFromStore,
  getTokenType as getTokenTypeFromStore,
  saveTokens,
  clearTokens,
  getFetchCredentials,
  shouldInjectAuthHeader,
  hasActiveSession,
} from "./token-store";

export { getFetchCredentials, shouldInjectAuthHeader, hasActiveSession };

const EXPIRES_IN_KEY = "academia-auth-expires-in";
const USER_ID_KEY = "academia-auth-user-id";
const USER_KIND_KEY = "academia-auth-user-kind";
const DISPLAY_NAME_KEY = "academia-auth-display-name";
const NETWORK_ID_KEY = "academia-auth-network-id";
const NETWORK_SUBDOMAIN_KEY = "academia-auth-network-subdomain";
const NETWORK_SLUG_KEY = "academia-auth-network-slug";
const NETWORK_NAME_KEY = "academia-auth-network-name";
const ACTIVE_TENANT_ID_KEY = "academia-auth-active-tenant-id";
const BASE_TENANT_ID_KEY = "academia-auth-base-tenant-id";
const AVAILABLE_TENANTS_KEY = "academia-auth-available-tenants";
const AVAILABLE_SCOPES_KEY = "academia-auth-available-scopes";
const BROAD_ACCESS_KEY = "academia-auth-broad-access";
const FORCE_PASSWORD_CHANGE_REQUIRED_KEY = "academia-auth-force-password-change-required";
const SESSION_ACTIVE_KEY = "academia-auth-session-active";
const PREFERRED_TENANT_ID_KEY = "academia-auth-preferred-tenant-id";
const IMPERSONATION_SESSION_KEY = "academia-impersonation-session";
const BACKOFFICE_RETURN_SESSION_KEY = "academia-backoffice-return-session";
const ACTIVE_TENANT_COOKIE_KEY = "academia-active-tenant-id";
const OPERATIONAL_TENANT_SCOPE_KEY = "academia-operational-tenant-scope";
export const CONTEXT_STORAGE_KEY = "academia-api-context-id";
export const AUTH_SESSION_UPDATED_EVENT = "academia-session-updated";
export const AUTH_SESSION_CLEARED_EVENT = "academia-session-cleared";
export const IMPERSONATION_SESSION_UPDATED_EVENT = "academia-impersonation-updated";

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

function notifyAuthSessionUpdated(): void {
  if (!isBrowser()) return;
  if (typeof window.dispatchEvent !== "function") return;
  window.dispatchEvent(new Event(AUTH_SESSION_UPDATED_EVENT));
}

function notifyAuthSessionCleared(): void {
  if (!isBrowser()) return;
  if (typeof window.dispatchEvent !== "function") return;
  window.dispatchEvent(new Event(AUTH_SESSION_CLEARED_EVENT));
}

function notifyImpersonationSessionUpdated(): void {
  if (!isBrowser()) return;
  if (typeof window.dispatchEvent !== "function") return;
  window.dispatchEvent(new Event(IMPERSONATION_SESSION_UPDATED_EVENT));
}

function clearAuthStorageKeys(keys: string[]): void {
  if (!isBrowser()) return;
  for (const key of keys) {
    window.localStorage.removeItem(key);
  }
}

function writeCookie(name: string, value: string, maxAgeSeconds?: number): void {
  if (!isBrowser()) return;
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  const maxAge = typeof maxAgeSeconds === "number" ? `; Max-Age=${maxAgeSeconds}` : "";
  document.cookie = `${name}=${encodeURIComponent(value)}; Path=/; SameSite=Lax${maxAge}${secure}`;
}

function expireCookie(name: string): void {
  if (!isBrowser()) return;
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${name}=; Path=/; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax${secure}`;
}

function syncServerSessionCookies(session: AuthSession): void {
  if (!isBrowser()) return;

  if (session.activeTenantId?.trim()) {
    writeCookie(ACTIVE_TENANT_COOKIE_KEY, session.activeTenantId.trim());
  } else {
    expireCookie(ACTIVE_TENANT_COOKIE_KEY);
  }
}

function clearServerSessionCookies(): void {
  expireCookie(ACTIVE_TENANT_COOKIE_KEY);
}

export function getAccessToken(): string | undefined {
  return getAccessTokenFromStore();
}

export function getAccessTokenType(): string | undefined {
  return getTokenTypeFromStore();
}

export function getRefreshToken(): string | undefined {
  return getRefreshTokenFromStore();
}

export function getActiveTenantIdFromSession(): string | undefined {
  if (!isBrowser()) return undefined;
  return window.localStorage.getItem(ACTIVE_TENANT_ID_KEY) ?? undefined;
}

export function getBaseTenantIdFromSession(): string | undefined {
  if (!isBrowser()) return undefined;
  return window.localStorage.getItem(BASE_TENANT_ID_KEY) ?? undefined;
}

export function getUserIdFromSession(): string | undefined {
  if (!isBrowser()) return undefined;
  return window.localStorage.getItem(USER_ID_KEY) ?? undefined;
}

export function getUserKindFromSession(): string | undefined {
  if (!isBrowser()) return undefined;
  return window.localStorage.getItem(USER_KIND_KEY) ?? undefined;
}

export function getDisplayNameFromSession(): string | undefined {
  if (!isBrowser()) return undefined;
  return window.localStorage.getItem(DISPLAY_NAME_KEY) ?? undefined;
}

export function getNetworkIdFromSession(): string | undefined {
  if (!isBrowser()) return undefined;
  return window.localStorage.getItem(NETWORK_ID_KEY) ?? undefined;
}

export function getNetworkSlugFromSession(): string | undefined {
  return getNetworkSubdomainFromSession();
}

export function getNetworkSubdomainFromSession(): string | undefined {
  if (!isBrowser()) return undefined;
  return (
    window.localStorage.getItem(NETWORK_SUBDOMAIN_KEY)
    ?? window.localStorage.getItem(NETWORK_SLUG_KEY)
    ?? undefined
  );
}

export function getNetworkNameFromSession(): string | undefined {
  if (!isBrowser()) return undefined;
  return window.localStorage.getItem(NETWORK_NAME_KEY) ?? undefined;
}

export function getBroadAccessFromSession(): boolean {
  if (!isBrowser()) return false;
  return window.localStorage.getItem(BROAD_ACCESS_KEY) === "true";
}

export function getForcePasswordChangeRequiredFromSession(): boolean {
  if (!isBrowser()) return false;
  return window.localStorage.getItem(FORCE_PASSWORD_CHANGE_REQUIRED_KEY) === "true";
}

export function getAvailableScopesFromSession(): AuthSessionScope[] {
  if (!isBrowser()) return [];
  const raw = window.localStorage.getItem(AVAILABLE_SCOPES_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((item) => (typeof item === "string" ? item.trim().toUpperCase() : ""))
      .filter((item): item is AuthSessionScope => item === "UNIDADE" || item === "REDE" || item === "GLOBAL");
  } catch {
    return [];
  }
}

export function getAvailableTenantsFromSession(): TenantAccess[] {
  if (!isBrowser()) return [];
  const raw = window.localStorage.getItem(AVAILABLE_TENANTS_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    const normalized = parsed
      .map((item) => {
        if (!item || typeof item !== "object") return null;
        const candidate = item as { tenantId?: unknown; defaultTenant?: unknown };
        const tenantId = typeof candidate.tenantId === "string" ? candidate.tenantId.trim() : "";
        const defaultTenant =
          typeof candidate.defaultTenant === "boolean" ? candidate.defaultTenant : false;
        if (!tenantId) return null;
        return { tenantId, defaultTenant };
      })
      .filter((item): item is TenantAccess => item !== null);
    return filterTenantAccessByOperationalScope(normalized);
  } catch {
    return [];
  }
}

export function getAuthSessionSnapshot(): AuthSession | null {
  if (!isBrowser()) return null;
  const token = getAccessToken();
  const refreshToken = getRefreshToken();
  if (!hasActiveSession()) return null;

  const rawExpiresIn = window.localStorage.getItem(EXPIRES_IN_KEY);
  const expiresIn = rawExpiresIn ? Number(rawExpiresIn) : undefined;

  return {
    token,
    refreshToken,
    type: getAccessTokenType(),
    expiresIn: Number.isFinite(expiresIn) ? expiresIn : undefined,
    userId: getUserIdFromSession(),
    userKind: getUserKindFromSession(),
    displayName: getDisplayNameFromSession(),
    networkId: getNetworkIdFromSession(),
    networkSubdomain: getNetworkSubdomainFromSession(),
    networkSlug: getNetworkSlugFromSession(),
    networkName: getNetworkNameFromSession(),
    activeTenantId: getActiveTenantIdFromSession(),
    baseTenantId: getBaseTenantIdFromSession(),
    availableTenants: getAvailableTenantsFromSession(),
    availableScopes: getAvailableScopesFromSession(),
    broadAccess: getBroadAccessFromSession(),
    forcePasswordChangeRequired: getForcePasswordChangeRequiredFromSession(),
  };
}

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  const normalizedToken = token.trim();
  if (!normalizedToken) return null;

  const [, payload] = normalizedToken.split(".");
  if (!payload) return null;

  const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");

  try {
    if (typeof window !== "undefined" && typeof window.atob === "function") {
      return JSON.parse(window.atob(padded)) as Record<string, unknown>;
    }

    return JSON.parse(Buffer.from(padded, "base64").toString("utf-8")) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function normalizeClaimString(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const normalized = value.trim();
  return normalized || undefined;
}

function readClaimString(payload: Record<string, unknown>, keys: string[]): string | undefined {
  for (const key of keys) {
    const candidate = normalizeClaimString(payload[key]);
    if (candidate) return candidate;
  }
  return undefined;
}

function normalizeScopesFromClaims(value: unknown): AuthSessionScope[] {
  const rawValues = Array.isArray(value) ? value : typeof value === "string" ? [value] : [];
  return rawValues
    .map((item) => (typeof item === "string" ? item.trim().toUpperCase() : ""))
    .filter((item): item is AuthSessionScope => item === "UNIDADE" || item === "REDE" || item === "GLOBAL");
}

function normalizeTenantIds(values: string[]): string[] {
  const seen = new Set<string>();
  return values
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter((item) => {
      if (!item || seen.has(item)) return false;
      seen.add(item);
      return true;
    });
}

export function getOperationalTenantScope(): OperationalTenantScopeState | null {
  if (!isBrowser()) return null;
  const raw = window.sessionStorage?.getItem(OPERATIONAL_TENANT_SCOPE_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as Partial<OperationalTenantScopeState>;
    const academiaId = typeof parsed.academiaId === "string" ? parsed.academiaId.trim() : "";
    const tenantIds = normalizeTenantIds(Array.isArray(parsed.tenantIds) ? parsed.tenantIds : []);
    const defaultTenantId =
      typeof parsed.defaultTenantId === "string" && tenantIds.includes(parsed.defaultTenantId.trim())
        ? parsed.defaultTenantId.trim()
        : tenantIds[0];

    if (!academiaId || tenantIds.length === 0) {
      window.sessionStorage?.removeItem(OPERATIONAL_TENANT_SCOPE_KEY);
      return null;
    }

    return {
      academiaId,
      tenantIds,
      defaultTenantId,
      storedAt: typeof parsed.storedAt === "string" ? parsed.storedAt : "",
    };
  } catch {
    window.sessionStorage?.removeItem(OPERATIONAL_TENANT_SCOPE_KEY);
    return null;
  }
}

export function getOperationalScopeDefaultTenantId(): string | undefined {
  const scope = getOperationalTenantScope();
  if (!scope) return undefined;
  return scope.defaultTenantId ?? scope.tenantIds[0];
}

export function filterTenantAccessByOperationalScope(items: TenantAccess[]): TenantAccess[] {
  const scope = getOperationalTenantScope();
  if (!scope) return items;

  const allowedIds = new Set(scope.tenantIds);
  const defaultTenantId = scope.defaultTenantId ?? scope.tenantIds[0];
  const filtered = items
    .filter((item) => allowedIds.has(item.tenantId))
    .map((item) => ({
      tenantId: item.tenantId,
      defaultTenant: item.tenantId === defaultTenantId,
    }));

  if (filtered.length > 0) {
    return filtered;
  }

  return scope.tenantIds.map((tenantId) => ({
    tenantId,
    defaultTenant: tenantId === defaultTenantId,
  }));
}

export function rememberOperationalTenantScope(input: {
  academiaId: string;
  tenantIds: string[];
  defaultTenantId?: string;
}): void {
  if (!isBrowser()) return;
  const academiaId = input.academiaId.trim();
  const tenantIds = normalizeTenantIds(input.tenantIds);
  if (!academiaId || tenantIds.length === 0) return;

  const defaultTenantId =
    input.defaultTenantId && tenantIds.includes(input.defaultTenantId.trim())
      ? input.defaultTenantId.trim()
      : tenantIds[0];

  window.sessionStorage?.setItem(
    OPERATIONAL_TENANT_SCOPE_KEY,
    JSON.stringify({
      academiaId,
      tenantIds,
      defaultTenantId,
      storedAt: new Date().toISOString(),
    } satisfies OperationalTenantScopeState)
  );
  notifyAuthSessionUpdated();
}

export function clearOperationalTenantScope(): void {
  if (!isBrowser()) return;
  window.sessionStorage?.removeItem(OPERATIONAL_TENANT_SCOPE_KEY);
  notifyAuthSessionUpdated();
}

export function hasGlobalBackofficeAccessFromSession(): boolean {
  const scopes = getAvailableScopesFromSession();
  if (scopes.includes("GLOBAL")) {
    return true;
  }

  if (getBroadAccessFromSession()) {
    return true;
  }

  const claims = getSessionClaimsFromToken(getAccessToken());
  const sessionMode = claims.sessionMode?.trim().toUpperCase();
  return sessionMode === "BACKOFFICE_ADMIN" || sessionMode === "BACKOFFICE_TO_OPERATIONAL";
}

function canReturnToBackofficeFromSession(session: AuthSession | null | undefined): boolean {
  if (!session) return false;

  const claims = getSessionClaimsFromToken(session.token);
  const scopes =
    session.availableScopes?.length
      ? session.availableScopes
      : claims.availableScopes ?? [];
  const sessionMode = claims.sessionMode?.trim().toUpperCase();
  const scopeClaim = claims.scope?.trim().toUpperCase();

  return (
    scopes.includes("GLOBAL")
    || scopeClaim === "GLOBAL"
    || Boolean(session.broadAccess ?? claims.broadAccess)
    || sessionMode === "BACKOFFICE_ADMIN"
    || sessionMode === "BACKOFFICE_TO_OPERATIONAL"
  );
}

export function getSessionClaimsFromToken(token?: string): AuthSessionTokenClaims {
  if (!token) return {};
  const payload = decodeJwtPayload(token);
  if (!payload) return {};

  const activeTenantId = readClaimString(payload, ["activeTenantId", "tenantId", "tenant_id", "unidadeId"]);
  const baseTenantId = readClaimString(payload, ["tenantBaseId", "baseTenantId", "tenant_base_id", "base_tenant_id"]);
  const networkSubdomain = readClaimString(payload, ["redeSubdominio", "rede_subdominio", "networkSubdomain"]);
  const networkSlug = readClaimString(payload, ["redeSlug", "rede_slug", "networkSlug"]);
  const scopeClaim = readClaimString(payload, ["scope"]);

  return {
    userId: readClaimString(payload, ["userId", "user_id", "sub", "id"]),
    userKind: readClaimString(payload, ["userKind", "tipoUsuario"]),
    displayName: readClaimString(payload, ["displayName", "nome"]),
    networkId: readClaimString(payload, ["redeId", "rede_id", "networkId"]),
    networkSubdomain,
    networkSlug,
    networkName: readClaimString(payload, ["redeNome", "rede_nome", "networkName"]),
    activeTenantId,
    baseTenantId,
    availableScopes: normalizeScopesFromClaims(payload.availableScopes ?? payload.scopes ?? scopeClaim),
    broadAccess: typeof payload.broadAccess === "boolean" ? payload.broadAccess : undefined,
    scope: scopeClaim,
    sessionMode: readClaimString(payload, ["session_mode", "sessionMode"]),
  };
}

export function getRolesFromSession(): string[] {
  const token = getAccessToken();
  if (!token) return [];

  const payload = decodeJwtPayload(token);
  const roles = payload?.roles;
  if (!Array.isArray(roles)) return [];

  return roles
    .map((role) => (typeof role === "string" ? role.trim().toUpperCase() : ""))
    .filter(Boolean);
}

export function getImpersonationSession(): ImpersonationSessionState | null {
  if (!isBrowser()) return null;
  const raw = window.sessionStorage.getItem(IMPERSONATION_SESSION_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<ImpersonationSessionState>;
    if (!parsed || typeof parsed !== "object") return null;
    if (!parsed.targetUserId || !parsed.targetUserName || !parsed.originalSession) return null;
    return {
      targetUserId: parsed.targetUserId,
      targetUserName: parsed.targetUserName,
      actorDisplayName: parsed.actorDisplayName,
      justification: parsed.justification ?? "",
      startedAt: parsed.startedAt ?? "",
      auditContextId: parsed.auditContextId,
      returnPath: parsed.returnPath,
      originalSession: parsed.originalSession,
    };
  } catch {
    return null;
  }
}

export function getBackofficeReturnSession(): BackofficeReturnSessionState | null {
  if (!isBrowser()) return null;
  const raw = window.sessionStorage.getItem(BACKOFFICE_RETURN_SESSION_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as Partial<BackofficeReturnSessionState>;
    if (!parsed || typeof parsed !== "object" || !parsed.originalSession) {
      return null;
    }
    if (!canReturnToBackofficeFromSession(parsed.originalSession)) {
      return null;
    }
    return {
      originalSession: parsed.originalSession,
      storedAt: parsed.storedAt ?? "",
    };
  } catch {
    return null;
  }
}

export function hasBackofficeReturnSession(): boolean {
  return Boolean(getBackofficeReturnSession());
}

export function rememberBackofficeReturnSession(session?: AuthSession | null): void {
  if (!isBrowser()) return;

  const originalSession = session ?? getAuthSessionSnapshot();
  if (!canReturnToBackofficeFromSession(originalSession)) {
    return;
  }
  if (!originalSession) {
    return;
  }

  window.sessionStorage.setItem(
    BACKOFFICE_RETURN_SESSION_KEY,
    JSON.stringify({
      originalSession,
      storedAt: new Date().toISOString(),
    } satisfies BackofficeReturnSessionState)
  );
}

export function clearBackofficeReturnSession(): void {
  if (!isBrowser()) return;
  window.sessionStorage.removeItem(BACKOFFICE_RETURN_SESSION_KEY);
}

export function restoreBackofficeReturnSession(): BackofficeReturnSessionState | null {
  const snapshot = getBackofficeReturnSession();
  if (!snapshot) return null;
  clearBackofficeReturnSession();
  clearOperationalTenantScope();
  saveAuthSession(snapshot.originalSession);
  return snapshot;
}

export function isImpersonating(): boolean {
  return Boolean(getImpersonationSession());
}

export function startImpersonationSession(input: {
  originalSession: AuthSession;
  impersonatedSession: AuthSession;
  targetUserId: string;
  targetUserName: string;
  justification: string;
  auditContextId?: string;
  returnPath?: string;
  actorDisplayName?: string;
}): void {
  if (!isBrowser()) return;
  window.sessionStorage.setItem(
    IMPERSONATION_SESSION_KEY,
    JSON.stringify({
      targetUserId: input.targetUserId,
      targetUserName: input.targetUserName,
      actorDisplayName: input.actorDisplayName,
      justification: input.justification,
      startedAt: new Date().toISOString(),
      auditContextId: input.auditContextId,
      returnPath: input.returnPath,
      originalSession: input.originalSession,
    } satisfies ImpersonationSessionState)
  );
  saveAuthSession(input.impersonatedSession);
  notifyImpersonationSessionUpdated();
}

export function restoreOriginalSessionFromImpersonation(): ImpersonationSessionState | null {
  const snapshot = getImpersonationSession();
  if (!snapshot) return null;
  saveAuthSession(snapshot.originalSession);
  notifyImpersonationSessionUpdated();
  return snapshot;
}

export function clearImpersonationSession(): void {
  if (!isBrowser()) return;
  window.sessionStorage.removeItem(IMPERSONATION_SESSION_KEY);
  notifyImpersonationSessionUpdated();
}

export function saveAuthSession(session: AuthSession): void {
  if (!isBrowser()) return;
  saveTokens({ token: session.token, refreshToken: session.refreshToken, type: session.type });
  syncServerSessionCookies(session);
  if (session.expiresIn != null) {
    window.localStorage.setItem(EXPIRES_IN_KEY, String(session.expiresIn));
  } else {
    window.localStorage.removeItem(EXPIRES_IN_KEY);
  }
  window.localStorage.setItem(SESSION_ACTIVE_KEY, "true");
  if (session.userId) {
    window.localStorage.setItem(USER_ID_KEY, session.userId);
  } else {
    window.localStorage.removeItem(USER_ID_KEY);
  }
  if (session.userKind) {
    window.localStorage.setItem(USER_KIND_KEY, session.userKind);
  } else {
    window.localStorage.removeItem(USER_KIND_KEY);
  }
  if (session.displayName) {
    window.localStorage.setItem(DISPLAY_NAME_KEY, session.displayName);
  } else {
    window.localStorage.removeItem(DISPLAY_NAME_KEY);
  }
  if (session.networkId) {
    window.localStorage.setItem(NETWORK_ID_KEY, session.networkId);
  } else {
    window.localStorage.removeItem(NETWORK_ID_KEY);
  }
  const networkSubdomain = session.networkSubdomain ?? session.networkSlug;
  if (networkSubdomain) {
    window.localStorage.setItem(NETWORK_SUBDOMAIN_KEY, networkSubdomain);
    window.localStorage.setItem(NETWORK_SLUG_KEY, networkSubdomain);
  } else {
    window.localStorage.removeItem(NETWORK_SUBDOMAIN_KEY);
    window.localStorage.removeItem(NETWORK_SLUG_KEY);
  }
  if (session.networkName) {
    window.localStorage.setItem(NETWORK_NAME_KEY, session.networkName);
  } else {
    window.localStorage.removeItem(NETWORK_NAME_KEY);
  }
  if (session.activeTenantId) {
    window.localStorage.setItem(ACTIVE_TENANT_ID_KEY, session.activeTenantId);
  } else {
    window.localStorage.removeItem(ACTIVE_TENANT_ID_KEY);
  }
  if (session.baseTenantId) {
    window.localStorage.setItem(BASE_TENANT_ID_KEY, session.baseTenantId);
  } else {
    window.localStorage.removeItem(BASE_TENANT_ID_KEY);
  }
  if (session.availableTenants?.length) {
    window.localStorage.setItem(
      AVAILABLE_TENANTS_KEY,
      JSON.stringify(session.availableTenants)
    );
  } else {
    window.localStorage.removeItem(AVAILABLE_TENANTS_KEY);
  }
  if (session.availableScopes?.length) {
    window.localStorage.setItem(AVAILABLE_SCOPES_KEY, JSON.stringify(session.availableScopes));
  } else {
    window.localStorage.removeItem(AVAILABLE_SCOPES_KEY);
  }
  window.localStorage.setItem(BROAD_ACCESS_KEY, session.broadAccess ? "true" : "false");
  window.localStorage.setItem(
    FORCE_PASSWORD_CHANGE_REQUIRED_KEY,
    session.forcePasswordChangeRequired ? "true" : "false"
  );
  notifyAuthSessionUpdated();
}

export function setActiveTenantId(tenantId?: string): void {
  if (!isBrowser()) return;
  if (!tenantId) {
    expireCookie(ACTIVE_TENANT_COOKIE_KEY);
    window.localStorage.removeItem(ACTIVE_TENANT_ID_KEY);
    notifyAuthSessionUpdated();
    return;
  }
  writeCookie(ACTIVE_TENANT_COOKIE_KEY, tenantId);
  window.localStorage.setItem(ACTIVE_TENANT_ID_KEY, tenantId);
  notifyAuthSessionUpdated();
}

export function setAvailableTenants(tenantIds: string[], defaultTenantId?: string): void {
  if (!isBrowser()) return;
  const normalizedIds = tenantIds
    .map((tenantId) => (typeof tenantId === "string" ? tenantId.trim() : ""))
    .filter(Boolean);

  if (!normalizedIds.length) {
    window.localStorage.removeItem(AVAILABLE_TENANTS_KEY);
    notifyAuthSessionUpdated();
    return;
  }

  const set = new Set<string>();
  const dedupedIds = normalizedIds.filter((tenantId) => {
    if (set.has(tenantId)) return false;
    set.add(tenantId);
    return true;
  });

  const orderedTenantIds = dedupedIds;
  const defaultId =
    defaultTenantId && orderedTenantIds.includes(defaultTenantId)
      ? defaultTenantId
      : orderedTenantIds[0] ?? "";

  const payload = orderedTenantIds.map((tenantId, index) => ({
    tenantId,
    defaultTenant: tenantId === defaultId || (!defaultId && index === 0),
  }));
  window.localStorage.setItem(AVAILABLE_TENANTS_KEY, JSON.stringify(payload));
  notifyAuthSessionUpdated();
}

export function clearAvailableTenants(): void {
  if (!isBrowser()) return;
  window.localStorage.removeItem(AVAILABLE_TENANTS_KEY);
  notifyAuthSessionUpdated();
}

export function clearAuthSession(): void {
  clearTokens();
  clearServerSessionCookies();
  clearBackofficeReturnSession();
  clearOperationalTenantScope();
  clearAuthStorageKeys([
    EXPIRES_IN_KEY,
    SESSION_ACTIVE_KEY,
    USER_ID_KEY,
    USER_KIND_KEY,
    DISPLAY_NAME_KEY,
    NETWORK_ID_KEY,
    NETWORK_SUBDOMAIN_KEY,
    NETWORK_SLUG_KEY,
    NETWORK_NAME_KEY,
    ACTIVE_TENANT_ID_KEY,
    BASE_TENANT_ID_KEY,
    AVAILABLE_TENANTS_KEY,
    AVAILABLE_SCOPES_KEY,
    BROAD_ACCESS_KEY,
    FORCE_PASSWORD_CHANGE_REQUIRED_KEY,
    PREFERRED_TENANT_ID_KEY,
    CONTEXT_STORAGE_KEY,
  ]);
  notifyAuthSessionUpdated();
  notifyAuthSessionCleared();
}

export function getPreferredTenantId(): string | undefined {
  if (!isBrowser()) return undefined;
  return window.localStorage.getItem(PREFERRED_TENANT_ID_KEY) ?? undefined;
}

export function setPreferredTenantId(tenantId: string): void {
  if (!isBrowser()) return;
  window.localStorage.setItem(PREFERRED_TENANT_ID_KEY, tenantId);
  notifyAuthSessionUpdated();
}
