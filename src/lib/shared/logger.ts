import * as Sentry from "@sentry/nextjs";

type LogLevel = "info" | "warn" | "error";

interface LogMeta {
  module?: string;
  requestId?: string;
  error?: unknown;
  handled?: boolean;
  [key: string]: unknown;
}

function formatEntry(level: LogLevel, message: string, meta?: LogMeta) {
  const timestamp = new Date().toISOString();
  const moduleName = meta?.module;
  const requestId = meta?.requestId;
  const prefix = [
    moduleName ? `[${moduleName}]` : "",
    requestId ? `[req:${requestId}]` : "",
  ].filter(Boolean).join(" ");
  const rest = { ...(meta ?? {}) };
  delete rest.module;
  delete rest.requestId;
  delete rest.handled;
  const hasExtra = Object.keys(rest).length > 0;

  return { timestamp, level, prefix, message, extra: hasExtra ? rest : undefined };
}

function emit(level: LogLevel, message: string, meta?: LogMeta) {
  const entry = formatEntry(level, message, meta);
  const tag = `${entry.timestamp} ${entry.level.toUpperCase()} ${entry.prefix}`.trim();
  const isHandledClientError =
    level === "error" &&
    meta?.handled === true &&
    typeof window !== "undefined";

  const consoleFn = isHandledClientError
    ? console.warn
    : level === "error"
      ? console.error
      : level === "warn"
        ? console.warn
        : console.log;

  if (entry.extra) {
    consoleFn(tag, message, entry.extra);
  } else {
    consoleFn(tag, message);
  }

  // Capturar erros e warnings no Sentry quando DSN configurado
  if (level === "error") {
    const errorObj = meta?.error instanceof Error ? meta.error : new Error(message);
    Sentry.captureException(errorObj, {
      tags: { module: meta?.module, handled: meta?.handled ? "true" : "false" },
      extra: entry.extra,
    });
  } else if (level === "warn") {
    Sentry.addBreadcrumb({
      category: meta?.module ?? "app",
      message,
      level: "warning",
      data: entry.extra,
    });
  }
}

export const logger = {
  info: (message: string, meta?: LogMeta) => emit("info", message, meta),
  warn: (message: string, meta?: LogMeta) => emit("warn", message, meta),
  error: (message: string, meta?: LogMeta) => emit("error", message, meta),
};
