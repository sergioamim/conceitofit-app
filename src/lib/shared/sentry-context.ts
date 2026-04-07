import * as Sentry from "@sentry/nextjs";

/**
 * Atualiza o contexto do Sentry com informações do tenant e usuário.
 * Deve ser chamado quando o contexto do tenant muda (login, tenant switch).
 */
export function setSentryUserContext(params: {
  userId?: string;
  email?: string;
  displayName?: string;
  tenantId?: string;
  tenantName?: string;
  networkId?: string;
  networkSubdomain?: string;
}) {
  if (!process.env.NEXT_PUBLIC_SENTRY_DSN) return;

  Sentry.setUser(
    params.userId
      ? {
          id: params.userId,
          email: params.email,
          username: params.displayName,
        }
      : null,
  );

  Sentry.setTags({
    tenantId: params.tenantId ?? "",
    tenantName: params.tenantName ?? "",
    networkId: params.networkId ?? "",
    networkSubdomain: params.networkSubdomain ?? "",
  });
}

/**
 * Task 472: Adiciona correlation ID ao contexto do Sentry para tracing.
 * Chamado automaticamente pelo interceptor HTTP.
 */
export function setSentryCorrelationId(correlationId: string): void {
  if (!process.env.NEXT_PUBLIC_SENTRY_DSN) return;
  Sentry.setTag("correlationId", correlationId);
}

/**
 * Task 473: Registra métrica de performance de API call no Sentry.
 */
export function recordSentryApiMetric(path: string, durationMs: number, status: number): void {
  if (!process.env.NEXT_PUBLIC_SENTRY_DSN) return;
  Sentry.addBreadcrumb({
    category: "api",
    message: `${path} → ${status} (${durationMs}ms)`,
    level: status >= 500 ? "error" : status >= 400 ? "warning" : "info",
    data: { path, status, durationMs },
  });
}

/**
 * Limpa o contexto do Sentry (logout).
 */
export function clearSentryContext() {
  if (!process.env.NEXT_PUBLIC_SENTRY_DSN) return;
  Sentry.setUser(null);
  Sentry.setTags({
    tenantId: "",
    tenantName: "",
    networkId: "",
    networkSubdomain: "",
    correlationId: "",
  });
}
