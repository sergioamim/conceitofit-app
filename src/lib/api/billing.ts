import type {
  Assinatura,
  CancelAssinaturaInput,
  CicloAssinatura,
  CobrancaRecorrente,
  CreateAssinaturaInput,
  StatusAssinatura,
  StatusCobrancaRecorrente,
} from "@/lib/types";
import { apiRequest } from "./http";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const toNumber = (value: unknown, fallback = 0): number => {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
};

const cleanString = (value: unknown): string | undefined => {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

// ---------------------------------------------------------------------------
// API response types (match backend shape, nullable fields)
// ---------------------------------------------------------------------------

type AssinaturaApiResponse = {
  id?: string | null;
  tenantId?: string | null;
  alunoId?: string | null;
  alunoNome?: string | null;
  planoId?: string | null;
  planoNome?: string | null;
  gatewayId?: string | null;
  gatewayAssinaturaId?: string | null;
  status?: string | null;
  valor?: unknown;
  ciclo?: string | null;
  diaCobranca?: unknown;
  dataInicio?: string | null;
  dataFim?: string | null;
  proximaCobranca?: string | null;
  ultimaCobranca?: string | null;
  tentativasCobrancaFalha?: unknown;
  canceladaEm?: string | null;
  motivoCancelamento?: string | null;
  dataCriacao?: string | null;
  dataAtualizacao?: string | null;
};

type CobrancaRecorrenteApiResponse = {
  id?: string | null;
  tenantId?: string | null;
  assinaturaId?: string | null;
  alunoId?: string | null;
  alunoNome?: string | null;
  valor?: unknown;
  status?: string | null;
  dataVencimento?: string | null;
  dataPagamento?: string | null;
  gatewayCobrancaId?: string | null;
  formaPagamento?: string | null;
  tentativas?: unknown;
  ultimaTentativaEm?: string | null;
  motivoFalha?: string | null;
  dataCriacao?: string | null;
};

// ---------------------------------------------------------------------------
// Normalizers
// ---------------------------------------------------------------------------

const VALID_STATUS_ASSINATURA: StatusAssinatura[] = [
  "ATIVA", "CANCELADA", "SUSPENSA", "VENCIDA", "INADIMPLENTE", "TRIAL",
];

const VALID_CICLO: CicloAssinatura[] = [
  "MENSAL", "TRIMESTRAL", "SEMESTRAL", "ANUAL",
];

const VALID_STATUS_COBRANCA: StatusCobrancaRecorrente[] = [
  "PENDENTE", "PAGO", "VENCIDO", "CANCELADO", "FALHA", "ESTORNADO",
];

function normalizeStatusAssinatura(value: unknown): StatusAssinatura {
  const upper = typeof value === "string" ? value.trim().toUpperCase() : "";
  return VALID_STATUS_ASSINATURA.includes(upper as StatusAssinatura)
    ? (upper as StatusAssinatura)
    : "ATIVA";
}

function normalizeCiclo(value: unknown): CicloAssinatura {
  const upper = typeof value === "string" ? value.trim().toUpperCase() : "";
  return VALID_CICLO.includes(upper as CicloAssinatura)
    ? (upper as CicloAssinatura)
    : "MENSAL";
}

function normalizeStatusCobranca(value: unknown): StatusCobrancaRecorrente {
  const upper = typeof value === "string" ? value.trim().toUpperCase() : "";
  return VALID_STATUS_COBRANCA.includes(upper as StatusCobrancaRecorrente)
    ? (upper as StatusCobrancaRecorrente)
    : "PENDENTE";
}

function normalizeAssinatura(input: AssinaturaApiResponse): Assinatura {
  return {
    id: input.id ?? "",
    tenantId: input.tenantId ?? "",
    alunoId: input.alunoId ?? "",
    alunoNome: cleanString(input.alunoNome),
    planoId: input.planoId ?? "",
    planoNome: cleanString(input.planoNome),
    gatewayId: cleanString(input.gatewayId),
    gatewayAssinaturaId: cleanString(input.gatewayAssinaturaId),
    status: normalizeStatusAssinatura(input.status),
    valor: toNumber(input.valor),
    ciclo: normalizeCiclo(input.ciclo),
    diaCobranca: toNumber(input.diaCobranca, 1),
    dataInicio: input.dataInicio ?? "",
    dataFim: cleanString(input.dataFim),
    proximaCobranca: cleanString(input.proximaCobranca),
    ultimaCobranca: cleanString(input.ultimaCobranca),
    tentativasCobrancaFalha: toNumber(input.tentativasCobrancaFalha, 0),
    canceladaEm: cleanString(input.canceladaEm),
    motivoCancelamento: cleanString(input.motivoCancelamento),
    dataCriacao: input.dataCriacao ?? "",
    dataAtualizacao: cleanString(input.dataAtualizacao),
  };
}

function normalizeCobrancaRecorrente(input: CobrancaRecorrenteApiResponse): CobrancaRecorrente {
  return {
    id: input.id ?? "",
    tenantId: input.tenantId ?? "",
    assinaturaId: input.assinaturaId ?? "",
    alunoId: input.alunoId ?? "",
    alunoNome: cleanString(input.alunoNome),
    valor: toNumber(input.valor),
    status: normalizeStatusCobranca(input.status),
    dataVencimento: input.dataVencimento ?? "",
    dataPagamento: cleanString(input.dataPagamento),
    gatewayCobrancaId: cleanString(input.gatewayCobrancaId),
    formaPagamento: cleanString(input.formaPagamento),
    tentativas: toNumber(input.tentativas, 0),
    ultimaTentativaEm: cleanString(input.ultimaTentativaEm),
    motivoFalha: cleanString(input.motivoFalha),
    dataCriacao: input.dataCriacao ?? "",
  };
}

// ---------------------------------------------------------------------------
// Envelope helpers
// ---------------------------------------------------------------------------

type ListEnvelope<T> = T[] | {
  items?: T[];
  content?: T[];
  data?: T[];
  result?: T[];
};

function extractFromEnvelope<T>(response: ListEnvelope<T>): T[] {
  if (Array.isArray(response)) return response;
  const candidates = [response.items, response.content, response.data, response.result];
  return candidates.find(Array.isArray) ?? [];
}

// ---------------------------------------------------------------------------
// In-flight deduplication
// ---------------------------------------------------------------------------

const listAssinaturasInFlight = new Map<string, Promise<Assinatura[]>>();

// ---------------------------------------------------------------------------
// Public API — Assinaturas
// ---------------------------------------------------------------------------

export interface ListAssinaturasApiInput {
  tenantId: string;
  alunoId?: string;
  planoId?: string;
  status?: StatusAssinatura;
  page?: number;
  size?: number;
}

export async function listAssinaturasApi(
  input: ListAssinaturasApiInput,
): Promise<Assinatura[]> {
  const cacheKey = JSON.stringify(input);
  const inFlight = listAssinaturasInFlight.get(cacheKey);
  if (inFlight) return inFlight;

  const request = (async () => {
    const response = await apiRequest<ListEnvelope<AssinaturaApiResponse>>({
      path: "/api/v1/billing/assinaturas",
      query: {
        tenantId: input.tenantId,
        alunoId: input.alunoId,
        planoId: input.planoId,
        status: input.status,
        page: input.page,
        size: input.size,
      },
    });
    return extractFromEnvelope(response).map(normalizeAssinatura);
  })();

  listAssinaturasInFlight.set(cacheKey, request);
  try {
    return await request;
  } finally {
    listAssinaturasInFlight.delete(cacheKey);
  }
}

export async function getAssinaturaApi(input: {
  tenantId: string;
  id: string;
}): Promise<Assinatura> {
  const response = await apiRequest<AssinaturaApiResponse>({
    path: `/api/v1/billing/assinaturas/${input.id}`,
    query: { tenantId: input.tenantId },
  });
  return normalizeAssinatura(response);
}

export async function createAssinaturaApi(input: {
  tenantId: string;
  data: CreateAssinaturaInput;
}): Promise<Assinatura> {
  const response = await apiRequest<AssinaturaApiResponse>({
    path: "/api/v1/billing/assinaturas",
    method: "POST",
    query: { tenantId: input.tenantId },
    body: input.data,
  });
  return normalizeAssinatura(response);
}

export async function cancelAssinaturaApi(input: {
  tenantId: string;
  id: string;
  data?: CancelAssinaturaInput;
}): Promise<Assinatura> {
  const response = await apiRequest<AssinaturaApiResponse>({
    path: `/api/v1/billing/assinaturas/${input.id}/cancelar`,
    method: "POST",
    query: { tenantId: input.tenantId },
    body: input.data,
  });
  return normalizeAssinatura(response);
}

export async function suspendAssinaturaApi(input: {
  tenantId: string;
  id: string;
}): Promise<Assinatura> {
  const response = await apiRequest<AssinaturaApiResponse>({
    path: `/api/v1/billing/assinaturas/${input.id}/suspender`,
    method: "POST",
    query: { tenantId: input.tenantId },
  });
  return normalizeAssinatura(response);
}

export async function reactivateAssinaturaApi(input: {
  tenantId: string;
  id: string;
}): Promise<Assinatura> {
  const response = await apiRequest<AssinaturaApiResponse>({
    path: `/api/v1/billing/assinaturas/${input.id}/reativar`,
    method: "POST",
    query: { tenantId: input.tenantId },
  });
  return normalizeAssinatura(response);
}

// ---------------------------------------------------------------------------
// Public API — Cobranças Recorrentes
// ---------------------------------------------------------------------------

export interface ListCobrancasRecorrentesApiInput {
  tenantId: string;
  assinaturaId?: string;
  alunoId?: string;
  status?: StatusCobrancaRecorrente;
  page?: number;
  size?: number;
}

export async function listCobrancasRecorrentesApi(
  input: ListCobrancasRecorrentesApiInput,
): Promise<CobrancaRecorrente[]> {
  const response = await apiRequest<ListEnvelope<CobrancaRecorrenteApiResponse>>({
    path: "/api/v1/billing/cobrancas",
    query: {
      tenantId: input.tenantId,
      assinaturaId: input.assinaturaId,
      alunoId: input.alunoId,
      status: input.status,
      page: input.page,
      size: input.size,
    },
  });
  return extractFromEnvelope(response).map(normalizeCobrancaRecorrente);
}

export async function getCobrancaRecorrenteApi(input: {
  tenantId: string;
  id: string;
}): Promise<CobrancaRecorrente> {
  const response = await apiRequest<CobrancaRecorrenteApiResponse>({
    path: `/api/v1/billing/cobrancas/${input.id}`,
    query: { tenantId: input.tenantId },
  });
  return normalizeCobrancaRecorrente(response);
}
