// =============================================================================
// Next.js Instrumentation (Next.js 15+ pattern)
// =============================================================================
// Este arquivo e o ponto de entrada oficial para instrumentation no Next.js 15+.
// Substitui a necessidade de sentry.server.config.ts e sentry.edge.config.ts
// (que ainda funcionam como fallback mas geram deprecation warnings).
//
// Sentry init so acontece se NEXT_PUBLIC_SENTRY_DSN estiver definido no ambiente
// (validado por next.config.ts -> applySentry).
// =============================================================================

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./sentry.server.config");
  }

  if (process.env.NEXT_RUNTIME === "edge") {
    await import("./sentry.edge.config");
  }
}

// onRequestError hook (Next.js 15+): reporta erros de server-side rendering,
// API routes e server actions automaticamente para Sentry.
// Docs: https://nextjs.org/docs/app/api-reference/file-conventions/instrumentation#onrequesterror-optional
export async function onRequestError(
  err: unknown,
  request: {
    path: string;
    method: string;
    headers: { [key: string]: string };
  },
  context: {
    routerKind: "Pages Router" | "App Router";
    routePath: string;
    routeType: "render" | "route" | "action" | "middleware";
    renderSource?:
      | "react-server-components"
      | "react-server-components-payload"
      | "server-rendering";
    revalidateReason?: "on-demand" | "stale" | undefined;
    renderType?: "dynamic" | "dynamic-resume";
  }
) {
  // So reporta se Sentry estiver configurado (DSN presente)
  if (!process.env.NEXT_PUBLIC_SENTRY_DSN) return;

  try {
    const Sentry = await import("@sentry/nextjs");
    Sentry.captureRequestError(err, request, context);
  } catch {
    // Se o import falhar (ex: @sentry/nextjs nao instalado), nao quebrar o app
  }
}
