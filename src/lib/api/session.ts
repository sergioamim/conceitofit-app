export interface TenantAccess {
  tenantId: string;
  defaultTenant: boolean;
}

export interface AuthSession {
  token: string;
  refreshToken: string;
  type?: string;
  expiresIn?: number;
  activeTenantId?: string;
  availableTenants?: TenantAccess[];
}

const ACCESS_TOKEN_KEY = "academia-auth-token";
const REFRESH_TOKEN_KEY = "academia-auth-refresh-token";
const TOKEN_TYPE_KEY = "academia-auth-token-type";
const EXPIRES_IN_KEY = "academia-auth-expires-in";
const ACTIVE_TENANT_ID_KEY = "academia-auth-active-tenant-id";
const AVAILABLE_TENANTS_KEY = "academia-auth-available-tenants";
const PREFERRED_TENANT_ID_KEY = "academia-auth-preferred-tenant-id";
export const CONTEXT_STORAGE_KEY = "academia-api-context-id";
export const AUTH_SESSION_UPDATED_EVENT = "academia-session-updated";
export const AUTH_SESSION_CLEARED_EVENT = "academia-session-cleared";

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

function clearAuthStorageKeys(keys: string[]): void {
  if (!isBrowser()) return;
  for (const key of keys) {
    window.localStorage.removeItem(key);
  }
}

export function getAccessToken(): string | undefined {
  if (!isBrowser()) return undefined;
  return window.localStorage.getItem(ACCESS_TOKEN_KEY) ?? undefined;
}

export function getAccessTokenType(): string | undefined {
  if (!isBrowser()) return undefined;
  return window.localStorage.getItem(TOKEN_TYPE_KEY) ?? undefined;
}

export function getRefreshToken(): string | undefined {
  if (!isBrowser()) return undefined;
  return window.localStorage.getItem(REFRESH_TOKEN_KEY) ?? undefined;
}

export function getActiveTenantIdFromSession(): string | undefined {
  if (!isBrowser()) return undefined;
  return window.localStorage.getItem(ACTIVE_TENANT_ID_KEY) ?? undefined;
}

export function getAvailableTenantsFromSession(): TenantAccess[] {
  if (!isBrowser()) return [];
  const raw = window.localStorage.getItem(AVAILABLE_TENANTS_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
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
  } catch {
    return [];
  }
}

export function saveAuthSession(session: AuthSession): void {
  if (!isBrowser()) return;
  window.localStorage.setItem(ACCESS_TOKEN_KEY, session.token);
  window.localStorage.setItem(REFRESH_TOKEN_KEY, session.refreshToken);
  if (session.type) window.localStorage.setItem(TOKEN_TYPE_KEY, session.type);
  if (session.expiresIn != null) window.localStorage.setItem(EXPIRES_IN_KEY, String(session.expiresIn));
  if (session.activeTenantId) {
    window.localStorage.setItem(ACTIVE_TENANT_ID_KEY, session.activeTenantId);
  } else {
    window.localStorage.removeItem(ACTIVE_TENANT_ID_KEY);
  }
  if (session.availableTenants?.length) {
    window.localStorage.setItem(
      AVAILABLE_TENANTS_KEY,
      JSON.stringify(session.availableTenants)
    );
  } else {
    window.localStorage.removeItem(AVAILABLE_TENANTS_KEY);
  }
  notifyAuthSessionUpdated();
}

export function setActiveTenantId(tenantId?: string): void {
  if (!isBrowser()) return;
  if (!tenantId) {
    window.localStorage.removeItem(ACTIVE_TENANT_ID_KEY);
    notifyAuthSessionUpdated();
    return;
  }
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
  clearAuthStorageKeys([
    ACCESS_TOKEN_KEY,
    REFRESH_TOKEN_KEY,
    TOKEN_TYPE_KEY,
    EXPIRES_IN_KEY,
    ACTIVE_TENANT_ID_KEY,
    AVAILABLE_TENANTS_KEY,
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
