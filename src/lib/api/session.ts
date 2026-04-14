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

export interface BackofficeRecoverySessionState {
  refreshToken: string;
  userId?: string;
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
  getSessionClaims,
  getFetchCredentials,
  shouldInjectAuthHeader,
  hasActiveSession,
} from "./token-store";

export { getFetchCredentials, shouldInjectAuthHeader, hasActiveSession };

/**
 * Task 458: Chaves de localStorage foram removidas.
 * Tokens e claims vêm de cookies HttpOnly definidos pelo backend.
 * Apenas preferências de UI e contexto volátil permanecem em storage local.
 */
const PREFERRED_TENANT_ID_KEY = "academia-auth-preferred-tenant-id";
const IMPERSONATION_SESSION_KEY = "academia-impersonation-session";
const BACKOFFICE_RETURN_SESSION_KEY = "academia-backoffice-return-session";
const BACKOFFICE_RECOVERY_SESSION_KEY = "academia-backoffice-recovery-session";
const BACKOFFICE_REAUTH_REQUIRED_KEY = "academia-backoffice-reauth-required";
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

/**
 * Task 458: writeCookie/expireCookie removidos — o backend gerencia cookies de sessão.
 * Mantemos apenas o cookie de tenant ativo para compatibilidade com proxy/rewrites.
 */

function expireCookie(name: string): void {
  if (!isBrowser()) return;
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${name}=; Path=/; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax${secure}`;
}

/**
 * Task 458: syncServerSessionCookies removido — backend já define cookies via Set-Cookie.
 * Mantemos apenas expiração do cookie de tenant ativo quando necessário.
 */
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

/**
 * Task 458: Claims vêm do cookie fc_session_claims, não de localStorage.
 * Cada getter lê o claims cookie uma vez e extrai o campo necessário.
 */
function getClaims() {
  return getSessionClaims();
}

export function getActiveTenantIdFromSession(): string | undefined {
  return getClaims()?.activeTenantId;
}

export function getBaseTenantIdFromSession(): string | undefined {
  return getClaims()?.baseTenantId;
}

export function getUserIdFromSession(): string | undefined {
  return getClaims()?.userId;
}

export function getUserKindFromSession(): string | undefined {
  return getClaims()?.userKind;
}

export function getDisplayNameFromSession(): string | undefined {
  return getClaims()?.displayName;
}

export function getNetworkIdFromSession(): string | undefined {
  return getClaims()?.networkId;
}

export function getNetworkSlugFromSession(): string | undefined {
  return getNetworkSubdomainFromSession();
}

export function getNetworkSubdomainFromSession(): string | undefined {
  const claims = getClaims();
  return claims?.networkSubdomain ?? claims?.networkSlug;
}

export function getNetworkNameFromSession(): string | undefined {
  return getClaims()?.networkName;
}

export function getBroadAccessFromSession(): boolean {
  return getClaims()?.broadAccess === true;
}

export function getForcePasswordChangeRequiredFromSession(): boolean {
  return getClaims()?.forcePasswordChangeRequired === true;
}

export function getAvailableScopesFromSession(): AuthSessionScope[] {
  const raw = getClaims()?.availableScopes;
  if (!raw) return [];
  return raw
    .map((item) => (typeof item === "string" ? item.trim().toUpperCase() : ""))
    .filter((item): item is AuthSessionScope => item === "UNIDADE" || item === "REDE" || item === "GLOBAL");
}

export function getAvailableTenantsFromSession(): TenantAccess[] {
  // Task 458: availableTenants não é mais armazenado localmente.
  // Retorna array vazio — o backend resolve tenants via token claims.
  // Se necessário, o frontend pode buscar via endpoint de contexto.
  return [];
}

export function getAuthSessionSnapshot(): AuthSession | null {
  if (!isBrowser()) return null;
  const token = getAccessToken();
  const refreshToken = getRefreshToken();
  if (!hasActiveSession()) return null;

  const claims = getClaims();

  return {
    token,
    refreshToken,
    type: getAccessTokenType(),
    expiresIn: undefined,
    userId: claims?.userId,
    userKind: claims?.userKind,
    displayName: claims?.displayName,
    networkId: claims?.networkId,
    networkSubdomain: claims?.networkSubdomain,
    networkSlug: claims?.networkSlug,
    networkName: claims?.networkName,
    activeTenantId: claims?.activeTenantId,
    baseTenantId: claims?.baseTenantId,
    availableTenants: [],
    availableScopes: claims?.availableScopes
      ? (claims.availableScopes
          .map((item) => (typeof item === "string" ? item.trim().toUpperCase() : ""))
          .filter((item): item is AuthSessionScope => item === "UNIDADE" || item === "REDE" || item === "GLOBAL")
        )
      : [],
    broadAccess: claims?.broadAccess,
    forcePasswordChangeRequired: claims?.forcePasswordChangeRequired,
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

function rememberOperationalTenantScope(input: {
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
    userKind: readClaimString(payload, ["user_kind", "userKind", "tipoUsuario"]),
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

export function hasRestorableBackofficeReturnSession(): boolean {
  const snapshot = getBackofficeReturnSession();
  const refreshToken =
    typeof snapshot?.originalSession?.refreshToken === "string"
      ? snapshot.originalSession.refreshToken.trim()
      : "";
  return Boolean(refreshToken);
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

export function getBackofficeRecoverySession(): BackofficeRecoverySessionState | null {
  if (!isBrowser()) return null;
  const raw = window.sessionStorage.getItem(BACKOFFICE_RECOVERY_SESSION_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as Partial<BackofficeRecoverySessionState>;
    const refreshToken =
      typeof parsed.refreshToken === "string" ? parsed.refreshToken.trim() : "";
    if (!refreshToken) {
      window.sessionStorage.removeItem(BACKOFFICE_RECOVERY_SESSION_KEY);
      return null;
    }

    return {
      refreshToken,
      userId: typeof parsed.userId === "string" ? parsed.userId : undefined,
      storedAt: typeof parsed.storedAt === "string" ? parsed.storedAt : "",
    };
  } catch {
    window.sessionStorage.removeItem(BACKOFFICE_RECOVERY_SESSION_KEY);
    return null;
  }
}

export function rememberBackofficeRecoverySession(session?: AuthSession | null): void {
  if (!isBrowser()) return;
  const refreshToken =
    typeof session?.refreshToken === "string" ? session.refreshToken.trim() : "";

  if (!refreshToken) {
    window.sessionStorage.removeItem(BACKOFFICE_RECOVERY_SESSION_KEY);
    return;
  }

  window.sessionStorage.setItem(
    BACKOFFICE_RECOVERY_SESSION_KEY,
    JSON.stringify({
      refreshToken,
      userId: session?.userId,
      storedAt: new Date().toISOString(),
    } satisfies BackofficeRecoverySessionState)
  );
}

export function clearBackofficeRecoverySession(): void {
  if (!isBrowser()) return;
  window.sessionStorage.removeItem(BACKOFFICE_RECOVERY_SESSION_KEY);
}

export function markBackofficeReauthRequired(): void {
  if (!isBrowser()) return;
  window.sessionStorage.setItem(BACKOFFICE_REAUTH_REQUIRED_KEY, "true");
}

export function consumeBackofficeReauthRequired(): boolean {
  if (!isBrowser()) return false;
  const required = window.sessionStorage.getItem(BACKOFFICE_REAUTH_REQUIRED_KEY) === "true";
  window.sessionStorage.removeItem(BACKOFFICE_REAUTH_REQUIRED_KEY);
  return required;
}

export function restoreBackofficeReturnSession(): BackofficeReturnSessionState | null {
  const snapshot = getBackofficeReturnSession();
  if (!snapshot) return null;
  if (!hasRestorableBackofficeReturnSession()) {
    clearBackofficeReturnSession();
    clearOperationalTenantScope();
    return null;
  }
  clearBackofficeReturnSession();
  clearOperationalTenantScope();
  rememberBackofficeRecoverySession(snapshot.originalSession);
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

/**
 * Task 458: saveAuthSession não grava mais tokens ou claims em localStorage.
 * Tokens e claims são gerenciados exclusivamente pelo backend via Set-Cookie.
 * Esta função apenas notifica listeners de mudança de sessão.
 */
export function saveAuthSession(_session: AuthSession): void {
  // Tokens e claims vêm do backend via cookies HttpOnly.
  // Não gravamos nada localmente — apenas notificamos que a sessão mudou.
  notifyAuthSessionUpdated();
}

export function setActiveTenantId(tenantId?: string): void {
  if (!isBrowser()) return;
  if (!tenantId) {
    expireCookie(ACTIVE_TENANT_COOKIE_KEY);
    notifyAuthSessionUpdated();
    return;
  }
  // Task 458: Apenas define cookie para compatibilidade com proxy.
  // O backend gerencia o tenant ativo via token de sessão.
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${ACTIVE_TENANT_COOKIE_KEY}=${encodeURIComponent(tenantId)}; Path=/; SameSite=Lax${secure}`;
  notifyAuthSessionUpdated();
}

export function setAvailableTenants(_tenantIds: string[], _defaultTenantId?: string): void {
  // Task 458: availableTenants é resolvido pelo backend via token claims.
  // Não armazenamos localmente.
  notifyAuthSessionUpdated();
}

function clearAvailableTenants(): void {
  // Task 458: NO-OP — tenants são resolvidos pelo backend.
  notifyAuthSessionUpdated();
}

export function clearAuthSession(): void {
  clearTokens();
  clearServerSessionCookies();
  clearBackofficeReturnSession();
  clearBackofficeRecoverySession();
  clearOperationalTenantScope();
  // Task 458: Expira cookies de sessão que o frontend pode limpar.
  // Tokens e claims são gerenciados pelo backend (Set-Cookie).
  if (isBrowser()) {
    expireCookie("fc_session_active");
    expireCookie("fc_session_claims");
    // Remove chaves residuais de localStorage que possam existir
    // em navegadores antigos. Novas sessões não gravam em localStorage.
    const legacyKeys = [
      PREFERRED_TENANT_ID_KEY,
      CONTEXT_STORAGE_KEY,
    ];
    for (const key of legacyKeys) {
      try { window.localStorage.removeItem(key); } catch { /* noop */ }
    }
  }
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
