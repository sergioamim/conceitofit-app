import type { Pagamento, ReceberPagamentoInput, StatusPagamento } from "@/lib/types";
import { ApiRequestError, apiRequest } from "./http";

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

function getFiscalEmissionMessage(error: ApiRequestError, batch = false) {
  if (error.status === 404) {
    return batch
      ? "Backend ainda não expõe emissão de NFSe em lote neste ambiente."
      : "Backend ainda não expõe emissão de NFSe por pagamento neste ambiente.";
  }

  if (error.status === 400 || error.status === 409 || error.status === 422) {
    const firstFieldError = error.fieldErrors
      ? Object.values(error.fieldErrors).find((value) => typeof value === "string" && value.trim())
      : null;
    if (firstFieldError) return firstFieldError;
    if (error.message?.trim()) return error.message.trim();
    return batch
      ? "Emissão em lote bloqueada porque a configuração fiscal da unidade está incompleta."
      : "Emissão fiscal bloqueada porque a configuração tributária da unidade está incompleta.";
  }

  return error.message;
}

export async function listPagamentosApi(input: {
  tenantId: string;
  status?: StatusPagamento;
  alunoId?: string;
  page?: number;
  size?: number;
}): Promise<Pagamento[]> {
  const response = await apiRequest<PagamentoApiResponse[]>({
    path: "/api/v1/comercial/pagamentos",
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
    path: `/api/v1/comercial/pagamentos/${input.id}/receber`,
    method: "POST",
    query: { tenantId: input.tenantId },
    body: input.data,
  });
  return normalizePagamento(response);
}

export async function cancelarPagamentoApi(input: {
  tenantId: string;
  id: string;
  data: { justificativa: string };
}): Promise<Pagamento> {
  const response = await apiRequest<PagamentoApiResponse>({
    path: `/api/v1/comercial/pagamentos/${input.id}/cancelar`,
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
  try {
    const response = await apiRequest<PagamentoApiResponse>({
      path: `/api/v1/comercial/pagamentos/${input.id}/nfse`,
      method: "POST",
      query: { tenantId: input.tenantId },
    });
    return normalizePagamento(response);
  } catch (error) {
    if (error instanceof ApiRequestError) {
      throw new Error(getFiscalEmissionMessage(error));
    }
    throw error;
  }
}

export async function emitirNfseEmLoteApi(input: {
  tenantId: string;
  ids: string[];
}): Promise<Pagamento[]> {
  try {
    const response = await apiRequest<PagamentoApiResponse[] | { items?: PagamentoApiResponse[]; data?: PagamentoApiResponse[] }>({
      path: "/api/v1/comercial/pagamentos/nfse/lote",
      method: "POST",
      query: { tenantId: input.tenantId },
      body: { ids: input.ids },
    });
    const rows = Array.isArray(response) ? response : response.items ?? response.data ?? [];
    return rows.map(normalizePagamento);
  } catch (error) {
    if (error instanceof ApiRequestError) {
      throw new Error(getFiscalEmissionMessage(error, true));
    }
    throw error;
  }
}
