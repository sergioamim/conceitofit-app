import type {
  AcademiaContractStatus,
  AcademiaHealthLevel,
  AcademiaHealthStatus,
  AcademiasHealthMap,
  AlertaOperacional,
  AlertaOperacionalSeveridade,
  AlertaOperacionalTipo,
  AlertasOperacionaisResult,
  FeatureUsageAcademia,
  FeatureUsageByAcademiaResult,
  FeatureUsageIndicator,
  FeatureUsageStatus,
  MetricasOperacionaisGlobal,
  MetricasOperacionaisGlobalAcademia,
  MetricasOperacionaisGlobalSerie,
} from "@/lib/types";
import { normalizeAcademiaHealthStatus } from "@/lib/admin-health";
import { apiRequest } from "./http";

type Envelope<T> =
  | T
  | {
      data?: T;
      content?: T;
      result?: T;
      dashboard?: T;
      metrics?: T;
      metrica?: T;
    };

type SerieApiResponse = {
  referencia?: unknown;
  mes?: unknown;
  label?: unknown;
  descricao?: unknown;
  total?: unknown;
  quantidade?: unknown;
  novosAlunos?: unknown;
  novos?: unknown;
};

type DistribuicaoAcademiaApiResponse = {
  academiaId?: unknown;
  academiaNome?: unknown;
  nome?: unknown;
  unidades?: unknown;
  totalUnidades?: unknown;
  alunosAtivos?: unknown;
  totalAlunosAtivos?: unknown;
  alunos?: unknown;
  matriculasAtivas?: unknown;
  totalMatriculasAtivas?: unknown;
  matriculas?: unknown;
  vendasMesQuantidade?: unknown;
  quantidadeVendasMes?: unknown;
  vendasQuantidade?: unknown;
  vendasMesValor?: unknown;
  valorVendasMes?: unknown;
  vendasValor?: unknown;
  ticketMedio?: unknown;
  ticketMedioGlobal?: unknown;
};

type MetricasOperacionaisGlobalApiResponse = Partial<MetricasOperacionaisGlobal> & {
  totalAlunosAtivos?: unknown;
  totalMatriculasAtivas?: unknown;
  vendasMesQuantidade?: unknown;
  vendasDoMesQuantidade?: unknown;
  quantidadeVendasMes?: unknown;
  vendasMesValor?: unknown;
  vendasDoMesValor?: unknown;
  valorVendasMes?: unknown;
  ticketMedioGlobal?: unknown;
  ticketMedio?: unknown;
  novosAlunosMes?: unknown;
  novasMatriculasMes?: unknown;
  novosAlunosMesAnterior?: unknown;
  novasMatriculasMesAnterior?: unknown;
  tendenciaCrescimentoPercentual?: unknown;
  tendenciaCrescimento?: unknown;
  evolucaoNovosAlunos?: unknown;
  novosAlunosPorMes?: unknown;
  serieNovosAlunos?: unknown;
  distribuicaoAcademias?: unknown;
  academias?: unknown;
  generatedAt?: unknown;
};

type AcademiaHealthStatusApiResponse = Partial<AcademiaHealthStatus> & {
  academiaId?: unknown;
  academiaNome?: unknown;
  nome?: unknown;
  unidades?: unknown;
  totalUnidades?: unknown;
  alunosAtivos?: unknown;
  totalAlunosAtivos?: unknown;
  churnMensal?: unknown;
  churn?: unknown;
  inadimplenciaPercentual?: unknown;
  inadimplenciaPct?: unknown;
  ultimoLoginAdmin?: unknown;
  ultimoLoginAdministrador?: unknown;
  statusContrato?: unknown;
  contratoStatus?: unknown;
  planoContratado?: unknown;
  plano?: unknown;
  alertasRisco?: unknown;
  alertas?: unknown;
  healthLevel?: unknown;
  saude?: unknown;
  diasSemLoginAdmin?: unknown;
};

type AcademiasHealthMapApiResponse = Partial<AcademiasHealthMap> & {
  items?: unknown;
  academias?: unknown;
  rows?: unknown;
  generatedAt?: unknown;
};

type AlertaOperacionalApiResponse = Partial<AlertaOperacional> & {
  academiaId?: unknown;
  academiaNome?: unknown;
  nomeAcademia?: unknown;
  unidadeNome?: unknown;
  tipo?: unknown;
  severidade?: unknown;
  severity?: unknown;
  titulo?: unknown;
  title?: unknown;
  descricao?: unknown;
  description?: unknown;
  acaoSugerida?: unknown;
  suggestedAction?: unknown;
  data?: unknown;
  createdAt?: unknown;
  detectedAt?: unknown;
  valorReferencia?: unknown;
  thresholdValue?: unknown;
};

type AlertasOperacionaisApiResponse = Partial<AlertasOperacionaisResult> & {
  items?: unknown;
  alertas?: unknown;
  rows?: unknown;
  generatedAt?: unknown;
};

type FeatureUsageIndicatorApiResponse = Partial<FeatureUsageIndicator> & {
  ativa?: unknown;
  enabled?: unknown;
  habilitada?: unknown;
  emUso?: unknown;
  used?: unknown;
  uso?: unknown;
  status?: unknown;
  ultimoUsoEm?: unknown;
  lastUsedAt?: unknown;
};

type FeatureUsageAcademiaApiResponse = Partial<FeatureUsageAcademia> & {
  academiaId?: unknown;
  academiaNome?: unknown;
  nome?: unknown;
  treinos?: unknown;
  crm?: unknown;
  catraca?: unknown;
  vendasOnline?: unknown;
  vendas_online?: unknown;
  bi?: unknown;
  features?: unknown;
};

type FeatureUsageByAcademiaApiResponse = Partial<FeatureUsageByAcademiaResult> & {
  items?: unknown;
  academias?: unknown;
  rows?: unknown;
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

function toOptionalNumber(value: unknown): number | undefined {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function computeGrowthPercent(current: number, previous: number): number {
  if (previous <= 0) {
    if (current <= 0) return 0;
    return 100;
  }
  return ((current - previous) / previous) * 100;
}

function extractPayload<T>(response: Envelope<T>): T {
  if (!response || typeof response !== "object") return {} as T;
  if (
    "data" in response ||
    "content" in response ||
    "result" in response ||
    "dashboard" in response ||
    "metrics" in response ||
    "metrica" in response
  ) {
    const wrapped = response as Exclude<Envelope<T>, T>;
    return (
      wrapped.data ??
      wrapped.content ??
      wrapped.result ??
      wrapped.dashboard ??
      wrapped.metrics ??
      wrapped.metrica ??
      ({} as T)
    );
  }
  return response as T;
}

function normalizeSerie(input: SerieApiResponse, index: number): MetricasOperacionaisGlobalSerie {
  return {
    referencia: cleanString(input.referencia) ?? cleanString(input.mes) ?? `serie-${index + 1}`,
    label: cleanString(input.label) ?? cleanString(input.descricao) ?? cleanString(input.mes) ?? `Mês ${index + 1}`,
    total: Math.max(0, toNumber(input.total ?? input.quantidade ?? input.novosAlunos ?? input.novos, 0)),
  };
}

function normalizeDistribuicaoAcademia(
  input: DistribuicaoAcademiaApiResponse
): MetricasOperacionaisGlobalAcademia {
  const vendasMesQuantidade = Math.max(
    0,
    toNumber(input.vendasMesQuantidade ?? input.quantidadeVendasMes ?? input.vendasQuantidade, 0)
  );
  const vendasMesValor = Math.max(
    0,
    toNumber(input.vendasMesValor ?? input.valorVendasMes ?? input.vendasValor, 0)
  );

  return {
    academiaId: cleanString(input.academiaId),
    academiaNome: cleanString(input.academiaNome) ?? cleanString(input.nome) ?? "Academia sem nome",
    unidades: Math.max(0, toNumber(input.unidades ?? input.totalUnidades, 0)),
    alunosAtivos: Math.max(0, toNumber(input.alunosAtivos ?? input.totalAlunosAtivos ?? input.alunos, 0)),
    matriculasAtivas: Math.max(
      0,
      toNumber(input.matriculasAtivas ?? input.totalMatriculasAtivas ?? input.matriculas, 0)
    ),
    vendasMesQuantidade,
    vendasMesValor,
    ticketMedio: Math.max(
      0,
      toNumber(
        input.ticketMedio,
        vendasMesQuantidade > 0 ? vendasMesValor / vendasMesQuantidade : toNumber(input.ticketMedioGlobal, 0)
      )
    ),
  };
}

function normalizeMetricasOperacionaisGlobal(
  response: Envelope<MetricasOperacionaisGlobalApiResponse>
): MetricasOperacionaisGlobal {
  const payload = extractPayload(response);
  const series = payload.evolucaoNovosAlunos ?? payload.novosAlunosPorMes ?? payload.serieNovosAlunos;
  const distribuicao = payload.distribuicaoAcademias ?? payload.academias;
  const novosAlunosMes = Math.max(0, toNumber(payload.novosAlunosMes ?? payload.novasMatriculasMes, 0));
  const novosAlunosMesAnterior = Math.max(
    0,
    toNumber(payload.novosAlunosMesAnterior ?? payload.novasMatriculasMesAnterior, 0)
  );
  const tendencia = toNumber(
    payload.tendenciaCrescimentoPercentual ?? payload.tendenciaCrescimento,
    computeGrowthPercent(novosAlunosMes, novosAlunosMesAnterior)
  );

  return {
    totalAlunosAtivos: Math.max(0, toNumber(payload.totalAlunosAtivos, 0)),
    totalMatriculasAtivas: Math.max(0, toNumber(payload.totalMatriculasAtivas, 0)),
    vendasMesQuantidade: Math.max(
      0,
      toNumber(payload.vendasMesQuantidade ?? payload.vendasDoMesQuantidade ?? payload.quantidadeVendasMes, 0)
    ),
    vendasMesValor: Math.max(
      0,
      toNumber(payload.vendasMesValor ?? payload.vendasDoMesValor ?? payload.valorVendasMes, 0)
    ),
    ticketMedioGlobal: Math.max(0, toNumber(payload.ticketMedioGlobal ?? payload.ticketMedio, 0)),
    novosAlunosMes,
    novosAlunosMesAnterior,
    tendenciaCrescimentoPercentual: tendencia,
    evolucaoNovosAlunos: Array.isArray(series)
      ? (series as SerieApiResponse[]).map((item, index) => normalizeSerie(item, index))
      : [],
    distribuicaoAcademias: Array.isArray(distribuicao)
      ? (distribuicao as DistribuicaoAcademiaApiResponse[]).map((item) => normalizeDistribuicaoAcademia(item))
      : [],
    generatedAt: cleanString(payload.generatedAt),
  };
}

function normalizeStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => cleanString(item))
    .filter((item): item is string => Boolean(item));
}

function normalizeHealthLevel(value: unknown): AcademiaHealthLevel | undefined {
  if (typeof value !== "string") return undefined;
  if (value === "SAUDAVEL" || value === "RISCO" || value === "CRITICO") return value;
  return undefined;
}

function normalizeAlertSeverity(value: unknown): AlertaOperacionalSeveridade {
  if (value === "INFO" || value === "WARNING" || value === "CRITICAL") return value;
  if (typeof value !== "string") return "INFO";

  const normalized = value.trim().toUpperCase();
  if (normalized === "WARN" || normalized === "ATENCAO") return "WARNING";
  if (normalized === "CRITICO" || normalized === "CRITICAL") return "CRITICAL";
  return "INFO";
}

function normalizeAlertType(value: unknown): AlertaOperacionalTipo {
  if (
    value === "SEM_LOGIN_ADMIN" ||
    value === "SEM_MATRICULAS_ATIVAS" ||
    value === "PICO_CANCELAMENTOS" ||
    value === "CONTRATO_VENCENDO" ||
    value === "INADIMPLENCIA_ALTA" ||
    value === "OUTRO"
  ) {
    return value;
  }
  return "OUTRO";
}

function deriveFeatureUsageStatus(ativa: boolean, emUso: boolean): FeatureUsageStatus {
  if (!ativa) return "INATIVA";
  if (emUso) return "EM_USO";
  return "ATIVA_SEM_USO";
}

function normalizeFeatureUsageIndicator(input: unknown): FeatureUsageIndicator {
  const payload = input && typeof input === "object" ? (input as FeatureUsageIndicatorApiResponse) : {};
  const ativa = Boolean(payload.ativa ?? payload.enabled ?? payload.habilitada);
  const emUso = Boolean(payload.emUso ?? payload.used ?? payload.uso);
  const statusValue = payload.status;

  return {
    ativa,
    emUso,
    status:
      statusValue === "INATIVA" || statusValue === "ATIVA_SEM_USO" || statusValue === "EM_USO"
        ? statusValue
        : deriveFeatureUsageStatus(ativa, emUso),
    ultimoUsoEm: cleanString(payload.ultimoUsoEm) ?? cleanString(payload.lastUsedAt),
  };
}

function normalizeContractStatus(value: unknown): AcademiaContractStatus {
  if (value === "ATIVO" || value === "EM_RISCO" || value === "SUSPENSO" || value === "CANCELADO") {
    return value;
  }
  return "ATIVO";
}

function normalizeAcademiaHealthStatusResponse(
  input: AcademiaHealthStatusApiResponse
): AcademiaHealthStatus {
  return normalizeAcademiaHealthStatus({
    academiaId: cleanString(input.academiaId),
    academiaNome: cleanString(input.academiaNome) ?? cleanString(input.nome) ?? "Academia sem nome",
    unidades: Math.max(0, toNumber(input.unidades ?? input.totalUnidades, 0)),
    alunosAtivos: Math.max(0, toNumber(input.alunosAtivos ?? input.totalAlunosAtivos, 0)),
    churnMensal: Math.max(0, toNumber(input.churnMensal ?? input.churn, 0)),
    inadimplenciaPercentual: Math.max(0, toNumber(input.inadimplenciaPercentual ?? input.inadimplenciaPct, 0)),
    ultimoLoginAdmin: cleanString(input.ultimoLoginAdmin) ?? cleanString(input.ultimoLoginAdministrador),
    statusContrato: normalizeContractStatus(input.statusContrato ?? input.contratoStatus),
    planoContratado: cleanString(input.planoContratado) ?? cleanString(input.plano),
    alertasRisco: normalizeStringArray(input.alertasRisco ?? input.alertas),
    healthLevel: normalizeHealthLevel(input.healthLevel ?? input.saude) ?? "SAUDAVEL",
    diasSemLoginAdmin: toOptionalNumber(input.diasSemLoginAdmin),
  });
}

function normalizeAcademiasHealthMap(
  response: Envelope<AcademiasHealthMapApiResponse>
): AcademiasHealthMap {
  const payload = extractPayload(response);
  const items = payload.items ?? payload.academias ?? payload.rows;

  return {
    items: Array.isArray(items) ? (items as AcademiaHealthStatusApiResponse[]).map(normalizeAcademiaHealthStatusResponse) : [],
    generatedAt: cleanString(payload.generatedAt),
  };
}

function normalizeAlertaOperacional(input: AlertaOperacionalApiResponse, index: number): AlertaOperacional {
  return {
    id: cleanString(input.id) ?? `alerta-${index + 1}`,
    academiaId: cleanString(input.academiaId),
    academiaNome: cleanString(input.academiaNome) ?? cleanString(input.nomeAcademia) ?? "Academia sem nome",
    unidadeNome: cleanString(input.unidadeNome),
    tipo: normalizeAlertType(input.tipo),
    severidade: normalizeAlertSeverity(input.severidade ?? input.severity),
    titulo: cleanString(input.titulo) ?? cleanString(input.title) ?? "Alerta operacional",
    descricao: cleanString(input.descricao) ?? cleanString(input.description) ?? "Sem descrição detalhada.",
    acaoSugerida:
      cleanString(input.acaoSugerida) ??
      cleanString(input.suggestedAction) ??
      "Avaliar operação da academia e acionar o time responsável.",
    data:
      cleanString(input.data) ??
      cleanString(input.createdAt) ??
      cleanString(input.detectedAt) ??
      new Date(0).toISOString(),
    valorReferencia: toOptionalNumber(input.valorReferencia ?? input.thresholdValue),
  };
}

function normalizeAlertasOperacionais(
  response: Envelope<AlertasOperacionaisApiResponse>
): AlertasOperacionaisResult {
  const payload = extractPayload(response);
  const items = payload.items ?? payload.alertas ?? payload.rows;

  return {
    items: Array.isArray(items)
      ? (items as AlertaOperacionalApiResponse[]).map((item, index) => normalizeAlertaOperacional(item, index))
      : [],
    generatedAt: cleanString(payload.generatedAt),
  };
}

function normalizeFeatureUsageAcademia(input: FeatureUsageAcademiaApiResponse): FeatureUsageAcademia {
  const featureMap = input.features && typeof input.features === "object" ? (input.features as Record<string, unknown>) : {};

  return {
    academiaId: cleanString(input.academiaId),
    academiaNome: cleanString(input.academiaNome) ?? cleanString(input.nome) ?? "Academia sem nome",
    treinos: normalizeFeatureUsageIndicator(input.treinos ?? featureMap.treinos),
    crm: normalizeFeatureUsageIndicator(input.crm ?? featureMap.crm),
    catraca: normalizeFeatureUsageIndicator(input.catraca ?? featureMap.catraca),
    vendasOnline: normalizeFeatureUsageIndicator(input.vendasOnline ?? input.vendas_online ?? featureMap.vendasOnline),
    bi: normalizeFeatureUsageIndicator(input.bi ?? featureMap.bi),
  };
}

function normalizeFeatureUsageByAcademia(
  response: Envelope<FeatureUsageByAcademiaApiResponse>
): FeatureUsageByAcademiaResult {
  const payload = extractPayload(response);
  const items = payload.items ?? payload.academias ?? payload.rows;

  return {
    items: Array.isArray(items) ? (items as FeatureUsageAcademiaApiResponse[]).map(normalizeFeatureUsageAcademia) : [],
    generatedAt: cleanString(payload.generatedAt),
  };
}

export async function getMetricasOperacionaisGlobal(): Promise<MetricasOperacionaisGlobal> {
  const response = await apiRequest<Envelope<MetricasOperacionaisGlobalApiResponse>>({
    path: "/api/v1/admin/metricas/operacionais/global",
  });

  return normalizeMetricasOperacionaisGlobal(response);
}

export async function getAcademiasHealthMap(): Promise<AcademiasHealthMap> {
  const response = await apiRequest<Envelope<AcademiasHealthMapApiResponse>>({
    path: "/api/v1/admin/metricas/operacionais/saude",
  });

  return normalizeAcademiasHealthMap(response);
}

export async function getAlertasOperacionais(): Promise<AlertasOperacionaisResult> {
  const response = await apiRequest<Envelope<AlertasOperacionaisApiResponse>>({
    path: "/api/v1/admin/metricas/operacionais/alertas",
  });

  return normalizeAlertasOperacionais(response);
}

export async function getFeatureUsageByAcademia(): Promise<FeatureUsageByAcademiaResult> {
  const response = await apiRequest<Envelope<FeatureUsageByAcademiaApiResponse>>({
    path: "/api/v1/admin/metricas/operacionais/features",
  });

  return normalizeFeatureUsageByAcademia(response);
}
