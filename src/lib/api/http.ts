import {
  clearAuthSession,
  getAccessToken,
  getAccessTokenType,
  getActiveTenantIdFromSession,
  getAvailableTenantsFromSession,
  getPreferredTenantId,
  getRefreshToken,
  saveAuthSession,
  setActiveTenantId,
} from "./session";

export interface ApiErrorPayload {
  timestamp?: string;
  status?: number;
  error?: string;
  message?: string;
  path?: string;
  fieldErrors?: Record<string, string> | null;
  responseBody?: string;
  contextId?: string;
  requestId?: string;
}

export interface ApiResponseWithMeta<T> {
  data: T;
  headers: Record<string, string>;
}

export class ApiRequestError extends Error {
  public readonly status: number;
  public readonly error?: string;
  public readonly path?: string;
  public readonly fieldErrors?: Record<string, string> | null;
  public readonly responseBody?: string;
  public readonly contextId?: string;
  public readonly requestId?: string;

  constructor(payload: ApiErrorPayload & { statusCode?: number }) {
    const status = payload.status ?? payload.statusCode ?? 500;
    const message =
      payload.message || payload.error || `HTTP ${status}`;
    super(message);
    this.name = "ApiRequestError";
    this.status = status;
    this.error = payload.error;
    this.path = payload.path;
    this.fieldErrors = payload.fieldErrors;
    this.responseBody = payload.responseBody;
    this.contextId = payload.contextId;
    this.requestId = payload.requestId;
  }
}

const CONTEXT_STORAGE_KEY = "academia-api-context-id";
const AUTH_REFRESH_PATH = "/api/v1/auth/refresh";
const AUTH_LOGIN_PATH = "/api/v1/auth/login";
const TENANT_CONTEXT_SYNC_PATH = "/api/v1/context/unidade-ativa";
// Tenant context error messages are centralised in error-codes.ts.
// Local aliases kept to avoid changing the rest of this file.
const TENANT_CONTEXT_MISMATCH_MESSAGE = "tenantid diverge da unidade ativa do contexto informado";
const TENANT_CONTEXT_MISSING_MESSAGE = "x-context-id sem unidade ativa";
// Rotas operacionais usam a unidade ativa do X-Context-Id no browser.
const CONTEXT_SCOPED_OPERATIONAL_PATTERNS = [
  /^\/api\/v1\/comercial(?:\/|$)/,
  /^\/api\/v1\/crm(?:\/|$)/,
  /^\/api\/v1\/agenda\/aulas(?:\/|$)/,
  // Só rotas administrativas operacionais já auditadas seguem o contexto ativo.
  /^\/api\/v1\/administrativo\/(?:cargos|funcionarios|salas|atividades(?:-grade)?)(?:\/|$)/,
  /^\/api\/v1\/gerencial\/financeiro\/(?!formas-pagamento(?:\/|$)|tipos-conta-pagar(?:\/|$))/,
];

// Rotas globais e catálogos ainda exigem tenantId explícito mesmo com sessão carregada.
const EXPLICIT_TENANT_QUERY_PATTERNS = [
  /^\/api\/v1\/academia(?:\/|$)/,
  /^\/api\/v1\/dashboard(?:\/|$)/,
  /^\/api\/v1\/gerencial\/financeiro\/(?:formas-pagamento|tipos-conta-pagar)(?:\/|$)/,
];

interface AuthTenantAccessPayload {
  tenantId?: string;
  defaultTenant?: boolean;
}

interface AuthSessionPayload {
  token: string;
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

function getContextId(): string | undefined {
  if (typeof window === "undefined") return undefined;
  try {
    const existing = window.localStorage.getItem(CONTEXT_STORAGE_KEY);
    if (existing) return existing;

    const generated =
      typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
        ? crypto.randomUUID()
        : undefined;
    if (generated) {
      window.localStorage.setItem(CONTEXT_STORAGE_KEY, generated);
    }
    return generated;
  } catch {
    return undefined;
  }
}

/** Gera um UUID único por request para correlação frontend↔backend. */
function generateRequestId(): string | undefined {
  try {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
      return crypto.randomUUID();
    }
  } catch { /* fallback */ }
  return undefined;
}

export function buildApiUrl(path: string, query?: Record<string, string | number | boolean | undefined>): string {
  const baseUrl = normalizeBaseUrl(process.env.NEXT_PUBLIC_API_BASE_URL);
  const pathname = path.startsWith("/") ? path : `/${path}`;
  const url = new URL(`${baseUrl}${pathname}`, baseUrl ? undefined : "http://localhost");
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value == null) continue;
      if (typeof value === "string" && value.trim() === "") continue;
      url.searchParams.set(key, String(value));
    }
  }
  if (!baseUrl) {
    return `${url.pathname}${url.search}`;
  }
  return `${url.pathname}${url.search}`.startsWith("http")
    ? `${url.pathname}${url.search}`
    : `${baseUrl}${url.pathname}${url.search}`;
}

function resolveRequestUrl(path: string, query?: Record<string, string | number | boolean | undefined>): string {
  const baseUrl = normalizeBaseUrl(process.env.NEXT_PUBLIC_API_BASE_URL);
  const pathname = path.startsWith("/") ? path : `/${path}`;
  const qs = new URLSearchParams();
  if (query) {
    for (const [key, value] of Object.entries(query)) {
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

function isContextScopedOperationalRoute(path: string): boolean {
  return CONTEXT_SCOPED_OPERATIONAL_PATTERNS.some((pattern) => pattern.test(path));
}

function routeRequiresExplicitTenantQuery(path: string): boolean {
  return EXPLICIT_TENANT_QUERY_PATTERNS.some((pattern) => pattern.test(path));
}

function shouldStripTenantIdFromQuery(path: string, hasContextHeader: boolean): boolean {
  return hasContextHeader && isContextScopedOperationalRoute(path);
}

function routeRequiresTenantQuery(path: string, hasContextHeader: boolean): boolean {
  if (shouldStripTenantIdFromQuery(path, hasContextHeader)) {
    return false;
  }
  return isContextScopedOperationalRoute(path) || routeRequiresExplicitTenantQuery(path);
}

function extractTenantIdFromQuery(
  query?: Record<string, string | number | boolean | undefined>
): string | undefined {
  const tenantId = query?.tenantId;
  if (typeof tenantId !== "string") return undefined;
  const normalized = tenantId.trim();
  return normalized || undefined;
}

function resolveTenantFallback(allowedTenants: string[]): string | undefined {
  const activeTenant = getActiveTenantIdFromSession()?.trim();
  if (activeTenant && (allowedTenants.length === 0 || allowedTenants.includes(activeTenant))) {
    return activeTenant;
  }

  const preferredTenant = getPreferredTenantId()?.trim();
  if (preferredTenant && (allowedTenants.length === 0 || allowedTenants.includes(preferredTenant))) {
    return preferredTenant;
  }

  return allowedTenants[0];
}

function resolveTenantIdForContextSync(
  inputQuery?: Record<string, string | number | boolean | undefined>,
  normalizedQuery?: Record<string, string | number | boolean | undefined>
): string | undefined {
  const explicitTenant = extractTenantIdFromQuery(inputQuery);
  if (explicitTenant) return explicitTenant;

  const normalizedTenant = extractTenantIdFromQuery(normalizedQuery);
  if (normalizedTenant) return normalizedTenant;

  const allowedTenants = getAvailableTenantsFromSession()
    .map((item) => item.tenantId.trim())
    .filter(Boolean);
  return resolveTenantFallback(allowedTenants);
}

function normalizeTenantQuery(
  path: string,
  query?: Record<string, string | number | boolean | undefined>,
  options?: {
    hasContextHeader?: boolean;
  }
): Record<string, string | number | boolean | undefined> | undefined {
  const normalized = query ? { ...query } : {};
  const hasContextHeader = options?.hasContextHeader ?? false;
  const requestedTenant =
    typeof normalized.tenantId === "string" ? normalized.tenantId.trim() : undefined;

  const allowedTenants = getAvailableTenantsFromSession()
    .map((item) => item.tenantId.trim())
    .filter(Boolean);
  const fallbackTenant = resolveTenantFallback(allowedTenants);

  if (shouldStripTenantIdFromQuery(path, hasContextHeader)) {
    delete normalized.tenantId;
  } else if (requestedTenant) {
    normalized.tenantId = requestedTenant;
  } else if (routeRequiresTenantQuery(path, hasContextHeader) && fallbackTenant) {
    normalized.tenantId = fallbackTenant;
  }

  for (const [key, value] of Object.entries(normalized)) {
    if (value == null) {
      delete normalized[key];
      continue;
    }
    if (typeof value === "string" && value.trim() === "") {
      delete normalized[key];
    }
  }

  return Object.keys(normalized).length > 0 ? normalized : undefined;
}

function isJsonContentType(response: Response): boolean {
  const contentType = response.headers.get("content-type")?.toLowerCase() ?? "";
  return contentType.includes("application/json") || contentType.includes("+json");
}

async function readResponseBody(response: Response): Promise<{
  rawBody?: string;
  parsedBody?: unknown;
}> {
  if (response.status === 204 || response.status === 205) {
    return {};
  }

  let rawBody: string;
  try {
    rawBody = await response.text();
  } catch {
    return {};
  }

  if (!rawBody.trim()) {
    return {};
  }

  if (isJsonContentType(response)) {
    try {
      return {
        rawBody,
        parsedBody: JSON.parse(rawBody),
      };
    } catch {
      return {
        rawBody,
        parsedBody: rawBody,
      };
    }
  }

  try {
    return {
      rawBody,
      parsedBody: JSON.parse(rawBody),
    };
  } catch {
    return {
      rawBody,
      parsedBody: rawBody,
    };
  }
}

function normalizeFieldErrors(input: unknown): Record<string, string> | null | undefined {
  if (!input) return undefined;

  if (Array.isArray(input)) {
    const pairs = input
      .map((item) => {
        if (!item || typeof item !== "object") return null;
        const candidate = item as { field?: unknown; message?: unknown };
        return typeof candidate.field === "string" && typeof candidate.message === "string"
          ? [candidate.field, candidate.message]
          : null;
      })
      .filter((entry): entry is [string, string] => entry !== null);
    return pairs.length > 0 ? Object.fromEntries(pairs) : undefined;
  }

  if (typeof input !== "object") return undefined;

  const entries = Object.entries(input as Record<string, unknown>)
    .map(([field, message]) => (typeof message === "string" ? [field, message] : null))
    .filter((entry): entry is [string, string] => entry !== null);

  return entries.length > 0 ? Object.fromEntries(entries) : undefined;
}

function normalizeApiErrorPayload(input: unknown): ApiErrorPayload | undefined {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return undefined;
  }

  const candidate = input as Record<string, unknown>;
  const message =
    typeof candidate.message === "string"
      ? candidate.message
      : typeof candidate.details === "string"
        ? candidate.details
        : undefined;
  const error =
    typeof candidate.error === "string"
      ? candidate.error
      : typeof candidate.code === "string"
        ? candidate.code
        : undefined;
  const status = typeof candidate.status === "number" ? candidate.status : undefined;
  const path = typeof candidate.path === "string" ? candidate.path : undefined;
  const timestamp = typeof candidate.timestamp === "string" ? candidate.timestamp : undefined;
  const responseBody =
    typeof candidate.responseBody === "string" ? candidate.responseBody : undefined;
  const fieldErrors = normalizeFieldErrors(candidate.fieldErrors);

  if (
    message == null &&
    error == null &&
    status == null &&
    path == null &&
    timestamp == null &&
    fieldErrors == null &&
    responseBody == null
  ) {
    return undefined;
  }

  return {
    timestamp,
    status,
    error,
    message,
    path,
    fieldErrors,
    responseBody,
  };
}

function normalizeResponseHeaders(headers: Headers): Record<string, string> {
  const normalized: Record<string, string> = {};
  headers.forEach((value, key) => {
    normalized[key.toLowerCase()] = value;
  });
  return normalized;
}

function isTenantContextSyncError(
  response: Response,
  payload: ApiErrorPayload | undefined,
  parsedBody: unknown
): boolean {
  if (response.status !== 400) return false;

  const messages = [
    payload?.message,
    payload?.error,
    typeof parsedBody === "string" ? parsedBody : undefined,
    typeof payload?.responseBody === "string" ? payload.responseBody : undefined,
  ]
    .filter((value): value is string => typeof value === "string" && value.trim().length > 0)
    .map((value) => value.toLowerCase());

  return messages.some(
    (value) =>
      value.includes(TENANT_CONTEXT_MISMATCH_MESSAGE.toLowerCase()) ||
      value.includes(TENANT_CONTEXT_MISSING_MESSAGE)
  );
}

async function syncTenantContext(
  tenantId: string,
  headers: Record<string, string>
): Promise<boolean> {
  const syncHeaders: Record<string, string> = {
    Accept: "application/json",
  };
  if (headers.Authorization) {
    syncHeaders.Authorization = headers.Authorization;
  }
  if (headers["X-Context-Id"]) {
    syncHeaders["X-Context-Id"] = headers["X-Context-Id"];
  }

  const response = await fetch(resolveRequestUrl(`${TENANT_CONTEXT_SYNC_PATH}/${tenantId}`), {
    method: "PUT",
    headers: syncHeaders,
  });

  return response.ok;
}

function normalizeAuthTenantAccess(
  input?: AuthTenantAccessPayload[]
): { tenantId: string; defaultTenant: boolean }[] | undefined {
  if (!input) return undefined;

  return input
    .map((item) => {
      const tenantId = typeof item.tenantId === "string" ? item.tenantId.trim() : "";
      if (!tenantId) return null;
      return {
        tenantId,
        defaultTenant: Boolean(item.defaultTenant),
      };
    })
    .filter((item): item is { tenantId: string; defaultTenant: boolean } => item !== null);
}

function persistAuthSessionFromPayload(
  payload: AuthSessionPayload,
  options?: {
    fallbackRefreshToken?: string;
    preserveTenantContext?: boolean;
  }
): { token: string; type: string } {
  const nextType = payload.type ?? getAccessTokenType() ?? "Bearer";
  const nextAvailableTenants =
    normalizeAuthTenantAccess(payload.availableTenants) ??
    (options?.preserveTenantContext ? getAvailableTenantsFromSession() : undefined);
  const nextActiveTenantId =
    payload.activeTenantId ??
    (options?.preserveTenantContext ? getActiveTenantIdFromSession() : undefined);

  saveAuthSession({
    token: payload.token,
    refreshToken:
      payload.refreshToken ?? options?.fallbackRefreshToken ?? getRefreshToken() ?? "",
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

  return {
    token: payload.token,
    type: nextType,
  };
}

async function performApiRequest<T>(input: {
  path: string;
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  query?: Record<string, string | number | boolean | undefined>;
  body?: unknown;
  includeContextHeader?: boolean;
  headers?: Record<string, string>;
  retryOnAuthFailure?: boolean;
}): Promise<ApiResponseWithMeta<T>> {
  const method = input.method ?? "GET";
  const retryOnAuthFailure = input.retryOnAuthFailure ?? true;
  const isFormData =
    typeof FormData !== "undefined" && input.body instanceof FormData;
  const headers: Record<string, string> = {
    Accept: "application/json",
  };
  if (input.headers) {
    for (const [key, value] of Object.entries(input.headers)) {
      headers[key] = value;
    }
  }
  if (input.body != null && !isFormData) {
    headers["Content-Type"] = "application/json";
  }
  const contextId =
    input.includeContextHeader !== false
      ? getContextId()
      : undefined;
  if (contextId) {
    headers["X-Context-Id"] = contextId;
  }
  const requestId = generateRequestId();
  if (requestId) {
    headers["X-Request-Id"] = requestId;
  }
  const token = getAccessToken();
  if (token) {
    headers["Authorization"] = `${getAccessTokenType() ?? "Bearer"} ${token}`;
  }

  const isAuthEndpoint = input.path.startsWith("/api/v1/auth/");
  if (!token && !isAuthEndpoint) {
    const loginToken = await tryAutoLogin();
    if (loginToken) {
      headers["Authorization"] = `${loginToken.type} ${loginToken.token}`;
    }
  }

  const normalizedQuery = normalizeTenantQuery(input.path, input.query, {
    hasContextHeader: Boolean(contextId),
  });
  const requestUrl = resolveRequestUrl(input.path, normalizedQuery);
  const requestBody =
    input.body == null
      ? undefined
      : isFormData
        ? (input.body as unknown as BodyInit)
        : (JSON.stringify(input.body) as unknown as BodyInit);
  const tenantIdForContextSync = resolveTenantIdForContextSync(
    input.query,
    normalizedQuery
  );

  const executeRequest = async (retriedAfterRefresh = false): Promise<Response> => {
    const response = await fetch(requestUrl, {
      method,
      headers,
      body: requestBody,
    });

    if (
      response.status === 401 &&
      retryOnAuthFailure &&
      !isAuthEndpoint &&
      !retriedAfterRefresh
    ) {
      const refreshToken = getRefreshToken();
      if (refreshToken) {
        const refreshed = await tryRefreshToken(refreshToken);
        if (refreshed) {
          headers.Authorization = `${refreshed.type} ${refreshed.token}`;
          const retriedResponse = await fetch(requestUrl, {
            method,
            headers,
            body: requestBody,
          });
          if (retriedResponse.status === 401) {
            clearAuthSession();
          }
          return retriedResponse;
        }
      }
      clearAuthSession();
      return response;
    }

    return response;
  };

  let response = await executeRequest();

  if (!response.ok) {
    let { rawBody, parsedBody } = await readResponseBody(response);
    let payload = normalizeApiErrorPayload(parsedBody);

    if (
      tenantIdForContextSync &&
      isTenantContextSyncError(response, payload, parsedBody) &&
      (await syncTenantContext(tenantIdForContextSync, headers))
    ) {
      setActiveTenantId(tenantIdForContextSync);
      response = await executeRequest();
      if (response.ok) {
        const { parsedBody: retriedBody } = await readResponseBody(response);
        return {
          data: retriedBody as T,
          headers: normalizeResponseHeaders(response.headers),
        };
      }
      ({ rawBody, parsedBody } = await readResponseBody(response));
      payload = normalizeApiErrorPayload(parsedBody);
    }

    const details: ApiErrorPayload & { statusCode?: number } = {
      statusCode: response.status,
      message:
        payload?.message ??
        (typeof parsedBody === "string" ? parsedBody.trim() : undefined) ??
        payload?.error ??
        response.statusText ??
        `HTTP ${response.status}`,
      error: payload?.error,
      path: payload?.path ?? input.path,
      responseBody: rawBody ?? payload?.responseBody,
      fieldErrors: payload?.fieldErrors,
      contextId: response.headers.get("X-Context-Id") ?? headers["X-Context-Id"],
      requestId: response.headers.get("X-Request-Id") ?? headers["X-Request-Id"],
    };
    throw new ApiRequestError(details);
  }

  const { parsedBody } = await readResponseBody(response);
  return {
    data: parsedBody as T,
    headers: normalizeResponseHeaders(response.headers),
  };
}

export async function apiRequest<T>(input: {
  path: string;
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  query?: Record<string, string | number | boolean | undefined>;
  body?: unknown;
  includeContextHeader?: boolean;
  headers?: Record<string, string>;
  retryOnAuthFailure?: boolean;
}): Promise<T> {
  const response = await performApiRequest<T>(input);
  return response.data;
}

export async function apiRequestWithMeta<T>(input: {
  path: string;
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  query?: Record<string, string | number | boolean | undefined>;
  body?: unknown;
  includeContextHeader?: boolean;
  headers?: Record<string, string>;
  retryOnAuthFailure?: boolean;
}): Promise<ApiResponseWithMeta<T>> {
  return performApiRequest<T>(input);
}

let refreshInFlight: Promise<{ token: string; type: string } | undefined> | null = null;
let autoLoginInFlight: Promise<{ token: string; type: string } | undefined> | null = null;

async function tryRefreshToken(
  refreshToken: string
): Promise<{ token: string; type: string } | undefined> {
  if (refreshInFlight) {
    return refreshInFlight;
  }
  refreshInFlight = (async () => {
    const response = await fetch(resolveRequestUrl(AUTH_REFRESH_PATH), {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ refreshToken }),
    });
    if (!response.ok) {
      clearAuthSession();
      return undefined;
    }
    const payload = (await response.json()) as AuthSessionPayload;
    return persistAuthSessionFromPayload(payload, {
      fallbackRefreshToken: refreshToken,
      preserveTenantContext: true,
    });
  })();
  try {
    return await refreshInFlight;
  } finally {
    refreshInFlight = null;
  }
}

async function tryAutoLogin(): Promise<{ token: string; type: string } | undefined> {
  if (autoLoginInFlight) {
    return autoLoginInFlight;
  }
  if (process.env.NODE_ENV !== "development") {
    return undefined;
  }
  if (process.env.NEXT_PUBLIC_DEV_AUTO_LOGIN === "false") {
    return undefined;
  }
  const email = process.env.NEXT_PUBLIC_DEV_AUTH_EMAIL;
  const password = process.env.NEXT_PUBLIC_DEV_AUTH_PASSWORD;
  if (!email || !password) {
    return undefined;
  }
  autoLoginInFlight = (async () => {
    const response = await fetch(resolveRequestUrl(AUTH_LOGIN_PATH), {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });
    if (!response.ok) return undefined;
    const payload = (await response.json()) as AuthSessionPayload;
    return persistAuthSessionFromPayload(payload, {
      preserveTenantContext: true,
    });
  })();
  try {
    return await autoLoginInFlight;
  } finally {
    autoLoginInFlight = null;
  }
}
