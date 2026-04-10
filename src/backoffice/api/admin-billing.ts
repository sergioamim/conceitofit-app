import type {
  Cobranca,
  CobrancaStatus,
  CicloPlanoPlataforma,
  ContratoPlataforma,
  DashboardFinanceiroAdmin,
  DashboardFinanceiroAgingFaixa,
  DashboardFinanceiroAgingItem,
  DashboardFinanceiroInadimplente,
  DashboardFinanceiroMrrSerie,
  DashboardFinanceiroPlanoComparativo,
  DashboardFinanceiroPeriodo,
  PlanoPlataforma,
  StatusContratoPlataforma,
  TipoFormaPagamento,
} from "@/lib/types";
import { apiRequest } from "@/lib/api/http";

type PlanoPlataformaApiResponse = Partial<PlanoPlataforma> & {
  id?: string | null;
  nome?: string | null;
  descricao?: string | null;
  precoMensal?: unknown;
  precoAnual?: unknown;
  ciclo?: CicloPlanoPlataforma | null;
  maxUnidades?: unknown;
  maxAlunos?: unknown;
  featuresIncluidas?: unknown;
  ativo?: unknown;
};

type PlanoPlataformaPayload = Omit<PlanoPlataforma, "id">;

type ContratoPlataformaApiResponse = Partial<ContratoPlataforma> & {
  id?: string | null;
  academiaId?: string | null;
  planoId?: string | null;
  planoNome?: string | null;
  academiaNome?: string | null;
  dataInicio?: string | null;
  dataFim?: string | null;
  ciclo?: CicloPlanoPlataforma | null;
  valorMensal?: unknown;
  status?: StatusContratoPlataforma | null;
  motivoSuspensao?: string | null;
  historicoPlanosIds?: unknown;
};

type ContratoPlataformaPayload = Omit<ContratoPlataforma, "id" | "planoNome" | "academiaNome">;

type CobrancaApiResponse = Partial<Cobranca> & {
  id?: string | null;
  contratoId?: string | null;
  academiaId?: string | null;
  academiaNome?: string | null;
  valor?: unknown;
  dataVencimento?: string | null;
  dataPagamento?: string | null;
  status?: CobrancaStatus | null;
  formaPagamento?: TipoFormaPagamento | null;
  multa?: unknown;
  juros?: unknown;
  observacoes?: string | null;
};

type CobrancaPayload = Omit<Cobranca, "id" | "academiaNome">;

type DashboardFinanceiroMrrSerieApiResponse = Partial<DashboardFinanceiroMrrSerie> & {
  referencia?: unknown;
  mes?: unknown;
  label?: unknown;
  descricao?: unknown;
  mrr?: unknown;
  valor?: unknown;
  total?: unknown;
};

type DashboardFinanceiroAgingItemApiResponse = Partial<DashboardFinanceiroAgingItem> & {
  faixa?: unknown;
  label?: unknown;
  descricao?: unknown;
  quantidade?: unknown;
  total?: unknown;
  valor?: unknown;
};

type DashboardFinanceiroInadimplenteApiResponse = Partial<DashboardFinanceiroInadimplente> & {
  academiaId?: unknown;
  academiaNome?: unknown;
  nomeAcademia?: unknown;
  contratoId?: unknown;
  cobrancaId?: unknown;
  planoNome?: unknown;
  nomePlano?: unknown;
  valorEmAberto?: unknown;
  valorAberto?: unknown;
  valor?: unknown;
  diasEmAtraso?: unknown;
  atrasoDias?: unknown;
  ultimaCobrancaVencida?: unknown;
  ultimaDataVencimento?: unknown;
};

type DashboardFinanceiroPlanoComparativoApiResponse = Partial<DashboardFinanceiroPlanoComparativo> & {
  planoId?: unknown;
  planoNome?: unknown;
  nomePlano?: unknown;
  academiasAtivas?: unknown;
  quantidadeAcademias?: unknown;
  mrr?: unknown;
  valor?: unknown;
  participacaoPct?: unknown;
  participacao?: unknown;
};

type DashboardFinanceiroAdminApiResponse = Partial<DashboardFinanceiroAdmin> & {
  mrrAtual?: unknown;
  mrrProjetado?: unknown;
  totalAcademiasAtivas?: unknown;
  academiasAtivas?: unknown;
  totalInadimplentes?: unknown;
  academiasInadimplentes?: unknown;
  churnRateMensal?: unknown;
  churnMensal?: unknown;
  previsaoReceita?: unknown;
  receitaPrevista?: unknown;
  evolucaoMrr?: unknown;
  serieMrr?: unknown;
  aging?: unknown;
  agingCobrancas?: unknown;
  inadimplentes?: unknown;
  academiasInadimplentesLista?: unknown;
  comparativoPlanos?: unknown;
  mrrPorPlano?: unknown;
  generatedAt?: unknown;
 };

type AnyListResponse<T> =
  | T[]
  | {
      items?: T[];
      content?: T[];
      data?: T[];
      rows?: T[];
      result?: T[];
      itens?: T[];
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
  if (value == null || value === "") return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function toBoolean(value: unknown, fallback = true): boolean {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value === 1;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (normalized === "true" || normalized === "1" || normalized === "sim") return true;
    if (normalized === "false" || normalized === "0" || normalized === "nao" || normalized === "não") return false;
  }
  return fallback;
}

function extractItems<T>(response: AnyListResponse<T>): T[] {
  if (Array.isArray(response)) return response;
  return response.items ?? response.content ?? response.data ?? response.rows ?? response.result ?? response.itens ?? [];
}

function normalizeFeatures(value: unknown): string[] {
  // Backend persiste como String (JSON serializado). Pode vir como:
  // - String JSON: '["feat1","feat2"]'
  // - String separada por \n ou ,
  // - Array direto (compat)
  if (Array.isArray(value)) {
    return value
      .map((item) => cleanString(item))
      .filter((item): item is string => Boolean(item));
  }
  if (typeof value === "string" && value.trim()) {
    const trimmed = value.trim();
    if (trimmed.startsWith("[")) {
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) {
          return parsed
            .map((item) => cleanString(item))
            .filter((item): item is string => Boolean(item));
        }
      } catch {
        // ignora, cai para split
      }
    }
    return trimmed
      .split(/[\n,]/)
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return [];
}

function normalizeIds(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => cleanString(item))
    .filter((item): item is string => Boolean(item));
}

function normalizeAgingFaixa(value: unknown): DashboardFinanceiroAgingFaixa {
  if (value === "0_15" || value === "16_30" || value === "31_60" || value === "60_PLUS") {
    return value;
  }
  if (typeof value !== "string") return "0_15";
  const normalized = value.trim().toUpperCase();
  if (normalized === "0-15" || normalized === "0A15") return "0_15";
  if (normalized === "16-30" || normalized === "16A30") return "16_30";
  if (normalized === "31-60" || normalized === "31A60") return "31_60";
  return "60_PLUS";
}

function normalizePlanoPlataforma(
  input: PlanoPlataformaApiResponse,
  fallback?: Partial<PlanoPlataformaPayload> & { id?: string }
): PlanoPlataforma {
  return {
    id: cleanString(input.id) ?? fallback?.id ?? "",
    nome: cleanString(input.nome) ?? fallback?.nome ?? "",
    descricao: cleanString(input.descricao) ?? fallback?.descricao,
    precoMensal: toNumber(input.precoMensal, fallback?.precoMensal ?? 0),
    precoAnual: toOptionalNumber(input.precoAnual) ?? fallback?.precoAnual,
    ciclo: input.ciclo ?? fallback?.ciclo ?? "MENSAL",
    maxUnidades: toOptionalNumber(input.maxUnidades) ?? fallback?.maxUnidades,
    maxAlunos: toOptionalNumber(input.maxAlunos) ?? fallback?.maxAlunos,
    featuresIncluidas: normalizeFeatures(input.featuresIncluidas).length
      ? normalizeFeatures(input.featuresIncluidas)
      : fallback?.featuresIncluidas ?? [],
    ativo: toBoolean(input.ativo, fallback?.ativo ?? true),
  };
}

function buildPlanoPayload(data: PlanoPlataformaPayload): Record<string, unknown> {
  // Backend espera featuresIncluidas como String (nao array).
  // Serializamos como JSON para persistencia e parse bidirecional.
  const featuresAsString = Array.isArray(data.featuresIncluidas)
    ? JSON.stringify(data.featuresIncluidas)
    : (data.featuresIncluidas ?? "[]");
  return {
    nome: cleanString(data.nome) ?? "",
    descricao: cleanString(data.descricao),
    precoMensal: data.precoMensal,
    precoAnual: data.precoAnual,
    ciclo: data.ciclo,
    maxUnidades: data.maxUnidades,
    maxAlunos: data.maxAlunos,
    featuresIncluidas: featuresAsString,
    ativo: data.ativo,
  };
}

function normalizeContratoPlataforma(
  input: ContratoPlataformaApiResponse,
  fallback?: Partial<ContratoPlataformaPayload> & { id?: string }
): ContratoPlataforma {
  return {
    id: cleanString(input.id) ?? fallback?.id ?? "",
    academiaId: cleanString(input.academiaId) ?? fallback?.academiaId ?? "",
    planoId: cleanString(input.planoId) ?? fallback?.planoId ?? "",
    planoNome: cleanString(input.planoNome) ?? "",
    academiaNome: cleanString(input.academiaNome) ?? "",
    dataInicio: cleanString(input.dataInicio) ?? fallback?.dataInicio ?? "",
    dataFim: cleanString(input.dataFim) ?? fallback?.dataFim,
    ciclo: input.ciclo ?? fallback?.ciclo ?? "MENSAL",
    valorMensal: toNumber(input.valorMensal, fallback?.valorMensal ?? 0),
    status: input.status ?? fallback?.status ?? "ATIVO",
    motivoSuspensao: cleanString(input.motivoSuspensao) ?? fallback?.motivoSuspensao,
    historicoPlanosIds: normalizeIds(input.historicoPlanosIds).length
      ? normalizeIds(input.historicoPlanosIds)
      : fallback?.historicoPlanosIds ?? [],
  };
}

function buildContratoPayload(data: ContratoPlataformaPayload): Record<string, unknown> {
  return {
    academiaId: data.academiaId,
    planoId: data.planoId,
    dataInicio: data.dataInicio,
    dataFim: data.dataFim,
    ciclo: data.ciclo,
    valorMensal: data.valorMensal,
    status: data.status,
    motivoSuspensao: cleanString(data.motivoSuspensao),
    historicoPlanosIds: data.historicoPlanosIds,
  };
}

function normalizeCobranca(input: CobrancaApiResponse, fallback?: Partial<CobrancaPayload> & { id?: string }): Cobranca {
  return {
    id: cleanString(input.id) ?? fallback?.id ?? "",
    contratoId: cleanString(input.contratoId) ?? fallback?.contratoId ?? "",
    academiaId: cleanString(input.academiaId) ?? fallback?.academiaId ?? "",
    academiaNome: cleanString(input.academiaNome) ?? "",
    valor: toNumber(input.valor, fallback?.valor ?? 0),
    dataVencimento: cleanString(input.dataVencimento) ?? fallback?.dataVencimento ?? "",
    dataPagamento: cleanString(input.dataPagamento) ?? fallback?.dataPagamento,
    status: input.status ?? fallback?.status ?? "PENDENTE",
    formaPagamento: input.formaPagamento ?? fallback?.formaPagamento,
    multa: toOptionalNumber(input.multa) ?? fallback?.multa,
    juros: toOptionalNumber(input.juros) ?? fallback?.juros,
    observacoes: cleanString(input.observacoes) ?? fallback?.observacoes,
  };
}

function buildCobrancaPayload(data: CobrancaPayload): Record<string, unknown> {
  return {
    contratoId: data.contratoId,
    academiaId: data.academiaId,
    valor: data.valor,
    dataVencimento: data.dataVencimento,
    dataPagamento: data.dataPagamento,
    status: data.status,
    formaPagamento: data.formaPagamento,
    multa: data.multa,
    juros: data.juros,
    observacoes: cleanString(data.observacoes),
  };
}

function normalizeDashboardMrrSerie(
  input: DashboardFinanceiroMrrSerieApiResponse,
  index: number
): DashboardFinanceiroMrrSerie {
  return {
    referencia: cleanString(input.referencia) ?? cleanString(input.mes) ?? `serie-${index + 1}`,
    label: cleanString(input.label) ?? cleanString(input.descricao) ?? cleanString(input.mes) ?? `Período ${index + 1}`,
    mrr: toNumber(input.mrr ?? input.valor ?? input.total, 0),
  };
}

function normalizeDashboardAgingItem(input: DashboardFinanceiroAgingItemApiResponse): DashboardFinanceiroAgingItem {
  const faixa = normalizeAgingFaixa(input.faixa);
  const labels: Record<DashboardFinanceiroAgingFaixa, string> = {
    "0_15": "0 a 15 dias",
    "16_30": "16 a 30 dias",
    "31_60": "31 a 60 dias",
    "60_PLUS": "60+ dias",
  };

  return {
    faixa,
    label: cleanString(input.label) ?? cleanString(input.descricao) ?? labels[faixa],
    quantidade: Math.max(0, toNumber(input.quantidade ?? input.total, 0)),
    valor: Math.max(0, toNumber(input.valor, 0)),
  };
}

function normalizeDashboardInadimplente(
  input: DashboardFinanceiroInadimplenteApiResponse
): DashboardFinanceiroInadimplente {
  return {
    academiaId: cleanString(input.academiaId),
    academiaNome: cleanString(input.academiaNome) ?? cleanString(input.nomeAcademia) ?? "Academia sem nome",
    contratoId: cleanString(input.contratoId),
    cobrancaId: cleanString(input.cobrancaId),
    planoNome: cleanString(input.planoNome) ?? cleanString(input.nomePlano),
    valorEmAberto: Math.max(0, toNumber(input.valorEmAberto ?? input.valorAberto ?? input.valor, 0)),
    diasEmAtraso: Math.max(0, toNumber(input.diasEmAtraso ?? input.atrasoDias, 0)),
    ultimaCobrancaVencida: cleanString(input.ultimaCobrancaVencida) ?? cleanString(input.ultimaDataVencimento),
  };
}

function normalizeDashboardPlanoComparativo(
  input: DashboardFinanceiroPlanoComparativoApiResponse
): DashboardFinanceiroPlanoComparativo {
  return {
    planoId: cleanString(input.planoId),
    planoNome: cleanString(input.planoNome) ?? cleanString(input.nomePlano) ?? "Plano não identificado",
    academiasAtivas: Math.max(0, toNumber(input.academiasAtivas ?? input.quantidadeAcademias, 0)),
    mrr: Math.max(0, toNumber(input.mrr ?? input.valor, 0)),
    participacaoPct: Math.max(0, toNumber(input.participacaoPct ?? input.participacao, 0)),
  };
}

function normalizeDashboardFinanceiroAdmin(
  response: DashboardFinanceiroAdminApiResponse
): DashboardFinanceiroAdmin {
  const evolucao = Array.isArray(response.evolucaoMrr ?? response.serieMrr)
    ? ((response.evolucaoMrr ?? response.serieMrr) as DashboardFinanceiroMrrSerieApiResponse[]).map((item, index) =>
        normalizeDashboardMrrSerie(item, index)
      )
    : [];
  const aging = Array.isArray(response.aging ?? response.agingCobrancas)
    ? ((response.aging ?? response.agingCobrancas) as DashboardFinanceiroAgingItemApiResponse[]).map(
        normalizeDashboardAgingItem
      )
    : [];
  const inadimplentes = Array.isArray(response.inadimplentes ?? response.academiasInadimplentesLista)
    ? ((response.inadimplentes ?? response.academiasInadimplentesLista) as DashboardFinanceiroInadimplenteApiResponse[]).map(
        normalizeDashboardInadimplente
      )
    : [];
  const comparativoPlanos = Array.isArray(response.comparativoPlanos ?? response.mrrPorPlano)
    ? ((response.comparativoPlanos ?? response.mrrPorPlano) as DashboardFinanceiroPlanoComparativoApiResponse[]).map(
        normalizeDashboardPlanoComparativo
      )
    : [];

  return {
    mrrAtual: Math.max(0, toNumber(response.mrrAtual, 0)),
    mrrProjetado: Math.max(0, toNumber(response.mrrProjetado, 0)),
    totalAcademiasAtivas: Math.max(0, toNumber(response.totalAcademiasAtivas ?? response.academiasAtivas, 0)),
    totalInadimplentes: Math.max(0, toNumber(response.totalInadimplentes ?? response.academiasInadimplentes, 0)),
    churnRateMensal: Math.max(0, toNumber(response.churnRateMensal ?? response.churnMensal, 0)),
    previsaoReceita: Math.max(0, toNumber(response.previsaoReceita ?? response.receitaPrevista, 0)),
    evolucaoMrr: evolucao,
    aging,
    inadimplentes,
    comparativoPlanos,
    generatedAt: cleanString(response.generatedAt),
  };
}

export async function listAdminPlanos(): Promise<PlanoPlataforma[]> {
  const response = await apiRequest<AnyListResponse<PlanoPlataformaApiResponse>>({
    path: "/api/v1/admin/financeiro/planos",
  });
  return extractItems(response).map((item) => normalizePlanoPlataforma(item));
}

export async function createAdminPlano(data: PlanoPlataformaPayload): Promise<PlanoPlataforma> {
  const response = await apiRequest<PlanoPlataformaApiResponse>({
    path: "/api/v1/admin/financeiro/planos",
    method: "POST",
    body: buildPlanoPayload(data),
  });
  return normalizePlanoPlataforma(response, data);
}

export async function updateAdminPlano(id: string, data: PlanoPlataformaPayload): Promise<PlanoPlataforma> {
  const response = await apiRequest<PlanoPlataformaApiResponse>({
    path: `/api/v1/admin/financeiro/planos/${id}`,
    method: "PUT",
    body: buildPlanoPayload(data),
  });
  return normalizePlanoPlataforma(response, { ...data, id });
}

export async function toggleAdminPlano(id: string): Promise<PlanoPlataforma> {
  const response = await apiRequest<PlanoPlataformaApiResponse>({
    path: `/api/v1/admin/financeiro/planos/${id}/toggle`,
    method: "PATCH",
  });
  return normalizePlanoPlataforma(response, { id });
}

export async function listAdminContratos(): Promise<ContratoPlataforma[]> {
  const response = await apiRequest<AnyListResponse<ContratoPlataformaApiResponse>>({
    path: "/api/v1/admin/financeiro/contratos",
  });
  return extractItems(response).map((item) => normalizeContratoPlataforma(item));
}

export async function createAdminContrato(data: ContratoPlataformaPayload): Promise<ContratoPlataforma> {
  const response = await apiRequest<ContratoPlataformaApiResponse>({
    path: "/api/v1/admin/financeiro/contratos",
    method: "POST",
    body: buildContratoPayload(data),
  });
  return normalizeContratoPlataforma(response, data);
}

export async function updateAdminContrato(id: string, data: ContratoPlataformaPayload): Promise<ContratoPlataforma> {
  const response = await apiRequest<ContratoPlataformaApiResponse>({
    path: `/api/v1/admin/financeiro/contratos/${id}`,
    method: "PUT",
    body: buildContratoPayload(data),
  });
  return normalizeContratoPlataforma(response, { ...data, id });
}

export async function suspenderAdminContrato(id: string, motivoSuspensao?: string): Promise<ContratoPlataforma> {
  const response = await apiRequest<ContratoPlataformaApiResponse>({
    path: `/api/v1/admin/financeiro/contratos/${id}/suspender`,
    method: "PATCH",
    body: {
      motivoSuspensao: cleanString(motivoSuspensao),
    },
  });
  return normalizeContratoPlataforma(response, { id, status: "SUSPENSO", motivoSuspensao });
}

export async function reativarAdminContrato(id: string): Promise<ContratoPlataforma> {
  const response = await apiRequest<ContratoPlataformaApiResponse>({
    path: `/api/v1/admin/financeiro/contratos/${id}/reativar`,
    method: "PATCH",
  });
  return normalizeContratoPlataforma(response, { id, status: "ATIVO" });
}

export async function listAdminCobrancas(): Promise<Cobranca[]> {
  const response = await apiRequest<AnyListResponse<CobrancaApiResponse>>({
    path: "/api/v1/admin/financeiro/cobrancas",
  });
  return extractItems(response).map((item) => normalizeCobranca(item));
}

export async function createAdminCobranca(data: CobrancaPayload): Promise<Cobranca> {
  const response = await apiRequest<CobrancaApiResponse>({
    path: "/api/v1/admin/financeiro/cobrancas",
    method: "POST",
    body: buildCobrancaPayload(data),
  });
  return normalizeCobranca(response, data);
}

export async function baixarAdminCobranca(
  id: string,
  data: Pick<CobrancaPayload, "dataPagamento" | "formaPagamento" | "observacoes">
): Promise<Cobranca> {
  const response = await apiRequest<CobrancaApiResponse>({
    path: `/api/v1/admin/financeiro/cobrancas/${id}/baixar`,
    method: "PATCH",
    body: {
      dataPagamento: data.dataPagamento,
      formaPagamento: data.formaPagamento,
      observacoes: cleanString(data.observacoes),
    },
  });
  return normalizeCobranca(response, { id, status: "PAGO", ...data });
}

export async function cancelarAdminCobranca(id: string): Promise<Cobranca> {
  const response = await apiRequest<CobrancaApiResponse>({
    path: `/api/v1/admin/financeiro/cobrancas/${id}/cancelar`,
    method: "PATCH",
  });
  return normalizeCobranca(response, { id, status: "CANCELADO" });
}

export async function getDashboardFinanceiroAdmin(periodo: DashboardFinanceiroPeriodo = "12M"): Promise<DashboardFinanceiroAdmin> {
  const query = new URLSearchParams({ periodo }).toString();
  const response = await apiRequest<DashboardFinanceiroAdminApiResponse>({
    path: `/api/v1/admin/financeiro/dashboard${query ? `?${query}` : ""}`,
  });
  return normalizeDashboardFinanceiroAdmin(response);
}
