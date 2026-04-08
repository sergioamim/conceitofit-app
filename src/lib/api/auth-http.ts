/**
 * Auth HTTP — refresh token e auto-login development.
 */

import {
  clearAuthSession,
  getAccessTokenType,
  getAvailableTenantsFromSession,
  getActiveTenantIdFromSession,
  getPreferredTenantId,
  getRefreshToken,
  saveAuthSession,
  getFetchCredentials,
} from "./session";

const AUTH_REFRESH_PATH = "/api/v1/auth/refresh";
const AUTH_LOGIN_PATH = "/api/v1/auth/login";

interface AuthTenantAccessPayload {
  tenantId?: string;
  defaultTenant?: boolean;
}

interface AuthSessionPayload {
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
  availableTenants?: AuthTenantAccessPayload[];
  availableScopes?: string[];
  broadAccess?: boolean;
}

function normalizeBaseUrl(value: string | undefined): string {
  const raw = (value ?? "").trim();
  if (!raw) return "";
  return raw.endsWith("/") ? raw.slice(0, -1) : raw;
}

function resolveRequestUrl(path: string, _query?: Record<string, string | number | boolean | undefined>): string {
  const baseUrl = normalizeBaseUrl(process.env.NEXT_PUBLIC_API_BASE_URL);
  const pathname = path.startsWith("/") ? path : `/${path}`;
  const qs = new URLSearchParams();
  if (_query) {
    for (const [key, value] of Object.entries(_query)) {
      if (value == null) continue;
      if (typeof value === "string" && value.trim() === "") continue;
      qs.set(key, String(value));
    }
  }
  const suffix = qs.toString() ? `?${qs.toString()}` : "";
  const shouldUseProxy = typeof window !== "undefined";
  if (shouldUseProxy) {
    return `/backend${pathname}${suffix}`;
  }
  return baseUrl ? `${baseUrl}${pathname}${suffix}` : `${pathname}${suffix}`;
}

function normalizeAuthTenantAccess(
  input?: AuthTenantAccessPayload[]
): { tenantId: string; defaultTenant: boolean }[] | undefined {
  if (!input) return undefined;
  return input
    .map((item) => {
      const tenantId = typeof item.tenantId === "string" ? item.tenantId.trim() : "";
      if (!tenantId) return null;
      return { tenantId, defaultTenant: Boolean(item.defaultTenant) };
    })
    .filter((item): item is { tenantId: string; defaultTenant: boolean } => item !== null);
}

export function persistAuthSessionFromPayload(
  payload: AuthSessionPayload,
  options?: { fallbackRefreshToken?: string; preserveTenantContext?: boolean }
): { token?: string; type: string } {
  const nextType = payload.type ?? getAccessTokenType() ?? "Bearer";
  const nextAvailableTenants =
    normalizeAuthTenantAccess(payload.availableTenants) ??
    (options?.preserveTenantContext ? getAvailableTenantsFromSession() : undefined);
  const nextActiveTenantId =
    payload.activeTenantId ??
    (options?.preserveTenantContext ? getActiveTenantIdFromSession() : undefined);

  saveAuthSession({
    token: payload.token,
    refreshToken: payload.refreshToken ?? options?.fallbackRefreshToken ?? getRefreshToken() ?? "",
    type: nextType,
    expiresIn: payload.expiresIn,
    userId: payload.userId,
    userKind: payload.userKind,
    displayName: payload.displayName,
    networkId: payload.redeId,
    networkSubdomain: payload.redeSubdominio ?? payload.redeSlug,
    networkSlug: payload.redeSlug,
    networkName: payload.redeNome,
    activeTenantId: nextActiveTenantId,
    baseTenantId: payload.tenantBaseId,
    availableTenants: nextAvailableTenants,
    availableScopes: Array.isArray(payload.availableScopes)
      ? payload.availableScopes
          .map((item) => item.trim().toUpperCase())
          .filter((item): item is "UNIDADE" | "REDE" | "GLOBAL" => item === "UNIDADE" || item === "REDE" || item === "GLOBAL")
      : undefined,
    broadAccess: payload.broadAccess,
  });

  return { token: payload.token, type: nextType };
}

async function readResponseBody(response: Response): Promise<{ rawBody?: string; parsedBody?: unknown }> {
  if (response.status === 204 || response.status === 205) return {};
  let rawBody: string;
  try { rawBody = await response.text(); } catch { return {}; }
  if (!rawBody.trim()) return {};
  try { return { rawBody, parsedBody: JSON.parse(rawBody) }; } catch { return { rawBody, parsedBody: rawBody }; }
}

let refreshInFlight: Promise<{ token?: string; type: string } | undefined> | null = null;

export async function tryRefreshToken(
  refreshToken?: string
): Promise<{ token?: string; type: string } | undefined> {
  if (refreshInFlight) return refreshInFlight;
  refreshInFlight = (async () => {
    const response = await fetch(resolveRequestUrl(AUTH_REFRESH_PATH), {
      method: "POST",
      headers: { Accept: "application/json", "Content-Type": "application/json" },
      body: refreshToken ? JSON.stringify({ refreshToken }) : undefined,
      credentials: getFetchCredentials(),
    });
    if (!response.ok) { clearAuthSession(); return undefined; }
    const { parsedBody } = await readResponseBody(response);
    const payload = ((parsedBody && typeof parsedBody === "object") ? parsedBody : {}) as AuthSessionPayload;
    return persistAuthSessionFromPayload(payload, {
      fallbackRefreshToken: refreshToken,
      preserveTenantContext: true,
    });
  })();
  try { return await refreshInFlight; } finally { refreshInFlight = null; }
}

let autoLoginInFlight: Promise<{ token?: string; type: string } | undefined> | null = null;

export async function tryAutoLogin(): Promise<{ token?: string; type: string } | undefined> {
  if (autoLoginInFlight) return autoLoginInFlight;
  if (process.env.NODE_ENV !== "development") return undefined;
  if (process.env.NEXT_PUBLIC_DEV_AUTO_LOGIN === "false") return undefined;
  const email = process.env.NEXT_PUBLIC_DEV_AUTH_EMAIL;
  const password = process.env.NEXT_PUBLIC_DEV_AUTH_PASSWORD;
  if (!email || !password) return undefined;
  autoLoginInFlight = (async () => {
    const response = await fetch(resolveRequestUrl(AUTH_LOGIN_PATH), {
      method: "POST",
      headers: { Accept: "application/json", "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
      credentials: getFetchCredentials(),
    });
    if (!response.ok) return undefined;
    const payload = (await response.json()) as AuthSessionPayload;
    return persistAuthSessionFromPayload(payload, { preserveTenantContext: true });
  })();
  try { return await autoLoginInFlight; } finally { autoLoginInFlight = null; }
}
