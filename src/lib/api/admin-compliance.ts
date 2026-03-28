import type {
  ComplianceAcademiaResumo,
  ComplianceDashboard,
  ComplianceTermsStatus,
  SolicitacaoExclusao,
  SolicitacaoExclusaoStatus,
} from "@/lib/types";
import { apiRequest } from "./http";

/* ── API response types (lenient) ─────────────── */

type ComplianceDashboardApiResponse = Partial<ComplianceDashboard> & {
  totalDadosPessoais?: unknown;
  totalDadosPessoaisArmazenados?: unknown;
  solicitacoesExclusaoPendentes?: unknown;
  termosAceitos?: unknown;
  termosPendentes?: unknown;
  academias?: Partial<ComplianceAcademiaResumo>[];
  solicitacoes?: Partial<SolicitacaoExclusao>[];
  solicitacoesPendentes?: Partial<SolicitacaoExclusao>[];
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
  "PENDENTE", "EM_PROCESSAMENTO", "EXECUTADA", "REJEITADA",
]);

const VALID_TERMS_STATUSES = new Set<ComplianceTermsStatus>(["ACEITO", "PARCIAL", "PENDENTE"]);

function normalizeAcademiaResumo(raw: Partial<ComplianceAcademiaResumo>): ComplianceAcademiaResumo {
  return {
    academiaId: cleanString(raw.academiaId),
    academiaNome: cleanString(raw.academiaNome) ?? "—",
    totalAlunos: toNumber(raw.totalAlunos),
    alunosComCpf: toNumber(raw.alunosComCpf),
    alunosComEmail: toNumber(raw.alunosComEmail),
    alunosComTelefone: toNumber(raw.alunosComTelefone),
    termosAceitos: toNumber(raw.termosAceitos),
    termosPendentes: toNumber(raw.termosPendentes),
    ultimaSolicitacaoExclusao: cleanString(raw.ultimaSolicitacaoExclusao),
    statusTermos: VALID_TERMS_STATUSES.has(raw.statusTermos as ComplianceTermsStatus)
      ? (raw.statusTermos as ComplianceTermsStatus)
      : "PENDENTE",
    camposSensiveis: Array.isArray(raw.camposSensiveis) ? raw.camposSensiveis : [],
  };
}

function normalizeSolicitacao(raw: Partial<SolicitacaoExclusao>): SolicitacaoExclusao {
  return {
    id: cleanString(raw.id) ?? "",
    academiaId: cleanString(raw.academiaId),
    academiaNome: cleanString(raw.academiaNome) ?? "—",
    alunoId: cleanString(raw.alunoId),
    alunoNome: cleanString(raw.alunoNome) ?? "—",
    email: cleanString(raw.email),
    cpf: cleanString(raw.cpf),
    solicitadoEm: cleanString(raw.solicitadoEm),
    solicitadoPor: cleanString(raw.solicitadoPor),
    status: VALID_EXCLUSION_STATUSES.has(raw.status as SolicitacaoExclusaoStatus)
      ? (raw.status as SolicitacaoExclusaoStatus)
      : "PENDENTE",
    motivo: cleanString(raw.motivo),
  };
}

function normalizeDashboard(raw: ComplianceDashboardApiResponse): ComplianceDashboard {
  return {
    totalDadosPessoaisArmazenados: toNumber(raw.totalDadosPessoaisArmazenados ?? raw.totalDadosPessoais),
    solicitacoesExclusaoPendentes: toNumber(raw.solicitacoesExclusaoPendentes),
    termosAceitos: toNumber(raw.termosAceitos),
    termosPendentes: toNumber(raw.termosPendentes),
    academias: (raw.academias ?? []).map(normalizeAcademiaResumo),
    solicitacoesPendentes: (raw.solicitacoesPendentes ?? raw.solicitacoes ?? []).map(normalizeSolicitacao),
    exposicaoCamposSensiveis: Array.isArray(raw.exposicaoCamposSensiveis) ? raw.exposicaoCamposSensiveis : [],
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
