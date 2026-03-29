import * as Sentry from "@sentry/nextjs";

type LogLevel = "info" | "warn" | "error";

interface LogMeta {
  module?: string;
  [key: string]: unknown;
}

function formatEntry(level: LogLevel, message: string, meta?: LogMeta) {
  const timestamp = new Date().toISOString();
  const module = meta?.module;
  const prefix = module ? `[${module}]` : "";
  const { module: _, ...rest } = meta ?? {};
  const hasExtra = Object.keys(rest).length > 0;

  return { timestamp, level, prefix, message, extra: hasExtra ? rest : undefined };
}

function emit(level: LogLevel, message: string, meta?: LogMeta) {
  const entry = formatEntry(level, message, meta);
  const tag = `${entry.timestamp} ${entry.level.toUpperCase()} ${entry.prefix}`.trim();

  const consoleFn = level === "error" ? console.error : level === "warn" ? console.warn : console.log;

  if (entry.extra) {
    consoleFn(tag, message, entry.extra);
  } else {
    consoleFn(tag, message);
  }

  // Capturar erros e warnings no Sentry quando DSN configurado
  if (level === "error") {
    const errorObj = meta?.error instanceof Error ? meta.error : new Error(message);
    Sentry.captureException(errorObj, {
      tags: { module: meta?.module },
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
