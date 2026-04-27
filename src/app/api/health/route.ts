import { NextResponse } from "next/server";

/**
 * GET /api/health
 *
 * Task 471: Health check endpoint para VPS e monitoramento.
 * Retorna status do app, Sentry, backend e métricas básicas.
 */
export async function GET() {
  const startTime = Date.now();

  // Verificar status do Sentry
  const sentryConfigured = Boolean(process.env.NEXT_PUBLIC_SENTRY_DSN);

  // Verificar configuração do backend
  const backendConfigured = Boolean(process.env.BACKEND_PROXY_TARGET || process.env.NEXT_PUBLIC_API_BASE_URL);

  // Health check do backend (se configurado)
  let backendStatus = "unknown";
  try {
    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || process.env.BACKEND_PROXY_TARGET;
    if (baseUrl) {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 3000);
      const response = await fetch(`${baseUrl}/actuator/health/liveness`, {
        method: "GET",
        signal: controller.signal,
      });
      clearTimeout(timeout);
      backendStatus = response.ok ? "healthy" : "unhealthy";
    }
  } catch {
    backendStatus = "unreachable";
  }

  const responseTime = Date.now() - startTime;

  const body = {
    status: "ok" as const,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env.npm_package_version ?? "unknown",
    environment: process.env.NODE_ENV ?? "unknown",
    sentry: {
      configured: sentryConfigured,
    },
    backend: {
      status: backendStatus,
      configured: backendConfigured,
    },
    responseTimeMs: responseTime,
  };

  return NextResponse.json(body, {
    status: backendStatus === "unhealthy" ? 503 : 200,
  });
}
