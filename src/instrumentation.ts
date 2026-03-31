import { logger } from "@/lib/shared/logger";

function createExtendPolyfill() {
  return function extend(target: object, source: unknown) {
    const value = source as Record<string, unknown> | null;

    if (target == null || value == null) {
      return target;
    }

    const sourceObj = value as Record<string, unknown>;
    for (const key of Object.keys(sourceObj)) {
      (target as Record<string, unknown>)[key] = sourceObj[key];
    }

    return target;
  };
}

export async function register() {
  if (typeof window !== "undefined") return;

  if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
    if (process.env.NEXT_RUNTIME === "edge") {
      await import("../sentry.edge.config");
    } else {
      await import("../sentry.server.config");
    }
  }

  try {
    const utilModule = (await import("util")) as {
      _extend?: unknown;
      [key: string]: unknown;
    };
    const util = (utilModule.default ? (utilModule.default as Record<string, unknown>) : (utilModule as Record<string, unknown>));

    const descriptor = Object.getOwnPropertyDescriptor(util, "_extend");

    if (descriptor && descriptor.configurable === false) {
      return;
    }

    Object.defineProperty(util, "_extend", {
      configurable: true,
      writable: true,
      value: createExtendPolyfill(),
    });
  } catch (error) {
    logger.warn("Falha ao aplicar compatibilidade util._extend", { module: "instrumentation", error });
  }
}

export const onRequestError = process.env.NEXT_PUBLIC_SENTRY_DSN
  ? async (
      err: { digest?: string } & Error,
      _request: unknown,
      context: { routerKind: string; routePath: string; routeType: string },
    ) => {
      const { captureRequestError } = await import("@sentry/nextjs");
      captureRequestError(err, _request as Parameters<typeof captureRequestError>[1], context);
    }
  : undefined;
