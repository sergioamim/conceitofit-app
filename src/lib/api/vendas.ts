import type { TipoFormaPagamento, TipoVenda, Venda } from "@/lib/types";
import { apiRequest } from "./http";

const listVendasApiInFlight = new Map<string, Promise<Venda[] | ListVendasApiEnvelopeResult>>();

function buildListVendasApiKey(input: ListVendasApiInput): string {
  const query = {
    tenantId: input.tenantId,
    page: input.page,
    size: input.size,
    dataInicio: input.dataInicio,
    dataFim: input.dataFim,
    tipoVenda: input.tipoVenda,
    categoriaItem: input.categoriaItem,
    formaPagamento: input.formaPagamento,
    envelope: input.envelope ? true : undefined,
  } satisfies Record<string, string | number | boolean | undefined | null>;
  const cleanEntries = Object.entries(query).filter(([, value]) => value !== undefined);
  return JSON.stringify(cleanEntries);
}

type CreateVendaApiInput = {
  tipo: TipoVenda;
  clienteId?: string;
  convenioId?: string;
  voucherCodigo?: string;
  itens: Array<{
    tipo: TipoVenda;
    referenciaId: string;
    descricao: string;
    quantidade: number;
    valorUnitario: number;
    desconto?: number;
  }>;
  descontoTotal?: number;
  acrescimoTotal?: number;
  pagamento: {
    formaPagamento: TipoFormaPagamento;
    parcelas?: number;
    valorPago: number;
    observacoes?: string;
  };
};

type VendaApiResponse = {
  id: string;
  tenantId: string;
  tipo: TipoVenda;
  clienteId?: string | null;
  clienteNome?: string | null;
  status: Venda["status"];
  itens: Array<{
    id: string;
    tipo: TipoVenda;
    referenciaId: string;
    descricao: string;
    quantidade: number;
    valorUnitario: number;
    desconto: number;
    valorTotal: number;
  }>;
  subtotal: number;
  descontoTotal: number;
  acrescimoTotal: number;
  total: number;
  pagamento?: {
    formaPagamento: TipoFormaPagamento;
    parcelas?: number | null;
    valorPago: number;
    observacoes?: string | null;
  } | null;
  dataCriacao: string;
};

type ListVendasEnvelopeApiResponse = {
  items?: VendaApiResponse[];
  content?: VendaApiResponse[];
  data?: VendaApiResponse[];
  vendas?: VendaApiResponse[];
  result?: VendaApiResponse[];
  page?: number;
  size?: number;
  total?: number;
  hasNext?: boolean;
  totalGeral?: number;
  totalPeriodo?: number;
  totalVendas?: number;
  totais?: {
    totalGeral?: unknown;
    totalPorFormaPagamento?: unknown;
    totaisPorFormaPagamento?: unknown;
    registrosSemPagamento?: unknown;
    registrosComPagamentoAusente?: unknown;
  };
  totaisPorFormaPagamento?: unknown;
  totalPorFormaPagamento?: unknown;
};

export interface ListVendasApiInput {
  tenantId: string;
  page?: number;
  size?: number;
  dataInicio?: string;
  dataFim?: string;
  tipoVenda?: TipoVenda;
  categoriaItem?: TipoVenda;
  formaPagamento?: TipoFormaPagamento;
  envelope?: boolean;
}

export interface ListVendasApiEnvelopeResult {
  items: Venda[];
  page: number;
  size: number;
  total?: number;
  hasNext: boolean;
  totalGeral?: number;
  totaisPorFormaPagamento?: Partial<Record<TipoFormaPagamento, number>>;
  registrosSemPagamento?: number;
  registrosComPagamentoAusente?: number;
}

const toNumber = (value: unknown, fallback = 0): number => {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
};

const FORMAS_PAGAMENTO: TipoFormaPagamento[] = [
  "DINHEIRO",
  "PIX",
  "CARTAO_CREDITO",
  "CARTAO_DEBITO",
  "BOLETO",
  "RECORRENTE",
];

function normalizeFormaPagamento(value: unknown): TipoFormaPagamento {
  return typeof value === "string" && FORMAS_PAGAMENTO.includes(value as TipoFormaPagamento)
    ? (value as TipoFormaPagamento)
    : "PIX";
}

function normalizeVenda(input: VendaApiResponse): Venda {
  const pagamento = input.pagamento;
  const formaPagamento = normalizeFormaPagamento(pagamento?.formaPagamento);
  return {
    id: input.id,
    tenantId: input.tenantId,
    tipo: input.tipo,
    clienteId: input.clienteId ?? undefined,
    clienteNome: input.clienteNome ?? undefined,
    status: input.status,
    itens: (input.itens ?? []).map((item) => ({
      id: item.id,
      tipo: item.tipo,
      referenciaId: item.referenciaId,
      descricao: item.descricao,
      quantidade: Math.max(1, Number(item.quantidade ?? 1)),
      valorUnitario: toNumber(item.valorUnitario, 0),
      desconto: toNumber(item.desconto, 0),
      valorTotal: toNumber(item.valorTotal, 0),
    })),
    subtotal: toNumber(input.subtotal, 0),
    descontoTotal: toNumber(input.descontoTotal, 0),
    acrescimoTotal: toNumber(input.acrescimoTotal, 0),
    total: toNumber(input.total, 0),
    pagamento: {
      formaPagamento,
      parcelas:
        pagamento?.parcelas == null ? undefined : Math.max(1, Number(pagamento.parcelas)),
      valorPago: toNumber(pagamento?.valorPago, toNumber(input.total, 0)),
      observacoes: pagamento?.observacoes ?? undefined,
    },
    dataCriacao: input.dataCriacao,
  };
}

function extractVendasFromEnvelope(payload: ListVendasEnvelopeApiResponse): VendaApiResponse[] {
  const candidates = [payload.items, payload.content, payload.data, payload.vendas, payload.result];
  const firstArray = candidates.find(Array.isArray);
  return Array.isArray(firstArray) ? firstArray : [];
}

function parseTotaisPorFormaPagamento(value: unknown): Partial<Record<TipoFormaPagamento, number>> | undefined {
  if (!value) return undefined;
  const base: Partial<Record<TipoFormaPagamento, number>> = {};
  if (Array.isArray(value)) {
    for (const row of value) {
      if (!row || typeof row !== "object") continue;
      const forma = (row as { formaPagamento?: unknown; tipo?: unknown }).formaPagamento
        ?? (row as { formaPagamento?: unknown; tipo?: unknown }).tipo;
      const totalRaw = (row as { total?: unknown; valor?: unknown; amount?: unknown }).total
        ?? (row as { total?: unknown; valor?: unknown; amount?: unknown }).valor
        ?? (row as { total?: unknown; valor?: unknown; amount?: unknown }).amount;
      if (typeof forma !== "string" || !FORMAS_PAGAMENTO.includes(forma as TipoFormaPagamento)) continue;
      const total = toNumber(totalRaw, 0);
      base[forma as TipoFormaPagamento] = total;
    }
    return Object.keys(base).length > 0 ? base : undefined;
  }
  if (typeof value === "object") {
    const asObject = value as Record<string, unknown>;
    for (const forma of FORMAS_PAGAMENTO) {
      if (!(forma in asObject)) continue;
      base[forma] = toNumber(asObject[forma], 0);
    }
    return Object.keys(base).length > 0 ? base : undefined;
  }
  return undefined;
}

function extractTotais(value: ListVendasEnvelopeApiResponse): Record<string, unknown> {
  const totais = (value as { totais?: Record<string, unknown> }).totais;
  if (!totais || typeof totais !== "object") return {};
  return totais;
}

function toSafeNumber(value: unknown): number | undefined {
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
}

export async function listVendasApi(
  input: ListVendasApiInput
): Promise<Venda[] | ListVendasApiEnvelopeResult> {
  const requestKey = buildListVendasApiKey(input);
  const inFlight = listVendasApiInFlight.get(requestKey);
  if (inFlight) return inFlight;

  const request = (async () => {
    const response = await apiRequest<VendaApiResponse[] | ListVendasEnvelopeApiResponse>({
      path: "/api/v1/comercial/vendas",
      query: {
        tenantId: input.tenantId,
        page: input.page,
        size: input.size,
        dataInicio: input.dataInicio,
        dataFim: input.dataFim,
        tipoVenda: input.tipoVenda,
        categoriaItem: input.categoriaItem,
        formaPagamento: input.formaPagamento,
        envelope: input.envelope ? true : undefined,
      },
    });

    if (!input.envelope) {
      if (Array.isArray(response)) return response.map(normalizeVenda);
      return extractVendasFromEnvelope(response).map(normalizeVenda);
    }

    if (Array.isArray(response)) {
      return {
        items: response.map(normalizeVenda),
        page: input.page ?? 0,
        size: input.size ?? response.length,
        total: response.length,
        hasNext: false,
      };
    }

    const items = extractVendasFromEnvelope(response).map(normalizeVenda);
    const totais = extractTotais(response);
    const totalGeralRaw = totais.totalGeral ?? response.totalGeral ?? response.totalPeriodo ?? response.totalVendas;
    return {
      items,
      page: Number(response.page ?? input.page ?? 0),
      size: Number(response.size ?? input.size ?? items.length),
      total: typeof response.total === "number" ? response.total : undefined,
      hasNext: Boolean(response.hasNext),
      totalGeral: totalGeralRaw == null ? undefined : toNumber(totalGeralRaw, 0),
      totaisPorFormaPagamento: parseTotaisPorFormaPagamento(
        totais.totalPorFormaPagamento ??
          totais.totaisPorFormaPagamento ??
          response.totaisPorFormaPagamento ??
          response.totalPorFormaPagamento
      ),
      registrosSemPagamento: toSafeNumber(totais.registrosSemPagamento),
      registrosComPagamentoAusente: toSafeNumber(totais.registrosComPagamentoAusente),
    };
  })();

  listVendasApiInFlight.set(requestKey, request);
  try {
    return await request;
  } finally {
    listVendasApiInFlight.delete(requestKey);
  }
}

export async function createVendaApi(input: {
  tenantId: string;
  data: CreateVendaApiInput;
}): Promise<Venda> {
  const response = await apiRequest<VendaApiResponse>({
    path: "/api/v1/comercial/vendas",
    method: "POST",
    query: { tenantId: input.tenantId },
    body: input.data,
  });
  return normalizeVenda(response);
}
