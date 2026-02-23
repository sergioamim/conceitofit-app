import type { Tenant } from "@/lib/types";

export interface AuthSession {
  token: string;
  refreshToken: string;
  type?: string;
  expiresIn?: number;
  activeTenantId?: string;
  availableTenants?: Tenant[];
}

const ACCESS_TOKEN_KEY = "academia-auth-token";
const REFRESH_TOKEN_KEY = "academia-auth-refresh-token";
const TOKEN_TYPE_KEY = "academia-auth-token-type";
const EXPIRES_IN_KEY = "academia-auth-expires-in";
const ACTIVE_TENANT_ID_KEY = "academia-auth-active-tenant-id";
const PREFERRED_TENANT_ID_KEY = "academia-auth-preferred-tenant-id";
const MOCK_LOGGED_IN_KEY = "academia-mock-logged-in";

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

export function getAccessToken(): string | undefined {
  if (!isBrowser()) return undefined;
  return window.localStorage.getItem(ACCESS_TOKEN_KEY) ?? undefined;
}

export function getRefreshToken(): string | undefined {
  if (!isBrowser()) return undefined;
  return window.localStorage.getItem(REFRESH_TOKEN_KEY) ?? undefined;
}

export function getActiveTenantIdFromSession(): string | undefined {
  if (!isBrowser()) return undefined;
  return window.localStorage.getItem(ACTIVE_TENANT_ID_KEY) ?? undefined;
}

export function saveAuthSession(session: AuthSession): void {
  if (!isBrowser()) return;
  window.localStorage.setItem(ACCESS_TOKEN_KEY, session.token);
  window.localStorage.setItem(REFRESH_TOKEN_KEY, session.refreshToken);
  if (session.type) window.localStorage.setItem(TOKEN_TYPE_KEY, session.type);
  if (session.expiresIn != null) window.localStorage.setItem(EXPIRES_IN_KEY, String(session.expiresIn));
  if (session.activeTenantId) {
    window.localStorage.setItem(ACTIVE_TENANT_ID_KEY, session.activeTenantId);
  }
}

export function clearAuthSession(): void {
  if (!isBrowser()) return;
  window.localStorage.removeItem(ACCESS_TOKEN_KEY);
  window.localStorage.removeItem(REFRESH_TOKEN_KEY);
  window.localStorage.removeItem(TOKEN_TYPE_KEY);
  window.localStorage.removeItem(EXPIRES_IN_KEY);
  window.localStorage.removeItem(ACTIVE_TENANT_ID_KEY);
  window.localStorage.removeItem(MOCK_LOGGED_IN_KEY);
}

export function isMockSessionActive(): boolean {
  if (!isBrowser()) return false;
  return window.localStorage.getItem(MOCK_LOGGED_IN_KEY) === "1";
}

export function setMockSessionActive(): void {
  if (!isBrowser()) return;
  window.localStorage.setItem(MOCK_LOGGED_IN_KEY, "1");
}

export function getPreferredTenantId(): string | undefined {
  if (!isBrowser()) return undefined;
  return window.localStorage.getItem(PREFERRED_TENANT_ID_KEY) ?? undefined;
}

export function setPreferredTenantId(tenantId: string): void {
  if (!isBrowser()) return;
  window.localStorage.setItem(PREFERRED_TENANT_ID_KEY, tenantId);
}
