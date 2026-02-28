import type { DashboardData } from "@/lib/types";
import { ApiRequestError, apiRequest } from "./http";

type DashboardPayload = Partial<DashboardData> & {
  totalAlunosAtivos?: unknown;
  prospectsNovos?: unknown;
  matriculasDoMes?: unknown;
  receitaDoMes?: unknown;
  prospectsRecentes?: unknown;
  matriculasVencendo?: unknown;
  pagamentosPendentes?: unknown;
};

type DashboardApiResponse =
  | DashboardPayload
  | {
      data?: DashboardPayload;
      content?: DashboardPayload;
      result?: DashboardPayload;
      dashboard?: DashboardPayload;
    };

function toNumber(value: unknown, fallback = 0): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function toArray<T>(value: unknown): T[] {
  if (!Array.isArray(value)) return [];
  return value as T[];
}

function extractPayload(response: DashboardApiResponse): DashboardPayload {
  if (!response || typeof response !== "object") return {};
  if ("totalAlunosAtivos" in response || "prospectsNovos" in response || "receitaDoMes" in response) {
    return response as DashboardPayload;
  }
  const wrapped = response as {
    data?: DashboardPayload;
    content?: DashboardPayload;
    result?: DashboardPayload;
    dashboard?: DashboardPayload;
  };
  return wrapped.data ?? wrapped.content ?? wrapped.result ?? wrapped.dashboard ?? {};
}

function normalizeDashboard(response: DashboardApiResponse): DashboardData {
  const payload = extractPayload(response);
  return {
    totalAlunosAtivos: toNumber(payload.totalAlunosAtivos),
    prospectsNovos: toNumber(payload.prospectsNovos),
    matriculasDoMes: toNumber(payload.matriculasDoMes),
    receitaDoMes: toNumber(payload.receitaDoMes),
    prospectsRecentes: toArray<DashboardData["prospectsRecentes"][number]>(payload.prospectsRecentes),
    matriculasVencendo: toArray<DashboardData["matriculasVencendo"][number]>(payload.matriculasVencendo),
    pagamentosPendentes: toArray<DashboardData["pagamentosPendentes"][number]>(payload.pagamentosPendentes),
  };
}

export async function getDashboardApi(input: {
  tenantId: string;
  month?: number;
  year?: number;
}): Promise<DashboardData> {
  const query = {
    tenantId: input.tenantId,
    month: input.month,
    year: input.year,
  };

  try {
    const response = await apiRequest<DashboardApiResponse>({
      path: "/api/v1/dashboard",
      query,
    });
    return normalizeDashboard(response);
  } catch (error) {
    if (!(error instanceof ApiRequestError) || error.status !== 404) {
      throw error;
    }
  }

  const fallback = await apiRequest<DashboardApiResponse>({
    path: "/api/v1/academia/dashboard",
    query,
  });
  return normalizeDashboard(fallback);
}
