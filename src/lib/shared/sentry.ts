import * as Sentry from "@sentry/nextjs";

let sentryAvailable: boolean | null = null;

function isSentryEnabled(): boolean {
  if (sentryAvailable === null) {
    sentryAvailable = Boolean(
      typeof process !== "undefined" && process.env?.NEXT_PUBLIC_SENTRY_DSN
    );
  }
  return sentryAvailable;
}

export function setSentryContext(ctx: {
  tenantId?: string;
  userId?: string;
  networkId?: string;
  route?: string;
}) {
  if (!isSentryEnabled()) return;

  if (ctx.userId) {
    Sentry.setUser({ id: ctx.userId });
  }
  Sentry.setTags({
    ...(ctx.tenantId ? { tenantId: ctx.tenantId } : {}),
    ...(ctx.networkId ? { networkId: ctx.networkId } : {}),
    ...(ctx.route ? { route: ctx.route } : {}),
  });
}

export function captureApiError(error: Error, extra?: Record<string, unknown>) {
  if (!isSentryEnabled()) return;

  Sentry.captureException(error, {
    tags: { source: "api-client" },
    extra,
  });
}

function captureAppError(error: unknown, context?: string) {
  if (!isSentryEnabled()) return;

  Sentry.captureException(error, {
    tags: { source: context ?? "app" },
  });
}
