import type {
  ComplianceAcademiaResumo,
  ComplianceDashboard,
  ComplianceExposicaoCampo,
  ComplianceTermsStatus,
  SolicitacaoExclusao,
  SolicitacaoExclusaoStatus,
} from "@/lib/types";

const EXPOSURE_LABELS: Record<string, string> = {
  cpf: "CPF",
  email: "E-mail",
  telefone: "Telefone",
  endereco: "Endereço",
  dataNascimento: "Data de nascimento",
  observacoesMedicas: "Observações médicas",
  rg: "RG",
};

const complianceDateTimeFormatter = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "short",
  timeZone: "America/Sao_Paulo",
});

function normalizeFieldKey(value: string): string {
  return value
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, " ")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "");
}

export function resolveComplianceFieldLabel(value: string): string {
  const normalizedKey = normalizeFieldKey(value);
  return EXPOSURE_LABELS[normalizedKey] ?? value.trim();
}

export function normalizeComplianceTermsStatus(input: {
  termosAceitos: number;
  termosPendentes: number;
  statusTermos?: ComplianceTermsStatus;
}): ComplianceTermsStatus {
  if (input.statusTermos === "ACEITO" || input.statusTermos === "PARCIAL" || input.statusTermos === "PENDENTE") {
    return input.statusTermos;
  }
  if (input.termosPendentes <= 0 && input.termosAceitos > 0) {
    return "ACEITO";
  }
  if (input.termosAceitos > 0 && input.termosPendentes > 0) {
    return "PARCIAL";
  }
  return "PENDENTE";
}

export function normalizeSolicitacaoExclusaoStatus(value: unknown): SolicitacaoExclusaoStatus {
  if (typeof value !== "string") return "PENDENTE";
  const normalized = value
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[\s-]+/g, "_")
    .toUpperCase();
  if (
    normalized === "PENDENTE"
    || normalized === "EM_PROCESSAMENTO"
    || normalized === "EXECUTADA"
    || normalized === "REJEITADA"
  ) {
    return normalized;
  }
  if (normalized === "PROCESSANDO" || normalized === "EM_ANALISE") {
    return "EM_PROCESSAMENTO";
  }
  if (normalized === "CONCLUIDA" || normalized === "EXECUTADO") {
    return "EXECUTADA";
  }
  if (normalized === "NEGADA") {
    return "REJEITADA";
  }
  return "PENDENTE";
}

export function buildComplianceExposureSummary(
  academias: ComplianceAcademiaResumo[],
  exposicaoExistente?: ComplianceExposicaoCampo[]
): ComplianceExposicaoCampo[] {
  if (Array.isArray(exposicaoExistente) && exposicaoExistente.length > 0) {
    return [...exposicaoExistente]
      .map((item) => ({
        key: item.key,
        label: item.label || resolveComplianceFieldLabel(item.key),
        totalAcademias: item.totalAcademias,
        academias: [...item.academias].sort((left, right) => left.localeCompare(right, "pt-BR")),
      }))
      .sort((left, right) => right.totalAcademias - left.totalAcademias || left.label.localeCompare(right.label, "pt-BR"));
  }

  const exposureMap = new Map<string, Set<string>>();
  for (const academia of academias) {
    const uniqueFields = new Set(
      academia.camposSensiveis
        .map((field) => normalizeFieldKey(field))
        .filter(Boolean)
    );

    for (const field of uniqueFields) {
      const academiasByField = exposureMap.get(field) ?? new Set<string>();
      academiasByField.add(academia.academiaNome);
      exposureMap.set(field, academiasByField);
    }
  }

  return [...exposureMap.entries()]
    .map(([key, academiasPorCampo]) => ({
      key,
      label: resolveComplianceFieldLabel(key),
      totalAcademias: academiasPorCampo.size,
      academias: [...academiasPorCampo].sort((left, right) => left.localeCompare(right, "pt-BR")),
    }))
    .sort((left, right) => right.totalAcademias - left.totalAcademias || left.label.localeCompare(right.label, "pt-BR"));
}

export function countComplianceDataPoints(academias: ComplianceAcademiaResumo[]): number {
  return academias.reduce(
    (total, academia) => total + academia.alunosComCpf + academia.alunosComEmail + academia.alunosComTelefone,
    0
  );
}

export function formatComplianceDateTime(value?: string): string {
  if (!value) return "Sem registro";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Sem registro";
  return complianceDateTimeFormatter.format(date);
}

export function getLatestDeletionRequestDate(
  solicitacoes: SolicitacaoExclusao[],
  academiaId?: string,
  academiaNome?: string
): string | undefined {
  const lastRequest = solicitacoes
    .filter((item) => {
      if (academiaId && item.academiaId) {
        return item.academiaId === academiaId;
      }
      return item.academiaNome === academiaNome;
    })
    .map((item) => item.solicitadoEm)
    .filter((value): value is string => Boolean(value))
    .sort((left, right) => new Date(right).getTime() - new Date(left).getTime())[0];

  return lastRequest;
}

export function applyComplianceDashboardDefaults(input: ComplianceDashboard): ComplianceDashboard {
  const academias = input.academias.map((academia) => ({
    ...academia,
    statusTermos: normalizeComplianceTermsStatus(academia),
    camposSensiveis: [...academia.camposSensiveis].map(resolveComplianceFieldLabel),
  }));

  return {
    ...input,
    academias,
    totalDadosPessoaisArmazenados:
      input.totalDadosPessoaisArmazenados > 0
        ? input.totalDadosPessoaisArmazenados
        : countComplianceDataPoints(academias),
    solicitacoesExclusaoPendentes:
      input.solicitacoesExclusaoPendentes > 0
        ? input.solicitacoesExclusaoPendentes
        : input.solicitacoesPendentes.filter((item) => item.status === "PENDENTE").length,
    exposicaoCamposSensiveis: buildComplianceExposureSummary(academias, input.exposicaoCamposSensiveis),
  };
}
