type LogLevel = "info" | "warn" | "error";

interface LogMeta {
  module?: string;
  requestId?: string;
  [key: string]: unknown;
}

function formatEntry(level: LogLevel, message: string, meta?: LogMeta) {
  const timestamp = new Date().toISOString();
  const module = meta?.module;
  const requestId = meta?.requestId;
  const prefix = [
    module ? `[${module}]` : "",
    requestId ? `[req:${requestId}]` : "",
  ].filter(Boolean).join(" ");
  const { module: _, requestId: __, ...rest } = meta ?? {};
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
}

export const logger = {
  info: (message: string, meta?: LogMeta) => emit("info", message, meta),
  warn: (message: string, meta?: LogMeta) => emit("warn", message, meta),
  error: (message: string, meta?: LogMeta) => emit("error", message, meta),
};
