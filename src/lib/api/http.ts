/**
 * HTTP Client — módulo principal da API.
 *
 * Delega para sub-módulos especializados:
 * - csrf.ts: leitura/injeção de CSRF token
 * - auth-http.ts: refresh token, auto-login dev
 * - tenant.ts: resolução e sync de tenant context
 * - metrics.ts: tracking de performance + correlation ID
 */

import {
  getAccessToken,
  getAccessTokenType,
  getFetchCredentials,
  getRefreshToken,
  shouldInjectAuthHeader,
} from "./session";
import { captureApiError } from "@/lib/shared/sentry";
import { readCsrfToken } from "./csrf";
import { tryAutoLogin, tryRefreshToken } from "./auth-http";
import {
  normalizeTenantQuery,
  resolveTenantIdForRequest,
  isTenantContextSyncError,
  syncTenantContext,
  setActiveTenantId,
} from "./tenant";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Error class
// ---------------------------------------------------------------------------

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
    const message = payload.message || payload.error || `HTTP ${status}`;
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

// ---------------------------------------------------------------------------
// Context ID
// ---------------------------------------------------------------------------

const CONTEXT_STORAGE_KEY = "academia-api-context-id";

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

function generateRequestId(): string | undefined {
  try {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
      return crypto.randomUUID();
    }
  } catch { /* fallback */ }
  return undefined;
}

// ---------------------------------------------------------------------------
// URL helpers
// ---------------------------------------------------------------------------

function normalizeBaseUrl(value: string | undefined): string {
  const raw = (value ?? "").trim();
  if (!raw) return "";
  return raw.endsWith("/") ? raw.slice(0, -1) : raw;
}

function buildApiUrl(path: string, query?: Record<string, string | number | boolean | undefined>): string {
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

// ---------------------------------------------------------------------------
// Response helpers
// ---------------------------------------------------------------------------

function isJsonContentType(response: Response): boolean {
  const contentType = response.headers.get("content-type")?.toLowerCase() ?? "";
  return contentType.includes("application/json") || contentType.includes("+json");
}

async function readResponseBody(response: Response): Promise<{ rawBody?: string; parsedBody?: unknown }> {
  if (response.status === 204 || response.status === 205) return {};
  let rawBody: string;
  try { rawBody = await response.text(); } catch { return {}; }
  if (!rawBody.trim()) return {};
  if (isJsonContentType(response)) {
    try { return { rawBody, parsedBody: JSON.parse(rawBody) }; } catch { return { rawBody, parsedBody: rawBody }; }
  }
  try { return { rawBody, parsedBody: JSON.parse(rawBody) }; } catch { return { rawBody, parsedBody: rawBody }; }
}

function normalizeFieldErrors(input: unknown): Record<string, string> | null | undefined {
  if (!input) return undefined;
  if (Array.isArray(input)) {
    const pairs = input
      .map((item) => {
        if (!item || typeof item !== "object") return null;
        const candidate = item as { field?: unknown; message?: unknown };
        return typeof candidate.field === "string" && typeof candidate.message === "string"
          ? [candidate.field, candidate.message] : null;
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
  if (!input || typeof input !== "object" || Array.isArray(input)) return undefined;
  const candidate = input as Record<string, unknown>;
  const message =
    typeof candidate.message === "string" ? candidate.message
      : typeof candidate.details === "string" ? candidate.details
      : undefined;
  const error =
    typeof candidate.error === "string" ? candidate.error
      : typeof candidate.code === "string" ? candidate.code
      : undefined;
  const status = typeof candidate.status === "number" ? candidate.status : undefined;
  const path = typeof candidate.path === "string" ? candidate.path : undefined;
  const timestamp = typeof candidate.timestamp === "string" ? candidate.timestamp : undefined;
  const responseBody = typeof candidate.responseBody === "string" ? candidate.responseBody : undefined;
  const fieldErrors = normalizeFieldErrors(candidate.fieldErrors);

  if (message == null && error == null && status == null && path == null &&
      timestamp == null && fieldErrors == null && responseBody == null) {
    return undefined;
  }
  return { timestamp, status, error, message, path, fieldErrors, responseBody };
}

function normalizeResponseHeaders(headers: Headers): Record<string, string> {
  const normalized: Record<string, string> = {};
  headers.forEach((value, key) => { normalized[key.toLowerCase()] = value; });
  return normalized;
}

// ---------------------------------------------------------------------------
// Core request executor
// ---------------------------------------------------------------------------

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
  const isFormData = typeof FormData !== "undefined" && input.body instanceof FormData;
  const headers: Record<string, string> = { Accept: "application/json" };
  if (input.headers) {
    for (const [key, value] of Object.entries(input.headers)) { headers[key] = value; }
  }
  if (input.body != null && !isFormData) { headers["Content-Type"] = "application/json"; }

  const contextId = input.includeContextHeader !== false ? getContextId() : undefined;
  if (contextId) headers["X-Context-Id"] = contextId;
  const requestId = generateRequestId();
  if (requestId) headers["X-Request-Id"] = requestId;

  // CSRF
  const csrfToken = readCsrfToken();
  if (csrfToken) headers["X-CSRF-Token"] = csrfToken;

  // Auth
  const isAuthEndpoint = input.path.startsWith("/api/v1/auth/");
  const token = getAccessToken();
  if (shouldInjectAuthHeader() && token) {
    headers["Authorization"] = `${getAccessTokenType() ?? "Bearer"} ${token}`;
  }
  if (!token && !isAuthEndpoint) {
    const loginToken = await tryAutoLogin();
    if (loginToken?.token) {
      headers["Authorization"] = `${loginToken.type} ${loginToken.token}`;
    }
  }

  // Tenant
  const normalizedQuery = normalizeTenantQuery(input.path, input.query, {
    hasContextHeader: Boolean(contextId),
  });
  const requestUrl = resolveRequestUrl(input.path, normalizedQuery);
  const requestBody = input.body == null
    ? undefined
    : isFormData ? (input.body as unknown as BodyInit) : (JSON.stringify(input.body) as unknown as BodyInit);
  const tenantIdForContextSync = resolveTenantIdForRequest(input.query, normalizedQuery);

  const executeRequest = async (retriedAfterRefresh = false): Promise<Response> => {
    const response = await fetch(requestUrl, {
      method, headers, body: requestBody, credentials: getFetchCredentials(),
    });

    if (response.status === 401 && retryOnAuthFailure && !isAuthEndpoint && !retriedAfterRefresh) {
      const refreshToken = getRefreshToken();
      const refreshed = await tryRefreshToken(refreshToken);
      if (refreshed) {
        if (refreshed.token) {
          headers.Authorization = `${refreshed.type} ${refreshed.token}`;
        } else {
          delete headers.Authorization;
        }
        const retriedResponse = await fetch(requestUrl, {
          method, headers, body: requestBody, credentials: getFetchCredentials(),
        });
        if (retriedResponse.status === 401) {
          // clearAuthSession is called inside tryRefreshToken
        }
        return retriedResponse;
      }
      return response;
    }
    return response;
  };

  let response = await executeRequest();

  if (!response.ok) {
    let { rawBody, parsedBody } = await readResponseBody(response);
    let payload = normalizeApiErrorPayload(parsedBody);

    // Tenant context sync retry
    if (
      tenantIdForContextSync &&
      isTenantContextSyncError(response, payload, parsedBody) &&
      (await syncTenantContext(tenantIdForContextSync, headers))
    ) {
      setActiveTenantId(tenantIdForContextSync);
      response = await executeRequest();
      if (response.ok) {
        const { parsedBody: retriedBody } = await readResponseBody(response);
        return { data: retriedBody as T, headers: normalizeResponseHeaders(response.headers) };
      }
      ({ rawBody, parsedBody } = await readResponseBody(response));
      payload = normalizeApiErrorPayload(parsedBody);
    }

    const details: ApiErrorPayload & { statusCode?: number } = {
      statusCode: response.status,
      message: payload?.message ??
        (typeof parsedBody === "string" ? parsedBody.trim() : undefined) ??
        payload?.error ?? response.statusText ?? `HTTP ${response.status}`,
      error: payload?.error,
      path: payload?.path ?? input.path,
      responseBody: rawBody ?? payload?.responseBody,
      fieldErrors: payload?.fieldErrors,
      contextId: response.headers.get("X-Context-Id") ?? headers["X-Context-Id"],
      requestId: response.headers.get("X-Request-Id") ?? headers["X-Request-Id"],
    };
    const apiError = new ApiRequestError(details);

    if (response.status >= 500) {
      captureApiError(apiError, { httpStatus: response.status, path: input.path, method });
    }
    throw apiError;
  }

  const { parsedBody } = await readResponseBody(response);
  return { data: parsedBody as T, headers: normalizeResponseHeaders(response.headers) };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/** Wrapper com tracking de performance e correlation ID para Sentry. */
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
