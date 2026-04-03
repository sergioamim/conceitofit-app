import type {
  ComplianceAcademiaResumo,
  ComplianceDashboard,
  ComplianceTermsStatus,
  SolicitacaoExclusao,
  SolicitacaoExclusaoStatus,
} from "@/lib/types";
import { apiRequest } from "@/lib/api/http";

/* ── API response types (lenient) ─────────────── */

type ComplianceDashboardApiResponse = Partial<ComplianceDashboard> & {
  dashboard?: Partial<ComplianceDashboardApiResponse>;
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

function toArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? value : [];
}

function computeTermsStatus(aceitos: number, pendentes: number): ComplianceTermsStatus {
  if (aceitos > 0 && pendentes > 0) return "PARCIAL";
  if (aceitos > 0) return "ACEITO";
  return "PENDENTE";
}

function getSensitiveFieldLabel(field: string): string {
  const normalized = field.trim().toLowerCase();
  const labels: Record<string, string> = {
    cpf: "CPF",
    email: "E-mail",
    telefone: "Telefone",
    celular: "Celular",
    endereco: "Endereço",
    dataNascimento: "Data de nascimento",
    "data-nascimento": "Data de nascimento",
  };
  return labels[normalized] ?? field;
}

const VALID_EXCLUSION_STATUSES = new Set<SolicitacaoExclusaoStatus>([
  "PENDENTE", "EM_PROCESSAMENTO", "EXECUTADA", "REJEITADA",
]);

const VALID_TERMS_STATUSES = new Set<ComplianceTermsStatus>(["ACEITO", "PARCIAL", "PENDENTE"]);

function normalizeAcademiaResumo(raw: Partial<ComplianceAcademiaResumo>): ComplianceAcademiaResumo {
  const termosAceitos = toNumber((raw as Record<string, unknown>).termosAceitos ?? (raw as Record<string, unknown>).aceitesTermos);
  const termosPendentes = toNumber((raw as Record<string, unknown>).termosPendentes ?? (raw as Record<string, unknown>).pendenciasTermos);
  const camposSensiveis = toArray<string>(
    (raw as Record<string, unknown>).camposSensiveis ?? (raw as Record<string, unknown>).camposColetados,
  );

  return {
    academiaId: cleanString(raw.academiaId),
    academiaNome: cleanString(raw.academiaNome ?? (raw as Record<string, unknown>).nome) ?? "—",
    totalAlunos: toNumber(raw.totalAlunos ?? (raw as Record<string, unknown>).alunos),
    alunosComCpf: toNumber(raw.alunosComCpf ?? (raw as Record<string, unknown>).totalCpf),
    alunosComEmail: toNumber(raw.alunosComEmail ?? (raw as Record<string, unknown>).totalEmail),
    alunosComTelefone: toNumber(raw.alunosComTelefone ?? (raw as Record<string, unknown>).totalTelefone),
    termosAceitos,
    termosPendentes,
    ultimaSolicitacaoExclusao: cleanString(raw.ultimaSolicitacaoExclusao),
    statusTermos: VALID_TERMS_STATUSES.has(raw.statusTermos as ComplianceTermsStatus)
      ? (raw.statusTermos as ComplianceTermsStatus)
      : computeTermsStatus(termosAceitos, termosPendentes),
    camposSensiveis,
  };
}

function normalizeSolicitacao(raw: Partial<SolicitacaoExclusao>): SolicitacaoExclusao {
  return {
    id: cleanString(raw.id ?? (raw as Record<string, unknown>).requestId) ?? "",
    academiaId: cleanString(raw.academiaId),
    academiaNome: cleanString(raw.academiaNome ?? (raw as Record<string, unknown>).academia) ?? "—",
    alunoId: cleanString(raw.alunoId),
    alunoNome: cleanString(raw.alunoNome ?? (raw as Record<string, unknown>).nomeAluno) ?? "—",
    email: cleanString(raw.email),
    cpf: cleanString(raw.cpf),
    solicitadoEm: cleanString(raw.solicitadoEm ?? (raw as Record<string, unknown>).createdAt),
    solicitadoPor: cleanString(raw.solicitadoPor ?? (raw as Record<string, unknown>).requestedBy),
    status: VALID_EXCLUSION_STATUSES.has(raw.status as SolicitacaoExclusaoStatus)
      ? (raw.status as SolicitacaoExclusaoStatus)
      : "PENDENTE",
    motivo: cleanString(raw.motivo),
  };
}

function normalizeDashboard(raw: ComplianceDashboardApiResponse): ComplianceDashboard {
  const payload = raw.dashboard ?? raw;
  const solicitacoesPendentes = toArray<Partial<SolicitacaoExclusao>>(
    payload.solicitacoesPendentes ?? payload.solicitacoes ?? (payload as Record<string, unknown>).solicitacoesExclusao,
  ).map(normalizeSolicitacao);
  const academias = toArray<Partial<ComplianceAcademiaResumo>>(payload.academias).map(normalizeAcademiaResumo);
  const ultimaSolicitacaoPorAcademia = solicitacoesPendentes.reduce((acc, solicitacao) => {
    if (!solicitacao.academiaId || !solicitacao.solicitadoEm) return acc;
    const previous = acc.get(solicitacao.academiaId);
    if (!previous || solicitacao.solicitadoEm > previous) {
      acc.set(solicitacao.academiaId, solicitacao.solicitadoEm);
    }
    return acc;
  }, new Map<string, string>());
  const termosAceitos = toNumber(payload.termosAceitos);
  const termosPendentes = toNumber(payload.termosPendentes);
  const totalDadosPessoaisArmazenados = toNumber(
    payload.totalDadosPessoaisArmazenados
      ?? payload.totalDadosPessoais
      ?? academias.reduce(
        (acc, academia) => acc + academia.alunosComCpf + academia.alunosComEmail + academia.alunosComTelefone,
        0,
      ),
  );
  const exposicaoCamposSensiveis = Array.isArray(payload.exposicaoCamposSensiveis)
    ? payload.exposicaoCamposSensiveis
    : Array.from(
        academias.reduce((acc, academia) => {
          for (const campo of academia.camposSensiveis) {
            const key = campo.trim();
            if (!key) continue;
            const current = acc.get(key) ?? {
              key,
              label: getSensitiveFieldLabel(key),
              totalAcademias: 0,
              academias: [] as string[],
            };
            if (!current.academias.includes(academia.academiaNome)) {
              current.academias.push(academia.academiaNome);
              current.totalAcademias = current.academias.length;
            }
            acc.set(key, current);
          }
          return acc;
        }, new Map<string, { key: string; label: string; totalAcademias: number; academias: string[] }>()),
      ).map((entry) => entry[1]);

  return {
    totalDadosPessoaisArmazenados,
    solicitacoesExclusaoPendentes: toNumber(
      payload.solicitacoesExclusaoPendentes ?? solicitacoesPendentes.filter((item) => item.status === "PENDENTE").length,
    ),
    termosAceitos,
    termosPendentes,
    academias: academias.map((academia) => ({
      ...academia,
      ultimaSolicitacaoExclusao:
        academia.ultimaSolicitacaoExclusao ?? (
          academia.academiaId ? ultimaSolicitacaoPorAcademia.get(academia.academiaId) : undefined
        ),
    })),
    solicitacoesPendentes,
    exposicaoCamposSensiveis,
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
