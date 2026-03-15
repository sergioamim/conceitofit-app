import { ApiRequestError } from "./http";
import { normalizeErrorMessage } from "@/lib/utils/api-error";

export function isApiCapabilityUnavailable(error: unknown): boolean {
  return error instanceof ApiRequestError && [404, 405, 501].includes(error.status);
}

export function normalizeCapabilityError(
  error: unknown,
  fallbackMessage = "Não foi possível completar a operação."
): string {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  const message = normalizeErrorMessage(error);
  return message.trim() || fallbackMessage;
}
