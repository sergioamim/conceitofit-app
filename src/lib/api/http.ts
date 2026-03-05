import { clearAuthSession, getAccessToken, getRefreshToken, saveAuthSession } from "./session";

export interface ApiErrorPayload {
  timestamp?: string;
  status?: number;
  error?: string;
  message?: string;
  path?: string;
  fieldErrors?: Record<string, string> | null;
  responseBody?: string;
}

export class ApiRequestError extends Error {
  public readonly status: number;
  public readonly error?: string;
  public readonly path?: string;
  public readonly fieldErrors?: Record<string, string> | null;
  public readonly responseBody?: string;

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
  }
}

const CONTEXT_STORAGE_KEY = "academia-api-context-id";
const AUTH_REFRESH_PATH = "/api/v1/auth/refresh";
const AUTH_LOGIN_PATH = "/api/v1/auth/login";

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
        : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
    window.localStorage.setItem(CONTEXT_STORAGE_KEY, generated);
    return generated;
  } catch {
    return undefined;
  }
}

export function isRealApiEnabled(): boolean {
  return process.env.NEXT_PUBLIC_USE_REAL_API === "true";
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
  const shouldUseProxy = isRealApiEnabled() && (typeof window !== "undefined");
  if (shouldUseProxy) {
    return `/backend${pathname}${suffix}`;
  }
  return baseUrl ? `${baseUrl}${pathname}${suffix}` : `${pathname}${suffix}`;
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
  if (input.includeContextHeader !== false) {
    const contextId = getContextId();
    if (contextId) headers["X-Context-Id"] = contextId;
  }
  const token = getAccessToken();
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const isAuthEndpoint = input.path.startsWith("/api/v1/auth/");
  if (!token && !isAuthEndpoint && isRealApiEnabled()) {
    const loginToken = await tryAutoLogin();
    if (loginToken) {
      headers["Authorization"] = `Bearer ${loginToken}`;
    }
  }

  const requestUrl = resolveRequestUrl(input.path, input.query);
  const requestBody =
    input.body == null
      ? undefined
      : isFormData
        ? (input.body as unknown as BodyInit)
        : (JSON.stringify(input.body) as unknown as BodyInit);
  let response = await fetch(requestUrl, {
    method,
    headers,
    body: requestBody,
  });

  if (response.status === 401 && retryOnAuthFailure && !isAuthEndpoint) {
    const refreshToken = getRefreshToken();
    if (refreshToken) {
      const refreshed = await tryRefreshToken(refreshToken);
      if (refreshed?.token) {
        const retryHeaders: HeadersInit = {
          ...headers,
          Authorization: `Bearer ${refreshed.token}`,
        };
        response = await fetch(requestUrl, {
          method,
          headers: retryHeaders,
          body: requestBody,
        });
      }
    }
  }

  if (!response.ok) {
    let payload: ApiErrorPayload | undefined;
    let rawBody: string | undefined;
      try {
        rawBody = await response.text();
        try {
          payload = rawBody ? (JSON.parse(rawBody) as ApiErrorPayload) : undefined;
        } catch {
          payload = undefined;
        }
      } catch {
        payload = undefined;
      }
      const details: ApiErrorPayload & { statusCode?: number } = {
        statusCode: response.status,
        message: payload?.message ?? payload?.error ?? response.statusText ?? `HTTP ${response.status}`,
        error: payload?.error,
        path: payload?.path ?? input.path,
        responseBody: rawBody,
        fieldErrors: payload?.fieldErrors,
      };
      throw new ApiRequestError(details);
    }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

let refreshInFlight: Promise<{ token: string } | undefined> | null = null;
let autoLoginInFlight: Promise<{ token: string } | undefined> | null = null;

async function tryRefreshToken(refreshToken: string): Promise<{ token: string } | undefined> {
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
    const payload = (await response.json()) as {
      token: string;
      refreshToken?: string;
      type?: string;
      expiresIn?: number;
      activeTenantId?: string;
    };
    saveAuthSession({
      token: payload.token,
      refreshToken: payload.refreshToken ?? refreshToken,
      type: payload.type,
      expiresIn: payload.expiresIn,
      activeTenantId: payload.activeTenantId,
    });
    return { token: payload.token };
  })();
  try {
    return await refreshInFlight;
  } finally {
    refreshInFlight = null;
  }
}

async function tryAutoLogin(): Promise<string | undefined> {
  if (autoLoginInFlight) {
    const cached = await autoLoginInFlight;
    return cached?.token;
  }
  if (process.env.NEXT_PUBLIC_DEV_AUTO_LOGIN === "false") {
    return undefined;
  }
  autoLoginInFlight = (async () => {
    const email = process.env.NEXT_PUBLIC_DEV_AUTH_EMAIL ?? "admin@academia.local";
    const password = process.env.NEXT_PUBLIC_DEV_AUTH_PASSWORD ?? "12345678";
    const response = await fetch(resolveRequestUrl(AUTH_LOGIN_PATH), {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });
    if (!response.ok) return undefined;
    const payload = (await response.json()) as {
      token: string;
      refreshToken?: string;
      type?: string;
      expiresIn?: number;
      activeTenantId?: string;
    };
    saveAuthSession({
      token: payload.token,
      refreshToken: payload.refreshToken ?? "",
      type: payload.type,
      expiresIn: payload.expiresIn,
      activeTenantId: payload.activeTenantId,
    });
    return { token: payload.token };
  })();
  try {
    const session = await autoLoginInFlight;
    return session?.token;
  } finally {
    autoLoginInFlight = null;
  }
}
