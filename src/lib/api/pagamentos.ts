import type { Pagamento, ReceberPagamentoInput, StatusPagamento } from "@/lib/types";
import { apiRequest } from "./http";

type PagamentoApiResponse = Pagamento;

const toNumber = (value: unknown, fallback = 0): number => {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
};

const toBoolean = (value: unknown, fallback = false): boolean => {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (normalized === "true" || normalized === "1" || normalized === "sim") return true;
    if (normalized === "false" || normalized === "0" || normalized === "nao" || normalized === "não") {
      return false;
    }
  }
  if (typeof value === "number") return value === 1;
  return fallback;
};

function normalizePagamento(input: PagamentoApiResponse): Pagamento {
  return {
    ...input,
    valor: toNumber(input.valor),
    desconto: toNumber(input.desconto),
    valorFinal: toNumber(input.valorFinal),
    nfseEmitida: toBoolean(input.nfseEmitida),
    nfseNumero: input.nfseNumero as Pagamento["nfseNumero"] | undefined,
    nfseChave: input.nfseChave as Pagamento["nfseChave"] | undefined,
    dataEmissaoNfse: input.dataEmissaoNfse as Pagamento["dataEmissaoNfse"] | undefined,
  };
}

export async function listPagamentosApi(input: {
  tenantId: string;
  status?: StatusPagamento;
  alunoId?: string;
  page?: number;
  size?: number;
}): Promise<Pagamento[]> {
  const response = await apiRequest<PagamentoApiResponse[]>({
    path: "/api/v1/academia/pagamentos",
    query: {
      tenantId: input.tenantId,
      status: input.status,
      alunoId: input.alunoId,
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
}): Promise<Pagamento> {
  const response = await apiRequest<PagamentoApiResponse>({
    path: `/api/v1/academia/pagamentos/${input.id}/receber`,
    method: "POST",
    query: { tenantId: input.tenantId },
    body: input.data,
  });
  return normalizePagamento(response);
}

export async function emitirNfsePagamentoApi(input: {
  tenantId: string;
  id: string;
}): Promise<Pagamento> {
  return apiRequest<Pagamento>({
    path: `/api/v1/comercial/pagamentos/${input.id}/emitir-nfse`,
    method: "POST",
    query: { tenantId: input.tenantId },
  });
}
