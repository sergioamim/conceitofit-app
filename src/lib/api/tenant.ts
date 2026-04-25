/**
 * Tenant — resolução de tenant context, sync e normalização de query params.
 */

import {
  getActiveTenantIdFromSession,
  getAvailableTenantsFromSession,
  getPreferredTenantId,
  setActiveTenantId,
  getFetchCredentials,
} from "./session";

const TENANT_CONTEXT_SYNC_PATH = "/api/v1/context/unidade-ativa";
const TENANT_CONTEXT_MISMATCH_MESSAGE = "tenantid diverge da unidade ativa do contexto informado";
const TENANT_CONTEXT_MISSING_MESSAGE = "x-context-id sem unidade ativa";

const CONTEXT_SCOPED_OPERATIONAL_PATTERNS = [
  /^\/api\/v1\/comercial(?:\/|$)/,
  /^\/api\/v1\/crm(?:\/|$)/,
  /^\/api\/v1\/agenda\/aulas(?:\/|$)/,
  /^\/api\/v1\/administrativo\/(?:cargos|funcionarios|salas|atividades(?:-grade)?)(?:\/|$)/,
  /^\/api\/v1\/gerencial\/financeiro\/(?!formas-pagamento(?:\/|$)|tipos-conta-pagar(?:\/|$))/,
  /^\/api\/v1\/conversas(?:\/|$)/,
  /^\/api\/v1\/whatsapp\/credentials(?:\/|$)/,
];

const EXPLICIT_TENANT_QUERY_PATTERNS = [
  /^\/api\/v1\/academia(?:\/|$)/,
  /^\/api\/v1\/dashboard(?:\/|$)/,
  /^\/api\/v1\/gerencial\/financeiro\/(?:formas-pagamento|tipos-conta-pagar)(?:\/|$)/,
];

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

export function normalizeTenantQuery(
  path: string,
  query?: Record<string, string | number | boolean | undefined>,
  options?: { hasContextHeader?: boolean }
): Record<string, string | number | boolean | undefined> | undefined {
  const normalized = query ? { ...query } : {};
  const hasContextHeader = options?.hasContextHeader ?? false;
  const requestedTenant =
    typeof normalized.tenantId === "string" ? normalized.tenantId.trim() : undefined;
  const allowedTenants = getAvailableTenantsFromSession()
    .map((item) => item.tenantId.trim())
    .filter(Boolean);
  const fallbackTenant = resolveTenantFallback(allowedTenants);

  // Sempre que possível, envia o tenantId explicitamente — mesmo em rotas
  // que aceitam X-Context-Id. O backend usa o tenantId da query como fonte
  // autoritativa e cai no contextId só se a query estiver vazia. Isso evita
  // o cenário em que `tenantContextCache[contextId]` ficou stale por algum
  // motivo (ex: switch de tenant não propagou) e o backend resolve pra um
  // tenant diferente do `activeTenantId` da sessão.
  if (requestedTenant) {
    normalized.tenantId = requestedTenant;
  } else if (
    fallbackTenant
    && (routeRequiresTenantQuery(path, hasContextHeader)
        || isContextScopedOperationalRoute(path))
  ) {
    normalized.tenantId = fallbackTenant;
  }

  for (const [key, value] of Object.entries(normalized)) {
    if (value == null) { delete normalized[key]; continue; }
    if (typeof value === "string" && value.trim() === "") { delete normalized[key]; }
  }

  return Object.keys(normalized).length > 0 ? normalized : undefined;
}

export function resolveTenantIdForRequest(
  inputQuery?: Record<string, string | number | boolean | undefined>,
  normalizedQuery?: Record<string, string | number | boolean | undefined>
): string | undefined {
  return resolveTenantIdForContextSync(inputQuery, normalizedQuery);
}

export function isTenantContextSyncError(
  response: Response,
  payload: { message?: string; error?: string; responseBody?: string } | undefined,
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
      value.includes(TENANT_CONTEXT_MISSING_MESSAGE.toLowerCase())
  );
}

export async function syncTenantContext(
  tenantId: string,
  headers: Record<string, string>
): Promise<boolean> {
  const syncHeaders: Record<string, string> = { Accept: "application/json" };
  if (headers.Authorization) syncHeaders.Authorization = headers.Authorization;
  if (headers["X-Context-Id"]) syncHeaders["X-Context-Id"] = headers["X-Context-Id"];
  const response = await fetch(resolveRequestUrl(`${TENANT_CONTEXT_SYNC_PATH}/${tenantId}`), {
    method: "PUT",
    headers: syncHeaders,
    credentials: getFetchCredentials(),
  });
  return response.ok;
}

export { setActiveTenantId };
