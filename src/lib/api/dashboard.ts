import type { DashboardClienteSectionPayload, DashboardData } from "@/lib/types";
import { apiRequest } from "./http";

export type DashboardScope = "FULL" | "CLIENTES" | "VENDAS" | "FINANCEIRO";

type DashboardSummaryPayload = {
  totalAlunosAtivos?: unknown;
  prospectsEmAberto?: unknown;
  followupPendente?: unknown;
  visitasAguardandoRetorno?: unknown;
  prospectsNovos?: unknown;
  matriculasDoMes?: unknown;
  receitas?: unknown;
  receitaDoMes?: unknown;
  matriculasNovas?: unknown;
  matriculasDoMesAnterior?: unknown;
  prospectsNovosAnterior?: unknown;
  receitaDoMesAnterior?: unknown;
  ticketMedio?: unknown;
  ticketMedioAnterior?: unknown;
  pagamentosRecebidosMes?: unknown;
  pagamentosRecebidosMesAnterior?: unknown;
  vendasNovas?: unknown;
  vendasRecorrentes?: unknown;
  inadimplencia?: unknown;
  aReceber?: unknown;
  statusAlunoCount?: Record<string, unknown>;
  prospectsRecentes?: unknown;
  matriculasVencendo?: unknown;
  pagamentosPendentes?: unknown;
  tenantId?: unknown;
  referenceDate?: unknown;
  contratosCanceladosMotivos?: unknown;
};

type DashboardSummaryPayloadWithLegacy = {
  clientes?: DashboardSummaryPayload;
  vendas?: DashboardSummaryPayload;
  financeiro?: DashboardSummaryPayload;
};

type DashboardPayload = Partial<DashboardData> &
  DashboardSummaryPayloadWithLegacy & {
    scope?: DashboardScope;
    tenantId?: unknown;
    referenceDate?: string;
    summary?: DashboardSummaryPayloadWithLegacy;
    metadados?: {
      generatedAt?: string;
      sourceWindow?: {
        month?: unknown;
        year?: unknown;
      };
    };
    totalAlunosAtivos?: unknown;
    prospectsNovos?: unknown;
    prospectsEmAberto?: unknown;
    followupPendente?: unknown;
    visitasAguardandoRetorno?: unknown;
    matriculasDoMes?: unknown;
    matriculasDoMesAnterior?: unknown;
    receitaDoMes?: unknown;
    receitaDoMesAnterior?: unknown;
    ticketMedio?: unknown;
    ticketMedioAnterior?: unknown;
    pagamentosRecebidosMes?: unknown;
    pagamentosRecebidosMesAnterior?: unknown;
    vendasNovas?: unknown;
    vendasRecorrentes?: unknown;
    inadimplencia?: unknown;
    aReceber?: unknown;
    prospectsNovosAnterior?: unknown;
    statusAlunoCount?: Record<string, unknown>;
    prospectsRecentes?: unknown;
    matriculasVencendo?: unknown;
    pagamentosPendentes?: unknown;
    /** Bloco rico opcional `/academia/dashboard` (camelCase Jackson). */
    clientes?: unknown;
    /** Opcional futuro — agrupa cancelamentos por motivo (camelCase Jackson). */
    contratosCanceladosMotivos?: Record<string, unknown>;
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

function toRecordNumbers(raw?: Record<string, unknown>): Record<string, number> {
  if (!raw || typeof raw !== "object") return {};
  const out: Record<string, number> = {};
  for (const [k, v] of Object.entries(raw)) out[k] = toNumber(v, 0);
  return out;
}

function normalizeDashboardClienteSection(raw: unknown): DashboardClienteSectionPayload | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const o = raw as Record<string, unknown>;
  const totaisSrc = o.totais && typeof o.totais === "object" ? (o.totais as Record<string, unknown>) : undefined;
  const breakdownSrc =
    o.breakdownStatus && typeof o.breakdownStatus === "object" ? (o.breakdownStatus as Record<string, unknown>) : undefined;
  const metricasSrc =
    o.metricas && typeof o.metricas === "object" ? (o.metricas as Record<string, unknown>) : undefined;

  const payload: DashboardClienteSectionPayload = {};
  if (totaisSrc) {
    payload.totais = {
      alunosAtivos: toNumber(totaisSrc.alunosAtivos),
      prospectsEmAberto: toNumber(totaisSrc.prospectsEmAberto),
      baseRelacionamento: toNumber(totaisSrc.baseRelacionamento),
    };
  }
  const alunos = breakdownSrc?.alunos;
  const prospects = breakdownSrc?.prospects;
  payload.breakdownStatus = {
    ...(alunos && typeof alunos === "object" ? { alunos: toRecordNumbers(alunos as Record<string, unknown>) } : {}),
    ...(prospects && typeof prospects === "object" ? { prospects: toRecordNumbers(prospects as Record<string, unknown>) } : {}),
  };

  if (metricasSrc) {
    payload.metricas = {
      aberturasMesAtual: toNumber(metricasSrc.aberturasMesAtual),
      aberturasMesAnterior: toNumber(metricasSrc.aberturasMesAnterior),
      followUpsRealizadosMesAtual: toNumber(metricasSrc.followUpsRealizadosMesAtual),
      followUpsPendentes: toNumber(metricasSrc.followUpsPendentes),
      visitasAguardandoRetorno: toNumber(metricasSrc.visitasAguardandoRetorno),
    };
  }

  const hasAnything =
    (payload.totais && Object.keys(payload.totais).length > 0) ||
    (payload.breakdownStatus?.alunos && Object.keys(payload.breakdownStatus.alunos).length > 0) ||
    (payload.breakdownStatus?.prospects && Object.keys(payload.breakdownStatus.prospects).length > 0) ||
    (payload.metricas && Object.values(payload.metricas).some((n) => n > 0));

  return hasAnything ? payload : undefined;
}

function normalizeContratosCanceladosMotivos(raw: unknown): Record<string, number> | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const entries = Object.entries(raw as Record<string, unknown>).map<[string, number]>(([k, v]) => [
    String(k),
    toNumber(v, 0),
  ]);
  const withValues = entries.filter(([, q]) => q > 0);
  return withValues.length > 0 ? Object.fromEntries(withValues) : undefined;
}

function normalizeStatusAlunoCount(raw?: Record<string, unknown>): Record<string, number> {
  const source = raw ?? {};

  return {
    ATIVO: toNumber(source.ATIVO, 0),
    INATIVO: toNumber(source.INATIVO, 0),
    SUSPENSO: toNumber(source.SUSPENSO, 0),
    CANCELADO: toNumber(source.CANCELADO, 0),
    // Task 458 follow-up: BLOQUEADO preservado como status distinto de INATIVO.
    BLOQUEADO: toNumber(source.BLOQUEADO, 0),
    ...(Object.fromEntries(Object.entries(source).filter(([key]) => !["ATIVO", "INATIVO", "SUSPENSO", "CANCELADO", "BLOQUEADO"].includes(key)))),
  };
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
  const candidate = wrapped.data ?? wrapped.content ?? wrapped.result ?? wrapped.dashboard ?? {};
  if (candidate && "summary" in candidate) {
    return candidate as DashboardPayload;
  }
  return candidate;
}

function normalizeSummary(payload: DashboardPayload): DashboardSummaryPayload {
  const summary = (payload.summary || payload) as DashboardSummaryPayloadWithLegacy;
  return {
    ...(summary.clientes ?? {}),
    ...(summary.vendas ?? {}),
    ...(summary.financeiro ?? {}),
  };
}

function normalizeDashboard(response: DashboardApiResponse): DashboardData {
  const payload = extractPayload(response);
  const summaryPayload = normalizeSummary(payload);
  const statusAlunoCountRaw = (summaryPayload.statusAlunoCount ??
    payload.statusAlunoCount ??
    {}) as Record<string, unknown>;

  return {
    totalAlunosAtivos: toNumber(summaryPayload.totalAlunosAtivos ?? payload.totalAlunosAtivos),
    prospectsNovos: toNumber(summaryPayload.prospectsNovos ?? payload.prospectsNovos),
    matriculasDoMes: toNumber(summaryPayload.matriculasDoMes ?? summaryPayload.matriculasNovas ?? payload.matriculasDoMes),
    receitaDoMes: toNumber(summaryPayload.receitaDoMes ?? summaryPayload.receitas ?? payload.receitaDoMes),
    prospectsRecentes: toArray<DashboardData["prospectsRecentes"][number]>(
      summaryPayload.prospectsRecentes ?? payload.prospectsRecentes
    ),
    matriculasVencendo: toArray<DashboardData["matriculasVencendo"][number]>(
      summaryPayload.matriculasVencendo ?? payload.matriculasVencendo
    ),
    pagamentosPendentes: toArray<DashboardData["pagamentosPendentes"][number]>(
      summaryPayload.pagamentosPendentes ?? payload.pagamentosPendentes
    ),
    statusAlunoCount: {
      ATIVO: toNumber(normalizeStatusAlunoCount(statusAlunoCountRaw).ATIVO, 0),
      INATIVO: toNumber(normalizeStatusAlunoCount(statusAlunoCountRaw).INATIVO, 0),
      SUSPENSO: toNumber(normalizeStatusAlunoCount(statusAlunoCountRaw).SUSPENSO, 0),
      CANCELADO: toNumber(normalizeStatusAlunoCount(statusAlunoCountRaw).CANCELADO, 0),
      BLOQUEADO: toNumber(normalizeStatusAlunoCount(statusAlunoCountRaw).BLOQUEADO, 0),
    },
    prospectsEmAberto: toNumber(summaryPayload.prospectsEmAberto ?? payload.prospectsEmAberto),
    followupPendente: toNumber(summaryPayload.followupPendente ?? payload.followupPendente),
    visitasAguardandoRetorno: toNumber(summaryPayload.visitasAguardandoRetorno ?? payload.visitasAguardandoRetorno),
    prospectsNovosAnterior: toNumber(summaryPayload.prospectsNovosAnterior ?? payload.prospectsNovosAnterior),
    matriculasDoMesAnterior: toNumber(summaryPayload.matriculasDoMesAnterior ?? payload.matriculasDoMesAnterior),
    receitaDoMesAnterior: toNumber(summaryPayload.receitaDoMesAnterior ?? payload.receitaDoMesAnterior),
    ticketMedio: toNumber(summaryPayload.ticketMedio ?? payload.ticketMedio),
    ticketMedioAnterior: toNumber(summaryPayload.ticketMedioAnterior ?? payload.ticketMedioAnterior),
    pagamentosRecebidosMes: toNumber(summaryPayload.pagamentosRecebidosMes ?? payload.pagamentosRecebidosMes),
    pagamentosRecebidosMesAnterior: toNumber(
      summaryPayload.pagamentosRecebidosMesAnterior ?? payload.pagamentosRecebidosMesAnterior
    ),
    vendasNovas: toNumber(summaryPayload.vendasNovas ?? payload.vendasNovas),
    vendasRecorrentes: toNumber(summaryPayload.vendasRecorrentes ?? payload.vendasRecorrentes),
    inadimplencia: toNumber(summaryPayload.inadimplencia ?? payload.inadimplencia),
    aReceber: toNumber(summaryPayload.aReceber ?? payload.aReceber),
    dashboardClientes: normalizeDashboardClienteSection(payload.clientes),
    contratosCanceladosMotivos:
      normalizeContratosCanceladosMotivos(
        summaryPayload.contratosCanceladosMotivos ?? payload.contratosCanceladosMotivos
      ) ?? undefined,
  };
}

export async function getDashboardApi(input: {
  tenantId: string;
  referenceDate?: string;
  scope?: DashboardScope;
  month?: number;
  year?: number;
}): Promise<DashboardData> {
  const query = {
    tenantId: input.tenantId,
    referenceDate: input.referenceDate,
    scope: input.scope,
    month: input.month,
    year: input.year,
  };

  const response = await apiRequest<DashboardApiResponse>({
    path: "/api/v1/academia/dashboard",
    query,
  });
  return normalizeDashboard(response);
}
