import { ApiRequestError } from "@/lib/api/http";
import { normalizeErrorMessage } from "@/lib/utils/api-error";
import type { FieldPath, FieldValues, UseFormSetError } from "react-hook-form";

export type ApiFieldErrorMapper<TFieldValues extends FieldValues> =
  | Partial<Record<string, FieldPath<TFieldValues>>>
  | ((field: string) => FieldPath<TFieldValues> | null | undefined);

export type ApplyApiFieldErrorsOptions<TFieldValues extends FieldValues> = {
  mapField?: ApiFieldErrorMapper<TFieldValues>;
};

export type ApplyApiFieldErrorsResult = {
  appliedFields: string[];
  unmatchedFieldErrors: Record<string, string>;
  hasFieldErrors: boolean;
};

function resolveFieldPath<TFieldValues extends FieldValues>(
  field: string,
  mapper?: ApiFieldErrorMapper<TFieldValues>,
): FieldPath<TFieldValues> | null {
  const rawField = !mapper
    ? field
    : typeof mapper === "function"
      ? mapper(field) ?? null
      : mapper[field] ?? null;
  if (!rawField) return null;
  return rawField.replace(/\[(\d+)\]/g, ".$1") as FieldPath<TFieldValues>;
}

export function applyApiFieldErrors<TFieldValues extends FieldValues>(
  error: unknown,
  setError: UseFormSetError<TFieldValues>,
  options?: ApplyApiFieldErrorsOptions<TFieldValues>,
): ApplyApiFieldErrorsResult {
  if (!(error instanceof ApiRequestError) || !error.fieldErrors) {
    return {
      appliedFields: [],
      unmatchedFieldErrors: {},
      hasFieldErrors: false,
    };
  }

  const appliedFields: string[] = [];
  const unmatchedFieldErrors: Record<string, string> = {};

  Object.entries(error.fieldErrors).forEach(([field, message]) => {
    if (typeof message !== "string" || message.trim().length === 0) {
      return;
    }

    const resolvedField = resolveFieldPath(field, options?.mapField);
    if (resolvedField) {
      setError(resolvedField, { type: "server", message });
      appliedFields.push(field);
      return;
    }

    unmatchedFieldErrors[field] = message;
  });

  return {
    appliedFields,
    unmatchedFieldErrors,
    hasFieldErrors: true,
  };
}

export function buildFormApiErrorMessage(
  error: unknown,
  options?: {
    appliedFields?: Iterable<string>;
    fallbackMessage?: string;
  },
): string {
  if (!(error instanceof ApiRequestError) || !error.fieldErrors) {
    return normalizeErrorMessage(error);
  }

  const appliedFields = new Set(options?.appliedFields ?? []);
  const remainingEntries = Object.entries(error.fieldErrors)
    .filter(([field, message]) => !appliedFields.has(field) && typeof message === "string" && message.trim().length > 0);

  if (remainingEntries.length > 0) {
    return remainingEntries.map(([field, message]) => `${field}: ${message}`).join(" ");
  }

  if (typeof error.message === "string" && error.message.trim().length > 0) {
    const normalizedMessage = error.message.trim().toLowerCase();
    if (!["bad request", "validation error", "validation failed"].includes(normalizedMessage)) {
      return error.message;
    }
  }

  return options?.fallbackMessage ?? "Revise os campos destacados e tente novamente.";
}
