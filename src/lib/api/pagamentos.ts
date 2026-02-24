import type { Pagamento, ReceberPagamentoInput, StatusPagamento } from "@/lib/types";
import { apiRequest } from "./http";

type PagamentoApiResponse = Pagamento;

const toNumber = (value: unknown, fallback = 0): number => {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
};

function normalizePagamento(input: PagamentoApiResponse): Pagamento {
  return {
    ...input,
    valor: toNumber(input.valor),
    desconto: toNumber(input.desconto),
    valorFinal: toNumber(input.valorFinal),
  };
}

export async function listPagamentosApi(input: {
  tenantId: string;
  status?: StatusPagamento;
  page?: number;
  size?: number;
}): Promise<Pagamento[]> {
  const response = await apiRequest<PagamentoApiResponse[]>({
    path: "/api/v1/comercial/pagamentos",
    query: {
      tenantId: input.tenantId,
      status: input.status,
      page: input.page,
      size: input.size,
    },
  });
  return response.map(normalizePagamento);
}

export async function receberPagamentoApi(input: {
  tenantId: string;
  id: string;
  data: ReceberPagamentoInput;
}): Promise<void> {
  await apiRequest<void>({
    path: `/api/v1/comercial/pagamentos/${input.id}/receber`,
    method: "POST",
    query: { tenantId: input.tenantId },
    body: input.data,
  });
}

