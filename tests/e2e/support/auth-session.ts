import type { Page } from "@playwright/test";

export type E2EAvailableTenant = {
  tenantId: string;
  defaultTenant?: boolean;
};

export type E2EAuthSessionSeed = {
  token?: string;
  refreshToken?: string;
  type?: string;
  expiresIn?: number;
  roles?: string[];
  userId?: string;
  userKind?: string;
  displayName?: string;
  networkId?: string;
  networkSubdomain?: string;
  networkSlug?: string;
  networkName?: string;
  activeTenantId?: string;
  preferredTenantId?: string;
  baseTenantId?: string;
  availableTenants?: E2EAvailableTenant[];
  availableScopes?: string[];
  broadAccess?: boolean;
  forcePasswordChangeRequired?: boolean;
  sessionActive?: boolean;
};

export type ResolvedE2EAuthSession = {
  token: string;
  refreshToken: string;
  type: string;
  expiresIn?: number;
  userId?: string;
  userKind?: string;
  displayName?: string;
  networkId?: string;
  networkSubdomain?: string;
  networkSlug?: string;
  networkName?: string;
  activeTenantId?: string;
  preferredTenantId?: string;
  baseTenantId?: string;
  availableTenants: E2EAvailableTenant[];
  availableScopes?: string[];
  broadAccess: boolean;
  forcePasswordChangeRequired: boolean;
  sessionActive: boolean;
};

export const E2E_AUTH_SESSION_STORAGE_KEYS = [
  "academia-auth-token",
  "academia-auth-refresh-token",
  "academia-auth-token-type",
  "academia-auth-expires-in",
  "academia-auth-session-active",
  "academia-auth-user-id",
  "academia-auth-user-kind",
  "academia-auth-display-name",
  "academia-auth-network-id",
  "academia-auth-network-subdomain",
  "academia-auth-network-slug",
  "academia-auth-network-name",
  "academia-auth-active-tenant-id",
  "academia-auth-preferred-tenant-id",
  "academia-auth-base-tenant-id",
  "academia-auth-available-tenants",
  "academia-auth-available-scopes",
  "academia-auth-broad-access",
  "academia-auth-force-password-change-required",
] as const;
const ACTIVE_TENANT_COOKIE_KEY = "academia-active-tenant-id";
const ACCESS_TOKEN_COOKIE_KEY = "academia-access-token";
const SESSION_ACTIVE_COOKIE_KEY = "fc_session_active";
const SESSION_CLAIMS_COOKIE_KEY = "fc_session_claims";
const MIDDLEWARE_ACCESS_TOKEN_COOKIE_KEY = "fc_access_token";
const E2E_BASE_URL = "http://localhost:3000";

function resolveE2EBaseUrl() {
  const configuredBaseUrl = process.env.PLAYWRIGHT_BASE_URL?.trim();
  return configuredBaseUrl && /^https?:\/\//.test(configuredBaseUrl) ? configuredBaseUrl : E2E_BASE_URL;
}

const DEFAULT_TENANT_ID = "tenant-e2e";

function encodeBase64Url(value: string): string {
  return Buffer.from(value, "utf-8")
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function buildUnsignedJwt(seed: {
  roles?: string[];
  userId?: string;
  userKind?: string;
  displayName?: string;
  activeTenantId?: string;
  baseTenantId?: string;
  networkId?: string;
  networkSubdomain?: string;
  networkSlug?: string;
  networkName?: string;
  availableScopes?: string[];
  broadAccess?: boolean;
}): string {
  const header = encodeBase64Url(JSON.stringify({ alg: "none", typ: "JWT" }));
  const payload = encodeBase64Url(
    JSON.stringify({
      sub: seed.userId ?? "user-e2e",
      user_id: seed.userId ?? "user-e2e",
      user_kind: seed.userKind,
      display_name: seed.displayName,
      tenant_id: seed.activeTenantId,
      tenant_base_id: seed.baseTenantId,
      activeTenantId: seed.activeTenantId,
      tenantBaseId: seed.baseTenantId,
      redeId: seed.networkId,
      redeSubdominio: seed.networkSubdomain,
      redeSlug: seed.networkSlug,
      redeNome: seed.networkName,
      roles: seed.roles ?? [],
      availableScopes: seed.availableScopes,
      broadAccess: seed.broadAccess,
    }),
  );
  return `${header}.${payload}.e2e`;
}

function normalizeTenantId(value?: string): string | undefined {
  if (typeof value !== "string") return undefined;
  const normalized = value.trim();
  return normalized || undefined;
}

function normalizeAvailableTenants(
  input: E2EAvailableTenant[] | undefined,
  activeTenantId?: string,
): E2EAvailableTenant[] {
  const source = input?.length
    ? input
    : activeTenantId
      ? [{ tenantId: activeTenantId, defaultTenant: true }]
      : [{ tenantId: DEFAULT_TENANT_ID, defaultTenant: true }];

  const deduped: E2EAvailableTenant[] = [];
  const seen = new Set<string>();

  for (const item of source) {
    const tenantId = normalizeTenantId(item.tenantId);
    if (!tenantId || seen.has(tenantId)) {
      continue;
    }
    seen.add(tenantId);
    deduped.push({
      tenantId,
      defaultTenant: Boolean(item.defaultTenant),
    });
  }

  if (deduped.length === 0) {
    return [{ tenantId: DEFAULT_TENANT_ID, defaultTenant: true }];
  }

  if (!deduped.some((item) => item.defaultTenant)) {
    deduped[0] = { ...deduped[0], defaultTenant: true };
  }

  return deduped;
}

function normalizeAvailableScopes(input?: string[]): string[] | undefined {
  if (!input?.length) return undefined;

  const normalized = input
    .map((scope) => (typeof scope === "string" ? scope.trim().toUpperCase() : ""))
    .filter(Boolean);

  return normalized.length > 0 ? normalized : undefined;
}

function buildSessionClaims(session: ResolvedE2EAuthSession) {
  return {
    userId: session.userId,
    userKind: session.userKind,
    displayName: session.displayName,
    networkId: session.networkId,
    networkSubdomain: session.networkSubdomain ?? session.networkSlug,
    networkSlug: session.networkSlug ?? session.networkSubdomain,
    networkName: session.networkName,
    activeTenantId: session.activeTenantId,
    baseTenantId: session.baseTenantId,
    availableScopes: session.availableScopes,
    broadAccess: session.broadAccess,
    forcePasswordChangeRequired: session.forcePasswordChangeRequired,
  };
}

function buildContextCookies(session: ResolvedE2EAuthSession) {
  const url = resolveE2EBaseUrl();
  const cookies = [
    {
      name: SESSION_ACTIVE_COOKIE_KEY,
      value: session.sessionActive ? "true" : "false",
      url,
    },
    {
      name: MIDDLEWARE_ACCESS_TOKEN_COOKIE_KEY,
      value: session.token,
      url,
    },
    {
      name: SESSION_CLAIMS_COOKIE_KEY,
      value: encodeURIComponent(JSON.stringify(buildSessionClaims(session))),
      url,
    },
    {
      name: ACCESS_TOKEN_COOKIE_KEY,
      value: session.token,
      url,
    },
  ];

  if (!session.activeTenantId) {
    return cookies;
  }

  return [
    {
      name: ACTIVE_TENANT_COOKIE_KEY,
      value: session.activeTenantId,
      url,
    },
    ...cookies,
  ];
}

export function buildE2EAuthSession(seed: E2EAuthSessionSeed = {}): ResolvedE2EAuthSession {
  const availableTenants = normalizeAvailableTenants(seed.availableTenants, seed.activeTenantId);
  const defaultTenantId =
    availableTenants.find((item) => item.defaultTenant)?.tenantId ?? availableTenants[0]?.tenantId;
  const activeTenantId = normalizeTenantId(seed.activeTenantId) ?? defaultTenantId;
  const baseTenantId = normalizeTenantId(seed.baseTenantId) ?? activeTenantId;
  const displayName = seed.displayName?.trim() || undefined;
  const userId = normalizeTenantId(seed.userId);
  const userKind = seed.userKind?.trim() || undefined;
  const token =
    seed.token?.trim()
    || (seed.roles?.length
      ? buildUnsignedJwt({
          roles: seed.roles,
          userId,
          userKind,
          displayName,
          activeTenantId,
          baseTenantId,
          networkId: seed.networkId?.trim(),
          networkSubdomain: seed.networkSubdomain?.trim(),
          networkSlug: seed.networkSlug?.trim(),
          networkName: seed.networkName?.trim(),
          availableScopes: normalizeAvailableScopes(seed.availableScopes),
          broadAccess: seed.broadAccess,
        })
      : "token-e2e");

  return {
    token,
    refreshToken: seed.refreshToken?.trim() || "refresh-e2e",
    type: seed.type?.trim() || "Bearer",
    expiresIn: seed.expiresIn,
    userId,
    userKind,
    displayName,
    networkId: normalizeTenantId(seed.networkId),
    networkSubdomain: seed.networkSubdomain?.trim() || seed.networkSlug?.trim() || undefined,
    networkSlug: seed.networkSlug?.trim() || seed.networkSubdomain?.trim() || undefined,
    networkName: seed.networkName?.trim() || undefined,
    activeTenantId,
    preferredTenantId: normalizeTenantId(seed.preferredTenantId) ?? activeTenantId,
    baseTenantId,
    availableTenants,
    availableScopes: normalizeAvailableScopes(seed.availableScopes),
    broadAccess: Boolean(seed.broadAccess),
    forcePasswordChangeRequired: Boolean(seed.forcePasswordChangeRequired),
    sessionActive: seed.sessionActive ?? true,
  };
}

function writeE2EAuthSessionInBrowser(session: ResolvedE2EAuthSession): void {
  const activeTenantCookieKey = "academia-active-tenant-id";
  const accessTokenCookieKey = "academia-access-token";
  const sessionActiveCookieKey = "fc_session_active";
  const sessionClaimsCookieKey = "fc_session_claims";
  const middlewareAccessTokenCookieKey = "fc_access_token";
  const sessionClaims = {
    userId: session.userId,
    userKind: session.userKind,
    displayName: session.displayName,
    networkId: session.networkId,
    networkSubdomain: session.networkSubdomain ?? session.networkSlug,
    networkSlug: session.networkSlug ?? session.networkSubdomain,
    networkName: session.networkName,
    activeTenantId: session.activeTenantId,
    baseTenantId: session.baseTenantId,
    availableScopes: session.availableScopes,
    broadAccess: session.broadAccess,
    forcePasswordChangeRequired: session.forcePasswordChangeRequired,
  };
  const storage = window.localStorage;
  const setStorageValue = (key: string, value?: string) => {
    if (!value) {
      storage.removeItem(key);
      return;
    }
    storage.setItem(key, value);
  };
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  const writeCookie = (name: string, value?: string) => {
    if (!value) {
      document.cookie = `${name}=; Path=/; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax${secure}`;
      return;
    }
    document.cookie = `${name}=${encodeURIComponent(value)}; Path=/; SameSite=Lax${secure}`;
  };

  setStorageValue("academia-auth-token", session.token);
  setStorageValue("academia-auth-refresh-token", session.refreshToken);
  setStorageValue("academia-auth-token-type", session.type);
  setStorageValue(
    "academia-auth-expires-in",
    typeof session.expiresIn === "number" ? String(session.expiresIn) : undefined,
  );
  setStorageValue(
    "academia-auth-session-active",
    session.sessionActive ? "true" : undefined,
  );
  setStorageValue("academia-auth-user-id", session.userId);
  setStorageValue("academia-auth-user-kind", session.userKind);
  setStorageValue("academia-auth-display-name", session.displayName);
  setStorageValue("academia-auth-network-id", session.networkId);
  setStorageValue(
    "academia-auth-network-subdomain",
    session.networkSubdomain ?? session.networkSlug,
  );
  setStorageValue(
    "academia-auth-network-slug",
    session.networkSlug ?? session.networkSubdomain,
  );
  setStorageValue("academia-auth-network-name", session.networkName);
  setStorageValue("academia-auth-active-tenant-id", session.activeTenantId);
  writeCookie(activeTenantCookieKey, session.activeTenantId);
  writeCookie(accessTokenCookieKey, session.token);
  writeCookie(sessionActiveCookieKey, session.sessionActive ? "true" : undefined);
  writeCookie(middlewareAccessTokenCookieKey, session.token);
  writeCookie(sessionClaimsCookieKey, JSON.stringify(sessionClaims));
  setStorageValue("academia-auth-preferred-tenant-id", session.preferredTenantId);
  setStorageValue("academia-auth-base-tenant-id", session.baseTenantId);
  setStorageValue(
    "academia-auth-available-tenants",
    session.availableTenants.length ? JSON.stringify(session.availableTenants) : undefined,
  );
  setStorageValue(
    "academia-auth-available-scopes",
    session.availableScopes?.length ? JSON.stringify(session.availableScopes) : undefined,
  );
  storage.setItem("academia-auth-broad-access", session.broadAccess ? "true" : "false");
  storage.setItem(
    "academia-auth-force-password-change-required",
    session.forcePasswordChangeRequired ? "true" : "false",
  );

  window.dispatchEvent(new Event("academia-session-updated"));
}

/**
 * Contrato canônico de sessão E2E:
 * - Obrigatórios para qualquer shell protegido: token, refreshToken, type e academia-auth-session-active.
 * - Obrigatórios para fluxo tenant-aware: activeTenantId, preferredTenantId e availableTenants.
 * - Condicionais por tela/módulo: baseTenantId, userId, userKind, displayName, availableScopes e broadAccess.
 * - Condicionais por rede/login especial: networkId, networkSubdomain/networkSlug e networkName.
 */
export async function installE2EAuthSession(
  page: Page,
  seed: E2EAuthSessionSeed = {},
): Promise<ResolvedE2EAuthSession> {
  const session = buildE2EAuthSession(seed);
  await page.context().addCookies(buildContextCookies(session));
  await page.addInitScript(writeE2EAuthSessionInBrowser, session);
  return session;
}

export async function applyE2EAuthSession(
  page: Page,
  seed: E2EAuthSessionSeed = {},
): Promise<ResolvedE2EAuthSession> {
  const session = buildE2EAuthSession(seed);
  await page.context().addCookies(buildContextCookies(session));
  await page.evaluate(writeE2EAuthSessionInBrowser, session);
  return session;
}

export async function clearE2EAuthSession(page: Page): Promise<void> {
  await page.context().clearCookies();
  await page.evaluate((keys) => {
    keys.forEach((key) => window.localStorage.removeItem(key));
    document.cookie = "academia-active-tenant-id=; Path=/; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax";
    document.cookie = "academia-access-token=; Path=/; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax";
    document.cookie = "fc_session_active=; Path=/; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax";
    document.cookie = "fc_session_claims=; Path=/; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax";
    document.cookie = "fc_access_token=; Path=/; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax";
    window.dispatchEvent(new Event("academia-session-updated"));
  }, [...E2E_AUTH_SESSION_STORAGE_KEYS]);
}
