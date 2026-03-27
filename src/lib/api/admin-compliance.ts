import type {
  ComplianceAcademiaResumo,
  ComplianceDashboard,
  SolicitacaoExclusao,
  SolicitacaoExclusaoStatus,
} from "@/lib/types";
import { apiRequest } from "./http";

/* ── API response types (lenient) ─────────────── */

type ComplianceDashboardApiResponse = Partial<ComplianceDashboard> & {
  totalDadosPessoais?: unknown;
  solicitacoesExclusaoPendentes?: unknown;
  termosAceitos?: unknown;
  termosPendentes?: unknown;
  academias?: Partial<ComplianceAcademiaResumo>[];
  solicitacoes?: Partial<SolicitacaoExclusao>[];
};

/* ── Helpers ──────────────────────────────────── */

function cleanString(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const normalized = value.trim();
  return normalized || undefined;
}

function toNumber(value: unknown, fallback = 0): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

const VALID_EXCLUSION_STATUSES = new Set<SolicitacaoExclusaoStatus>([
  "PENDENTE", "EXECUTADA", "REJEITADA",
]);

function normalizeAcademiaResumo(raw: Partial<ComplianceAcademiaResumo>): ComplianceAcademiaResumo {
  return {
    academiaId: cleanString(raw.academiaId) ?? "",
    academiaNome: cleanString(raw.academiaNome) ?? "—",
    totalAlunos: toNumber(raw.totalAlunos),
    alunosComCpf: toNumber(raw.alunosComCpf),
    alunosComEmail: toNumber(raw.alunosComEmail),
    alunosComTelefone: toNumber(raw.alunosComTelefone),
    termosAceitos: toNumber(raw.termosAceitos),
    termosPendentes: toNumber(raw.termosPendentes),
    ultimaSolicitacaoExclusao: cleanString(raw.ultimaSolicitacaoExclusao),
  };
}

function normalizeSolicitacao(raw: Partial<SolicitacaoExclusao>): SolicitacaoExclusao {
  return {
    id: cleanString(raw.id) ?? "",
    solicitanteNome: cleanString(raw.solicitanteNome) ?? "—",
    solicitanteEmail: cleanString(raw.solicitanteEmail) ?? "—",
    solicitanteCpf: cleanString(raw.solicitanteCpf),
    academiaId: cleanString(raw.academiaId) ?? "",
    academiaNome: cleanString(raw.academiaNome) ?? "—",
    dataSolicitacao: cleanString(raw.dataSolicitacao) ?? "",
    dataResposta: cleanString(raw.dataResposta),
    status: VALID_EXCLUSION_STATUSES.has(raw.status as SolicitacaoExclusaoStatus)
      ? (raw.status as SolicitacaoExclusaoStatus)
      : "PENDENTE",
    motivo: cleanString(raw.motivo),
    responsavelNome: cleanString(raw.responsavelNome),
  };
}

function normalizeDashboard(raw: ComplianceDashboardApiResponse): ComplianceDashboard {
  return {
    totalDadosPessoais: toNumber(raw.totalDadosPessoais),
    solicitacoesExclusaoPendentes: toNumber(raw.solicitacoesExclusaoPendentes),
    termosAceitos: toNumber(raw.termosAceitos),
    termosPendentes: toNumber(raw.termosPendentes),
    academias: (raw.academias ?? []).map(normalizeAcademiaResumo),
    solicitacoes: (raw.solicitacoes ?? []).map(normalizeSolicitacao),
  };
}

/* ── Public API ───────────────────────────────── */

export async function getComplianceDashboardApi(): Promise<ComplianceDashboard> {
  const response = await apiRequest<ComplianceDashboardApiResponse>({
    path: "/api/v1/administrativo/compliance/dashboard",
  });
  return normalizeDashboard(response);
}

export async function executarSolicitacaoExclusaoApi(id: string): Promise<void> {
  await apiRequest<void>({
    path: `/api/v1/administrativo/compliance/solicitacoes/${id}/executar`,
    method: "POST",
  });
}

export async function rejeitarSolicitacaoExclusaoApi(
  id: string,
  motivo: string
): Promise<void> {
  await apiRequest<void>({
    path: `/api/v1/administrativo/compliance/solicitacoes/${id}/rejeitar`,
    method: "POST",
    body: { motivo },
  });
}
