import { headers } from "next/headers";
import { logger } from "@/lib/shared/logger";

const FRONTEND_HEALTH_PATH = "/api/health";
const BACKEND_HEALTH_PATH = "/api/v1/health/full";
const DEFAULT_BACKEND_BASE = "http://localhost:8080";
const REQUEST_TIMEOUT_MS = 5_000;

const DATABASE_COMPONENT_KEYS = ["db", "database", "postgres", "postgresql", "banco"];
const STORAGE_COMPONENT_KEYS = ["storage", "objectStorage", "object-storage", "s3", "minio"];

export type SystemHealthStatus = "UP" | "DOWN";

export interface HealthCardSnapshot {
  id: "frontend" | "backend" | "database" | "storage";
  label: string;
  description: string;
  source: string;
  status: SystemHealthStatus;
  checkedAt: string;
  latencyMs: number | null;
  detail: string | null;
}

export interface SystemHealthSnapshot {
  checkedAt: string;
  cards: HealthCardSnapshot[];
}

interface TimedHealthCheckResult<T> {
  ok: boolean;
  checkedAt: string;
  latencyMs: number | null;
  data: T | null;
  errorMessage: string | null;
  responseStatus: number | null;
}

interface BackendComponentHealth {
  status?: unknown;
  details?: unknown;
  [key: string]: unknown;
}

interface BackendHealthPayload {
  status?: unknown;
  timestamp?: unknown;
  components?: Record<string, BackendComponentHealth | undefined> | null;
  [key: string]: unknown;
}

interface FrontendHealthPayload {
  status?: unknown;
  timestamp?: unknown;
  uptime?: unknown;
}

function normalizeBaseUrl(value: string | undefined): string {
  const normalized = (value ?? "").trim();
  if (!normalized) return DEFAULT_BACKEND_BASE;
  return normalized.endsWith("/") ? normalized.slice(0, -1) : normalized;
}

function normalizeForwardedValue(value: string | null): string | null {
  if (!value) return null;
  const [first] = value.split(",");
  const normalized = first?.trim();
  return normalized || null;
}

function normalizeStatus(value: unknown): SystemHealthStatus {
  if (typeof value === "string") {
    const normalized = value.trim().toUpperCase();
    if (["UP", "OK", "ONLINE", "HEALTHY"].includes(normalized)) {
      return "UP";
    }
  }
  return "DOWN";
}

function normalizeTimestamp(value: unknown, fallback: string): string {
  if (typeof value !== "string") return fallback;
  const normalized = value.trim();
  return normalized || fallback;
}

function describeError(errorMessage: string | null, responseStatus: number | null): string | null {
  if (errorMessage) return errorMessage;
  if (responseStatus == null) return null;
  return `HTTP ${responseStatus}`;
}

function formatResponseTime(latencyMs: number | null): string {
  if (latencyMs == null) return "—";
  return `${latencyMs} ms`;
}

export function formatHealthTimestamp(timestamp: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "medium",
    timeZone: "America/Sao_Paulo",
  }).format(new Date(timestamp));
}

function findComponent(
  components: Record<string, BackendComponentHealth | undefined> | null | undefined,
  keys: string[],
): BackendComponentHealth | null {
  if (!components) return null;

  for (const [componentName, componentValue] of Object.entries(components)) {
    const normalizedName = componentName.toLowerCase();
    if (keys.includes(normalizedName) && componentValue) {
      return componentValue;
    }
  }

  return null;
}

function buildComponentCard(params: {
  id: HealthCardSnapshot["id"];
  label: string;
  description: string;
  source: string;
  backendStatus: TimedHealthCheckResult<BackendHealthPayload>;
  component: BackendComponentHealth | null;
  checkedAt: string;
}): HealthCardSnapshot {
  const { id, label, description, source, backendStatus, component, checkedAt } = params;

  if (!backendStatus.ok) {
    return {
      id,
      label,
      description,
      source,
      status: "DOWN",
      checkedAt,
      latencyMs: backendStatus.latencyMs,
      detail: describeError(backendStatus.errorMessage, backendStatus.responseStatus) ?? "Backend indisponível.",
    };
  }

  if (!component) {
    return {
      id,
      label,
      description,
      source,
      status: "DOWN",
      checkedAt,
      latencyMs: backendStatus.latencyMs,
      detail: "Componente não retornado pelo backend.",
    };
  }

  return {
    id,
    label,
    description,
    source,
    status: normalizeStatus(component.status),
    checkedAt,
    latencyMs: backendStatus.latencyMs,
    detail: null,
  };
}

export function buildSystemHealthSnapshot(input: {
  frontend: TimedHealthCheckResult<FrontendHealthPayload>;
  backend: TimedHealthCheckResult<BackendHealthPayload>;
}): SystemHealthSnapshot {
  const frontendCheckedAt = normalizeTimestamp(input.frontend.data?.timestamp, input.frontend.checkedAt);
  const backendCheckedAt = normalizeTimestamp(input.backend.data?.timestamp, input.backend.checkedAt);
  const backendComponents = input.backend.data?.components;
  const checkedAt = [frontendCheckedAt, backendCheckedAt].sort().reverse()[0] ?? new Date().toISOString();

  return {
    checkedAt,
    cards: [
      {
        id: "frontend",
        label: "Frontend",
        description: "Saúde do Next.js via rota pública interna.",
        source: FRONTEND_HEALTH_PATH,
        status: input.frontend.ok ? normalizeStatus(input.frontend.data?.status) : "DOWN",
        checkedAt: frontendCheckedAt,
        latencyMs: input.frontend.latencyMs,
        detail: input.frontend.ok
          ? typeof input.frontend.data?.uptime === "number"
            ? `Uptime ${Math.round(input.frontend.data.uptime)}s`
            : null
          : describeError(input.frontend.errorMessage, input.frontend.responseStatus),
      },
      {
        id: "backend",
        label: "Backend",
        description: "Saúde geral da API pública principal.",
        source: BACKEND_HEALTH_PATH,
        status: input.backend.ok ? normalizeStatus(input.backend.data?.status) : "DOWN",
        checkedAt: backendCheckedAt,
        latencyMs: input.backend.latencyMs,
        detail: input.backend.ok ? null : describeError(input.backend.errorMessage, input.backend.responseStatus),
      },
      buildComponentCard({
        id: "database",
        label: "Banco de dados",
        description: "Componente de persistência informado pelo backend.",
        source: BACKEND_HEALTH_PATH,
        backendStatus: input.backend,
        component: findComponent(backendComponents, DATABASE_COMPONENT_KEYS),
        checkedAt: backendCheckedAt,
      }),
      buildComponentCard({
        id: "storage",
        label: "Storage",
        description: "Componente de armazenamento informado pelo backend.",
        source: BACKEND_HEALTH_PATH,
        backendStatus: input.backend,
        component: findComponent(backendComponents, STORAGE_COMPONENT_KEYS),
        checkedAt: backendCheckedAt,
      }),
    ],
  };
}

async function timedJsonFetch<T>(url: string): Promise<TimedHealthCheckResult<T>> {
  const startedAt = performance.now();
  const checkedAt = new Date().toISOString();

  try {
    const response = await fetch(url, {
      method: "GET",
      cache: "no-store",
      headers: {
        Accept: "application/json",
      },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });

    const latencyMs = Math.round(performance.now() - startedAt);

    if (!response.ok) {
      return {
        ok: false,
        checkedAt,
        latencyMs,
        data: null,
        errorMessage: response.statusText || null,
        responseStatus: response.status,
      };
    }

    const data = (await response.json()) as T;
    return {
      ok: true,
      checkedAt,
      latencyMs,
      data,
      errorMessage: null,
      responseStatus: response.status,
    };
  } catch (error) {
    const latencyMs = Math.round(performance.now() - startedAt);
    const message = error instanceof Error ? error.message : "Falha inesperada ao consultar health check.";

    logger.warn("Health check request failed", {
      module: "status/system-health",
      url,
      error,
    });

    return {
      ok: false,
      checkedAt,
      latencyMs,
      data: null,
      errorMessage: message,
      responseStatus: null,
    };
  }
}

async function resolveRequestOrigin(): Promise<string> {
  const requestHeaders = await headers();
  const forwardedProto = normalizeForwardedValue(requestHeaders.get("x-forwarded-proto"));
  const forwardedHost = normalizeForwardedValue(requestHeaders.get("x-forwarded-host"));
  const host = forwardedHost ?? requestHeaders.get("host") ?? "localhost:3000";
  const protocol = forwardedProto ?? (process.env.NODE_ENV === "development" ? "http" : "https");

  return `${protocol}://${host}`;
}

export async function loadSystemHealthSnapshot(): Promise<SystemHealthSnapshot> {
  const requestOrigin = await resolveRequestOrigin();
  const backendBase = normalizeBaseUrl(
    process.env.BACKEND_PROXY_TARGET ?? process.env.NEXT_PUBLIC_API_BASE_URL,
  );

  const [frontend, backend] = await Promise.all([
    timedJsonFetch<FrontendHealthPayload>(`${requestOrigin}${FRONTEND_HEALTH_PATH}`),
    timedJsonFetch<BackendHealthPayload>(`${backendBase}${BACKEND_HEALTH_PATH}`),
  ]);

  return buildSystemHealthSnapshot({ frontend, backend });
}

export { formatResponseTime };
