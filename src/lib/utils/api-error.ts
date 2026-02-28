import { ApiRequestError, type ApiErrorPayload } from "@/lib/api/http";

export function isRecord(input: unknown): input is Record<string, string> {
  return (
    typeof input === "object" && input !== null &&
    Object.entries(input as Record<string, unknown>).every(([, value]) => typeof value === "string")
  );
}

export function normalizeErrorMessage(error: unknown): string {
  if (error instanceof ApiRequestError) {
    const details =
      Object.entries(error.fieldErrors ?? {})
        .map(([field, message]) => `${field}: ${message}`)
        .join(" ") || error.message;
    return details;
  }

  if (error instanceof Error) {
    return error.message;
  }

  if (isApiErrorPayload(error)) {
    const fieldErrors =
      Object.entries(error.fieldErrors ?? {})
        .map(([field, message]) => `${field}: ${message}`)
        .join(" ") ||
      error.message ||
      error.error ||
      "Não foi possível completar a operação.";
    return fieldErrors;
  }

  return "Não foi possível completar a operação.";
}

function isApiErrorPayload(error: unknown): error is ApiErrorPayload {
  if (typeof error !== "object" || error === null) return false;
  const candidate = error as ApiErrorPayload;
  return (
    typeof candidate.message === "string" ||
    typeof candidate.error === "string" ||
    typeof candidate.status === "number" ||
    typeof candidate.path === "string" ||
    candidate.fieldErrors != null
  );
}
