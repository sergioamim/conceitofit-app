import type { TipoFormaPagamento, TipoVenda, Venda } from "@/lib/types";
import { apiRequest } from "./http";

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
  pagamento: {
    formaPagamento: TipoFormaPagamento;
    parcelas?: number | null;
    valorPago: number;
    observacoes?: string | null;
  };
  dataCriacao: string;
};

const toNumber = (value: unknown, fallback = 0): number => {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
};

function normalizeVenda(input: VendaApiResponse): Venda {
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
      formaPagamento: input.pagamento.formaPagamento,
      parcelas:
        input.pagamento.parcelas == null
          ? undefined
          : Math.max(1, Number(input.pagamento.parcelas)),
      valorPago: toNumber(input.pagamento.valorPago, 0),
      observacoes: input.pagamento.observacoes ?? undefined,
    },
    dataCriacao: input.dataCriacao,
  };
}

export async function listVendasApi(input: {
  tenantId: string;
  page?: number;
  size?: number;
}): Promise<Venda[]> {
  const response = await apiRequest<VendaApiResponse[]>({
    path: "/api/v1/comercial/vendas",
    query: {
      tenantId: input.tenantId,
      page: input.page,
      size: input.size,
    },
  });
  return response.map(normalizeVenda);
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

