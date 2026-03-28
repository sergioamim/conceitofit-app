import { cookies } from "next/headers";

// ---------------------------------------------------------------------------
// server-fetch.ts – helper para data-fetching em React Server Components
// ---------------------------------------------------------------------------
// Usa BACKEND_PROXY_TARGET diretamente (sem passar pelo rewrite do Next.js)
// e encaminha o token de sessão a partir dos cookies do request.
// ---------------------------------------------------------------------------

const BACKEND_BASE =
  process.env.BACKEND_PROXY_TARGET ?? "http://localhost:8080";

/** Payload de erro compatível com o backend Java. */
export interface ServerFetchError {
  status: number;
  message: string;
  path?: string;
  fieldErrors?: Record<string, string> | null;
}

export class ServerFetchRequestError extends Error {
  public readonly status: number;
  public readonly path?: string;
  public readonly fieldErrors?: Record<string, string> | null;

  constructor(payload: ServerFetchError) {
    super(payload.message);
    this.name = "ServerFetchRequestError";
    this.status = payload.status;
    this.path = payload.path;
    this.fieldErrors = payload.fieldErrors;
  }
}

// ---------------------------------------------------------------------------
// Helpers internos
// ---------------------------------------------------------------------------

function resolveUrl(
  path: string,
  query?: Record<string, string | number | boolean | undefined>,
): string {
  const pathname = path.startsWith("/") ? path : `/${path}`;
  const url = new URL(`${BACKEND_BASE}${pathname}`);

  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value == null) continue;
      if (typeof value === "string" && value.trim() === "") continue;
      url.searchParams.set(key, String(value));
    }
  }

  return url.toString();
}

async function getAuthToken(): Promise<string | undefined> {
  const jar = await cookies();
  return jar.get("academia-access-token")?.value;
}

// ---------------------------------------------------------------------------
// serverFetch – ponto de entrada principal
// ---------------------------------------------------------------------------

export interface ServerFetchOptions {
  /** Query string params. */
  query?: Record<string, string | number | boolean | undefined>;
  /** HTTP method (default GET). */
  method?: string;
  /** JSON body – será serializado automaticamente. */
  body?: unknown;
  /** Headers extras. */
  headers?: Record<string, string>;
  /** Tenant id, enviado como query param `tenantId`. */
  tenantId?: string;
  /** Next.js fetch cache / revalidate options. */
  next?: NextFetchRequestConfig;
}

/**
 * Faz uma requisição server-side direta ao backend.
 *
 * - Resolve a URL usando `BACKEND_PROXY_TARGET` (sem proxy rewrite).
 * - Injeta o Bearer token a partir dos cookies do request.
 * - Retorna o JSON já tipado ou lança `ServerFetchRequestError`.
 *
 * @example
 * ```ts
 * // em um Server Component ou `generateMetadata`
 * const alunos = await serverFetch<Aluno[]>("/api/v1/alunos", {
 *   query: { tenantId: "abc-123" },
 *   next: { revalidate: 60 },
 * });
 * ```
 */
export async function serverFetch<T>(
  path: string,
  options: ServerFetchOptions = {},
): Promise<T> {
  const { query = {}, method = "GET", body, headers = {}, tenantId, next } = options;

  if (tenantId) {
    query.tenantId = tenantId;
  }

  const url = resolveUrl(path, query);
  const token = await getAuthToken();

  const reqHeaders: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
    ...headers,
  };

  if (token) {
    reqHeaders.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(url, {
    method,
    headers: reqHeaders,
    body: body != null ? JSON.stringify(body) : undefined,
    next,
  });

  if (!res.ok) {
    let payload: ServerFetchError;
    try {
      const json = await res.json();
      payload = {
        status: res.status,
        message: json.message ?? json.error ?? `HTTP ${res.status}`,
        path: json.path,
        fieldErrors: json.fieldErrors,
      };
    } catch {
      payload = {
        status: res.status,
        message: `HTTP ${res.status} ${res.statusText}`,
      };
    }
    throw new ServerFetchRequestError(payload);
  }

  // 204 No Content
  if (res.status === 204) {
    return undefined as T;
  }

  return res.json() as Promise<T>;
}
