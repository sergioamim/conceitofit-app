import { ApiRequestError, type ApiErrorPayload } from "@/lib/api/http";

export type ErrorSupportDetail = {
  label: string;
  value: string;
};

export type ErrorPresentation = {
  title: string;
  message: string;
  details: ErrorSupportDetail[];
};

function isRecord(input: unknown): input is Record<string, string> {
  return (
    typeof input === "object" && input !== null &&
    Object.entries(input as Record<string, unknown>).every(([, value]) => typeof value === "string")
  );
}

function pickFirstString(...values: unknown[]): string | undefined {
  for (const value of values) {
    if (typeof value === "string" && value.trim().length > 0) {
      return value;
    }
  }
  return undefined;
}

function normalizeFieldErrors(input: unknown): Record<string, string> | undefined {
  if (!input) {
    return undefined;
  }
  if (Array.isArray(input)) {
    const entries = input
      .map((item) => {
        if (!item || typeof item !== "object") {
          return null;
        }
        const candidate = item as { field?: unknown; message?: unknown };
        if (typeof candidate.field !== "string" || typeof candidate.message !== "string") {
          return null;
        }
        return [candidate.field, candidate.message] as const;
      })
      .filter((entry): entry is readonly [string, string] => entry !== null);
    return entries.length > 0 ? Object.fromEntries(entries) : undefined;
  }
  return isRecord(input) ? input : undefined;
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
    const payload = error as ApiErrorPayload & {
      detail?: unknown;
      title?: unknown;
      properties?: {
        fieldErrors?: unknown;
        detail?: unknown;
        message?: unknown;
        title?: unknown;
      } | null;
    };
    const normalizedFieldErrors = normalizeFieldErrors(payload.fieldErrors ?? payload.properties?.fieldErrors);
    const message =
      Object.entries(normalizedFieldErrors ?? {})
        .map(([field, message]) => `${field}: ${message}`)
        .join(" ") ||
      pickFirstString(
        payload.message,
        payload.detail,
        payload.properties?.detail,
        payload.properties?.message,
        payload.error,
        payload.title,
        payload.properties?.title,
      ) ||
      "Não foi possível completar a operação.";
    return message;
  }

  return "Não foi possível completar a operação.";
}

export function describeErrorForUi(
  error: unknown,
  options?: { fallbackTitle?: string; digest?: string }
): ErrorPresentation {
  const fallbackTitle = options?.fallbackTitle ?? "Ocorreu um erro inesperado";
  const digest = options?.digest;

  if (error instanceof ApiRequestError) {
    const details = buildSupportDetails(error, digest);

    if (error.status === 401 || error.status === 403) {
      return {
        title: "Acesso indisponível",
        message: "Sua sessão não tem permissão para concluir esta ação. Atualize a página ou entre novamente.",
        details,
      };
    }

    if (error.status === 404) {
      return {
        title: "Recurso não encontrado",
        message: normalizeErrorMessage(error) || "O recurso solicitado não está mais disponível.",
        details,
      };
    }

    if (error.status >= 500) {
      return {
        title: "Falha no servidor",
        message: "A aplicação recebeu uma resposta inválida do servidor. Tente novamente em instantes.",
        details,
      };
    }

    return {
      title: "Falha de comunicação",
      message: normalizeErrorMessage(error),
      details,
    };
  }

  if (error instanceof Error) {
    const details = digest ? [{ label: "Trace", value: digest }] : [];
    const isNetworkError =
      error.name === "AbortError" ||
      /fetch|network|failed to fetch|load failed/i.test(error.message);

    return {
      title: isNetworkError ? "Falha de comunicação" : fallbackTitle,
      message: isNetworkError
        ? "Não foi possível alcançar o servidor ou concluir a sincronização desta tela."
        : error.message || "Tivemos um problema interno ao renderizar esta seção.",
      details,
    };
  }

  if (isApiErrorPayload(error)) {
    return {
      title: "Falha de comunicação",
      message: normalizeErrorMessage(error),
      details: digest ? [{ label: "Trace", value: digest }] : [],
    };
  }

  return {
    title: fallbackTitle,
    message: "Tivemos um problema interno ao renderizar esta seção.",
    details: digest ? [{ label: "Trace", value: digest }] : [],
  };
}

function isApiErrorPayload(error: unknown): error is ApiErrorPayload {
  if (typeof error !== "object" || error === null) return false;
  const candidate = error as ApiErrorPayload & {
    detail?: unknown;
    title?: unknown;
    instance?: unknown;
    properties?: {
      fieldErrors?: unknown;
      detail?: unknown;
      message?: unknown;
      title?: unknown;
    } | null;
  };
  return (
    typeof candidate.message === "string" ||
    typeof candidate.detail === "string" ||
    typeof candidate.error === "string" ||
    typeof candidate.title === "string" ||
    typeof candidate.status === "number" ||
    typeof candidate.path === "string" ||
    typeof candidate.instance === "string" ||
    candidate.fieldErrors != null ||
    candidate.properties?.fieldErrors != null
  );
}

function buildSupportDetails(error: ApiRequestError, digest?: string): ErrorSupportDetail[] {
  const details: ErrorSupportDetail[] = [];

  if (error.status) {
    details.push({ label: "HTTP", value: String(error.status) });
  }

  if (error.path) {
    details.push({ label: "Rota", value: error.path });
  }

  if (error.contextId) {
    details.push({ label: "Contexto", value: error.contextId });
  }

  if (error.requestId) {
    details.push({ label: "Request-Id", value: error.requestId });
  }

  if (digest) {
    details.push({ label: "Trace", value: digest });
  }

  return details;
}
