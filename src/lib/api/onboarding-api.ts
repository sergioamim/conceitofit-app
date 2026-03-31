import { ApiRequestError, apiRequest } from "./http";
import type { OnboardingChecklistStep, OnboardingChecklistStepStatus, OnboardingStatus } from "@/lib/types";

type OnboardingChecklistStepApiResponse = Partial<OnboardingChecklistStep> & {
  id?: unknown;
  chave?: unknown;
  titulo?: unknown;
  title?: unknown;
  descricao?: unknown;
  description?: unknown;
  status?: unknown;
  completed?: unknown;
  concluida?: unknown;
  rotaConfiguracao?: unknown;
  route?: unknown;
  href?: unknown;
};

type OnboardingStatusApiResponse = Partial<OnboardingStatus> & {
  percentualConclusao?: unknown;
  progressPercent?: unknown;
  concluido?: unknown;
  completed?: unknown;
  totalEtapas?: unknown;
  totalSteps?: unknown;
  etapasConcluidas?: unknown;
  completedSteps?: unknown;
  etapas?: unknown;
  steps?: unknown;
};

function cleanString(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const normalized = value.trim();
  return normalized || undefined;
}

function toNumber(value: unknown, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function toBoolean(value: unknown, fallback = false) {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value === 1;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (["true", "1", "sim", "yes"].includes(normalized)) return true;
    if (["false", "0", "nao", "não", "no"].includes(normalized)) return false;
  }
  return fallback;
}

function normalizeStepStatus(
  status: unknown,
  completedFallback = false
): OnboardingChecklistStepStatus {
  if (status === "PENDENTE" || status === "EM_ANDAMENTO" || status === "CONCLUIDA") {
    return status;
  }

  if (completedFallback) {
    return "CONCLUIDA";
  }

  if (typeof status !== "string") {
    return "PENDENTE";
  }

  const normalized = status.trim().toUpperCase();
  if (["COMPLETED", "DONE", "CONCLUÍDA"].includes(normalized)) return "CONCLUIDA";
  if (["IN_PROGRESS", "EM_PROGRESSO", "EM-ANDAMENTO"].includes(normalized)) return "EM_ANDAMENTO";
  return "PENDENTE";
}

function normalizeStep(
  input: OnboardingChecklistStepApiResponse,
  index: number
): OnboardingChecklistStep {
  const completed = toBoolean(input.completed ?? input.concluida, false);
  const status = normalizeStepStatus(input.status, completed);

  return {
    id: cleanString(input.id) ?? cleanString(input.chave) ?? `etapa-${index + 1}`,
    titulo: cleanString(input.titulo) ?? cleanString(input.title) ?? `Etapa ${index + 1}`,
    descricao: cleanString(input.descricao) ?? cleanString(input.description),
    status,
    rotaConfiguracao: cleanString(input.rotaConfiguracao) ?? cleanString(input.route) ?? cleanString(input.href),
  };
}

function normalizeOnboardingStatus(input: OnboardingStatusApiResponse): OnboardingStatus {
  const etapas = Array.isArray(input.etapas ?? input.steps)
    ? ((input.etapas ?? input.steps) as OnboardingChecklistStepApiResponse[]).map((item, index) =>
        normalizeStep(item, index)
      )
    : [];
  const etapasConcluidas = etapas.filter((step) => step.status === "CONCLUIDA").length;
  const totalEtapas = etapas.length;
  const percentualCalculado = totalEtapas > 0 ? Math.round((etapasConcluidas / totalEtapas) * 100) : 0;

  return {
    percentualConclusao: Math.max(
      0,
      Math.min(100, toNumber(input.percentualConclusao ?? input.progressPercent, percentualCalculado))
    ),
    concluido: toBoolean(input.concluido ?? input.completed, etapasConcluidas === totalEtapas && totalEtapas > 0),
    totalEtapas: Math.max(0, toNumber(input.totalEtapas ?? input.totalSteps, totalEtapas)),
    etapasConcluidas: Math.max(0, toNumber(input.etapasConcluidas ?? input.completedSteps, etapasConcluidas)),
    etapas,
  };
}

export function isOnboardingStatusEndpointUnavailable(error: unknown): boolean {
  return error instanceof ApiRequestError && (error.status === 404 || error.status === 405 || error.status === 501);
}

export async function getOnboardingStatus(): Promise<OnboardingStatus | null> {
  try {
    const response = await apiRequest<OnboardingStatusApiResponse>({
      path: "/api/v1/onboarding/status",
    });
    return normalizeOnboardingStatus(response);
  } catch (error) {
    if (isOnboardingStatusEndpointUnavailable(error)) {
      return null;
    }
    throw error;
  }
}
