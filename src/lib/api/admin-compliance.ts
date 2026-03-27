import {
  applyComplianceDashboardDefaults,
  getLatestDeletionRequestDate,
  normalizeComplianceTermsStatus,
  normalizeSolicitacaoExclusaoStatus,
  resolveComplianceFieldLabel,
} from "@/lib/admin-compliance";
import type {
  ComplianceAcademiaResumo,
  ComplianceDashboard,
  ComplianceExposicaoCampo,
  ComplianceTermsStatus,
  SolicitacaoExclusao,
} from "@/lib/types";
import { apiRequest } from "./http";

type Envelope<T> =
  | T
  | {
      data?: T;
      content?: T;
      result?: T;
      dashboard?: T;
      payload?: T;
    };

type RawComplianceAcademia = Partial<ComplianceAcademiaResumo> & {
  academiaId?: unknown;
  academiaNome?: unknown;
  nome?: unknown;
  totalAlunos?: unknown;
  alunos?: unknown;
  alunosComCpf?: unknown;
  totalCpf?: unknown;
  cpfCount?: unknown;
  alunosComEmail?: unknown;
  totalEmail?: unknown;
  emailCount?: unknown;
  alunosComTelefone?: unknown;
  totalTelefone?: unknown;
  telefoneCount?: unknown;
  ultimaSolicitacaoExclusao?: unknown;
  ultimaSolicitacaoEm?: unknown;
  termosAceitos?: unknown;
  aceitesTermos?: unknown;
  termosPendentes?: unknown;
  pendenciasTermos?: unknown;
  statusTermos?: unknown;
  camposSensiveis?: unknown;
  camposColetados?: unknown;
  sensitiveFields?: unknown;
};

type RawSolicitacaoExclusao = Partial<SolicitacaoExclusao> & {
  id?: unknown;
  requestId?: unknown;
  academiaId?: unknown;
  academiaNome?: unknown;
  academia?: unknown;
  alunoId?: unknown;
  alunoNome?: unknown;
  aluno?: unknown;
  nomeAluno?: unknown;
  email?: unknown;
  cpf?: unknown;
  solicitadoEm?: unknown;
  createdAt?: unknown;
  solicitadoPor?: unknown;
  requestedBy?: unknown;
  motivo?: unknown;
  reason?: unknown;
  status?: unknown;
};

type RawExposureField = Partial<ComplianceExposicaoCampo> & {
  key?: unknown;
  campo?: unknown;
  label?: unknown;
  nome?: unknown;
  totalAcademias?: unknown;
  quantidadeAcademias?: unknown;
  academias?: unknown;
  redes?: unknown;
};

type RawComplianceDashboard = Partial<ComplianceDashboard> & {
  totalDadosPessoaisArmazenados?: unknown;
  totalDadosPessoais?: unknown;
  totalDataPoints?: unknown;
  solicitacoesExclusaoPendentes?: unknown;
  pendingDeletionRequests?: unknown;
  termosAceitos?: unknown;
  acceptedTerms?: unknown;
  termosPendentes?: unknown;
  pendingTerms?: unknown;
  academias?: unknown;
  items?: unknown;
  rows?: unknown;
  solicitacoesPendentes?: unknown;
  solicitacoesExclusao?: unknown;
  deletionRequests?: unknown;
  exposicaoCamposSensiveis?: unknown;
  exposureReport?: unknown;
  exposicoes?: unknown;
  generatedAt?: unknown;
};

function cleanString(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const normalized = value.trim();
  return normalized || undefined;
}

function toNumber(value: unknown, fallback = 0): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function normalizeStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => cleanString(item))
    .filter((item): item is string => Boolean(item));
}

function toArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

function extractPayload<T>(response: Envelope<T>): T {
  if (!response || typeof response !== "object") return {} as T;
  if ("data" in response || "content" in response || "result" in response || "dashboard" in response || "payload" in response) {
    const wrapped = response as Exclude<Envelope<T>, T>;
    return wrapped.data ?? wrapped.content ?? wrapped.result ?? wrapped.dashboard ?? wrapped.payload ?? ({} as T);
  }
  return response as T;
}

function normalizeTermsStatus(value: unknown, termosAceitos: number, termosPendentes: number): ComplianceTermsStatus {
  if (value === "ACEITO" || value === "PARCIAL" || value === "PENDENTE") {
    return value;
  }
  return normalizeComplianceTermsStatus({ termosAceitos, termosPendentes });
}

function normalizeAcademiaResumo(input: RawComplianceAcademia): ComplianceAcademiaResumo {
  const termosAceitos = Math.max(0, toNumber(input.termosAceitos ?? input.aceitesTermos, 0));
  const termosPendentes = Math.max(0, toNumber(input.termosPendentes ?? input.pendenciasTermos, 0));

  return {
    academiaId: cleanString(input.academiaId),
    academiaNome: cleanString(input.academiaNome) ?? cleanString(input.nome) ?? "Academia sem nome",
    totalAlunos: Math.max(0, toNumber(input.totalAlunos ?? input.alunos, 0)),
    alunosComCpf: Math.max(0, toNumber(input.alunosComCpf ?? input.totalCpf ?? input.cpfCount, 0)),
    alunosComEmail: Math.max(0, toNumber(input.alunosComEmail ?? input.totalEmail ?? input.emailCount, 0)),
    alunosComTelefone: Math.max(0, toNumber(input.alunosComTelefone ?? input.totalTelefone ?? input.telefoneCount, 0)),
    ultimaSolicitacaoExclusao:
      cleanString(input.ultimaSolicitacaoExclusao) ?? cleanString(input.ultimaSolicitacaoEm),
    termosAceitos,
    termosPendentes,
    statusTermos: normalizeTermsStatus(input.statusTermos, termosAceitos, termosPendentes),
    camposSensiveis: normalizeStringArray(input.camposSensiveis ?? input.camposColetados ?? input.sensitiveFields).map(
      resolveComplianceFieldLabel
    ),
  };
}

function normalizeSolicitacao(input: RawSolicitacaoExclusao): SolicitacaoExclusao {
  const alunoNome =
    cleanString(input.alunoNome)
    ?? cleanString(input.nomeAluno)
    ?? cleanString(input.aluno)
    ?? "Aluno sem identificação";

  return {
    id: cleanString(input.id) ?? cleanString(input.requestId) ?? `solicitacao-${alunoNome.toLowerCase().replace(/\s+/g, "-")}`,
    academiaId: cleanString(input.academiaId),
    academiaNome: cleanString(input.academiaNome) ?? cleanString(input.academia) ?? "Academia não informada",
    alunoId: cleanString(input.alunoId),
    alunoNome,
    email: cleanString(input.email),
    cpf: cleanString(input.cpf),
    solicitadoEm: cleanString(input.solicitadoEm) ?? cleanString(input.createdAt),
    solicitadoPor: cleanString(input.solicitadoPor) ?? cleanString(input.requestedBy),
    motivo: cleanString(input.motivo) ?? cleanString(input.reason),
    status: normalizeSolicitacaoExclusaoStatus(input.status),
  };
}

function normalizeExposureField(input: RawExposureField): ComplianceExposicaoCampo | null {
  const key = cleanString(input.key) ?? cleanString(input.campo);
  if (!key) return null;

  return {
    key,
    label: cleanString(input.label) ?? cleanString(input.nome) ?? resolveComplianceFieldLabel(key),
    totalAcademias: Math.max(0, toNumber(input.totalAcademias ?? input.quantidadeAcademias, 0)),
    academias: normalizeStringArray(input.academias ?? input.redes),
  };
}

function normalizeComplianceDashboard(response: Envelope<RawComplianceDashboard>): ComplianceDashboard {
  const payload = extractPayload(response);
  const academias = toArray<RawComplianceAcademia>(payload.academias ?? payload.items ?? payload.rows).map((item) =>
    normalizeAcademiaResumo(item)
  );
  const solicitacoes = toArray<RawSolicitacaoExclusao>(
    payload.solicitacoesPendentes ?? payload.solicitacoesExclusao ?? payload.deletionRequests
  )
    .map((item) => normalizeSolicitacao(item))
    .filter((item) => item.status === "PENDENTE" || item.status === "EM_PROCESSAMENTO");
  const exposicao = toArray<RawExposureField>(
    payload.exposicaoCamposSensiveis ?? payload.exposureReport ?? payload.exposicoes
  )
    .map((item) => normalizeExposureField(item))
    .filter((item): item is ComplianceExposicaoCampo => item !== null);

  const academiasComUltimaSolicitacao = academias.map((academia) => ({
    ...academia,
    ultimaSolicitacaoExclusao:
      academia.ultimaSolicitacaoExclusao
      ?? getLatestDeletionRequestDate(solicitacoes, academia.academiaId, academia.academiaNome),
  }));

  return applyComplianceDashboardDefaults({
    totalDadosPessoaisArmazenados: Math.max(
      0,
      toNumber(payload.totalDadosPessoaisArmazenados ?? payload.totalDadosPessoais ?? payload.totalDataPoints, 0)
    ),
    solicitacoesExclusaoPendentes: Math.max(
      0,
      toNumber(payload.solicitacoesExclusaoPendentes ?? payload.pendingDeletionRequests, 0)
    ),
    termosAceitos: Math.max(0, toNumber(payload.termosAceitos ?? payload.acceptedTerms, 0)),
    termosPendentes: Math.max(0, toNumber(payload.termosPendentes ?? payload.pendingTerms, 0)),
    academias: academiasComUltimaSolicitacao,
    solicitacoesPendentes: solicitacoes,
    exposicaoCamposSensiveis: exposicao,
    generatedAt: cleanString(payload.generatedAt),
  });
}

export async function getComplianceDashboard(): Promise<ComplianceDashboard> {
  const response = await apiRequest<Envelope<RawComplianceDashboard>>({
    path: "/api/v1/admin/compliance/dashboard",
    method: "GET",
  });

  return normalizeComplianceDashboard(response);
}

export async function executarSolicitacaoExclusao(id: string): Promise<void> {
  await apiRequest({
    path: `/api/v1/admin/compliance/solicitacoes-exclusao/${id}/executar`,
    method: "POST",
  });
}

export async function rejeitarSolicitacaoExclusao(id: string): Promise<void> {
  await apiRequest({
    path: `/api/v1/admin/compliance/solicitacoes-exclusao/${id}/rejeitar`,
    method: "POST",
  });
}
