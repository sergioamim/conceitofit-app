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
