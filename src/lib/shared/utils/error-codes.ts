import { ApiRequestError } from "@/lib/api/http";

/**
 * Known backend error message fragments used for tenant context mismatch detection.
 * Centralised here so no component needs to match raw strings.
 */
export const TENANT_ERROR_MESSAGES = {
  CONTEXT_MISSING: "x-context-id sem unidade ativa",
  CONTEXT_MISMATCH: "tenantid diverge da unidade ativa do contexto informado",
} as const;

/**
 * Returns `true` when the error indicates the server-side tenant context
 * is missing or mismatched — meaning a context sync + retry might fix it.
 *
 * Works with both `ApiRequestError` instances and raw error messages (string).
 */
export function isTenantContextError(error: unknown): boolean {
  if (error instanceof ApiRequestError) {
    if (error.status !== 400) return false;

    const fragments = [
      error.message,
      error.error,
      error.responseBody,
    ]
      .filter((v): v is string => typeof v === "string" && v.trim().length > 0)
      .join(" ")
      .toLowerCase();

    return (
      fragments.includes(TENANT_ERROR_MESSAGES.CONTEXT_MISSING) ||
      fragments.includes(TENANT_ERROR_MESSAGES.CONTEXT_MISMATCH)
    );
  }

  if (typeof error === "string") {
    const lower = error.toLowerCase();
    return (
      lower.includes(TENANT_ERROR_MESSAGES.CONTEXT_MISSING) ||
      lower.includes(TENANT_ERROR_MESSAGES.CONTEXT_MISMATCH)
    );
  }

  return false;
}

/**
 * Returns `true` when the error indicates the server-side tenant context
 * is missing or mismatched, based on an already-normalised error message string.
 *
 * Use this when you already have a message from `normalizeErrorMessage(error)`.
 */
export function isTenantContextErrorMessage(message: string): boolean {
  const lower = message.toLowerCase();
  return (
    lower.includes(TENANT_ERROR_MESSAGES.CONTEXT_MISSING) ||
    lower.includes(TENANT_ERROR_MESSAGES.CONTEXT_MISMATCH)
  );
}
