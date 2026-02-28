import type { TipoFormaPagamento } from "@/lib/types";
import { apiRequest } from "./http";

export type CategoriaContaReceberApi =
  | "MENSALIDADE"
  | "MATRICULA"
  | "SERVICO"
  | "PRODUTO"
  | "AVULSO";

export type StatusContaReceberApi =
  | "PENDENTE"
  | "RECEBIDA"
  | "VENCIDA"
  | "CANCELADA";

export type OrigemLancamentoContaReceberApi = "MANUAL" | "RECORRENTE";

export interface ContaReceberApiResponse {
  id: string;
  tenantId: string;
  regraRecorrenciaId?: string | null;
  cliente: string;
  documentoCliente?: string | null;
  descricao: string;
  categoria: CategoriaContaReceberApi;
  centroCusto?: string | null;
  competencia: string;
  dataEmissao?: string | null;
  dataVencimento: string;
  dataRecebimento?: string | null;
  valorOriginal: number;
  desconto: number;
  jurosMulta: number;
  valorRecebido?: number | null;
  formaPagamento?: TipoFormaPagamento | null;
  status: StatusContaReceberApi;
  geradaAutomaticamente: boolean;
  origemLancamento?: OrigemLancamentoContaReceberApi | null;
  observacoes?: string | null;
  dataCriacao: string;
  dataAtualizacao?: string | null;
}

export type CreateContaReceberApiInput = {
  cliente: string;
  documentoCliente?: string;
  descricao: string;
  categoria?: CategoriaContaReceberApi;
  centroCusto?: string;
  competencia: string;
  dataEmissao?: string;
  dataVencimento: string;
  valorOriginal: number;
  desconto?: number;
  jurosMulta?: number;
  observacoes?: string;
};

export type UpdateContaReceberApiInput = Partial<CreateContaReceberApiInput>;

export type ReceberContaReceberApiInput = {
  dataRecebimento: string;
  formaPagamento: TipoFormaPagamento;
  valorRecebido?: number;
  observacoes?: string;
};

const toNumber = (value: unknown, fallback = 0): number => {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
};

function normalizeContaReceber(input: ContaReceberApiResponse): ContaReceberApiResponse {
  return {
    ...input,
    valorOriginal: toNumber(input.valorOriginal),
    desconto: toNumber(input.desconto),
    jurosMulta: toNumber(input.jurosMulta),
    valorRecebido: input.valorRecebido == null ? null : toNumber(input.valorRecebido),
  };
}

export async function listContasReceberApi(input: {
  tenantId: string;
  status?: StatusContaReceberApi;
  categoria?: CategoriaContaReceberApi;
  origem?: OrigemLancamentoContaReceberApi;
  startDate?: string;
  endDate?: string;
  page?: number;
  size?: number;
}): Promise<ContaReceberApiResponse[]> {
  const response = await apiRequest<ContaReceberApiResponse[]>({
    path: "/api/v1/gerencial/financeiro/contas-receber",
    query: {
      tenantId: input.tenantId,
      status: input.status,
      categoria: input.categoria,
      origem: input.origem,
      startDate: input.startDate,
      endDate: input.endDate,
      page: input.page,
      size: input.size,
    },
  });
  return response.map(normalizeContaReceber);
}

export async function createContaReceberApi(input: {
  tenantId: string;
  data: CreateContaReceberApiInput;
}): Promise<ContaReceberApiResponse | null> {
  const response = await apiRequest<ContaReceberApiResponse | null>({
    path: "/api/v1/gerencial/financeiro/contas-receber",
    method: "POST",
    query: {
      tenantId: input.tenantId,
    },
    body: input.data,
  });
  return response ? normalizeContaReceber(response) : null;
}

export async function updateContaReceberApi(input: {
  tenantId: string;
  id: string;
  data: UpdateContaReceberApiInput;
}): Promise<ContaReceberApiResponse> {
  const response = await apiRequest<ContaReceberApiResponse>({
    path: `/api/v1/gerencial/financeiro/contas-receber/${input.id}`,
    method: "PUT",
    query: {
      tenantId: input.tenantId,
    },
    body: input.data,
  });
  return normalizeContaReceber(response);
}

export async function receberContaReceberApi(input: {
  tenantId: string;
  id: string;
  data: ReceberContaReceberApiInput;
}): Promise<ContaReceberApiResponse> {
  const response = await apiRequest<ContaReceberApiResponse>({
    path: `/api/v1/gerencial/financeiro/contas-receber/${input.id}/receber`,
    method: "PATCH",
    query: {
      tenantId: input.tenantId,
    },
    body: input.data,
  });
  return normalizeContaReceber(response);
}

export async function cancelarContaReceberApi(input: {
  tenantId: string;
  id: string;
  observacoes?: string;
}): Promise<ContaReceberApiResponse> {
  const response = await apiRequest<ContaReceberApiResponse>({
    path: `/api/v1/gerencial/financeiro/contas-receber/${input.id}/cancelar`,
    method: "PATCH",
    query: {
      tenantId: input.tenantId,
    },
    body: input.observacoes ? { observacoes: input.observacoes } : undefined,
  });
  return normalizeContaReceber(response);
}
