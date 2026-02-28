import type {
  ConciliacaoLinha,
  OrigemConciliacao,
  StatusConciliacao,
  TipoMovimentoConciliacao,
} from "@/lib/types";
import { apiRequest } from "./http";

export interface ImportLinhaRequest {
  contaBancariaId: string;
  chaveConciliacao: string;
  dataMovimento: string;
  valor: number;
  tipoMovimento: TipoMovimentoConciliacao;
  origem: OrigemConciliacao;
  descricao?: string;
  documento?: string;
  observacao?: string;
}

export interface ImportarLinhasApiInput {
  tenantId?: string;
  linhas: ImportLinhaRequest[];
}

interface ConciliacaoLinhaApiResponse {
  id: string;
  tenantId: string;
  contaBancariaId: string;
  chaveConciliacao: string;
  origem: OrigemConciliacao;
  status: StatusConciliacao;
  dataMovimento: string;
  descricao?: string;
  documento?: string;
  valor: number;
  tipoMovimento: TipoMovimentoConciliacao;
  contaReceberId?: string | null;
  contaPagarId?: string | null;
  observacao?: string | null;
}

interface ConciliarLinhaApiPayload {
  contaReceberId?: string;
  contaPagarId?: string;
  observacao?: string;
}

function normalizeConciliacaoLinha(input: ConciliacaoLinhaApiResponse): ConciliacaoLinha {
  return {
    id: input.id,
    tenantId: input.tenantId,
    contaBancariaId: input.contaBancariaId,
    chaveConciliacao: input.chaveConciliacao,
    origem: input.origem,
    status: input.status,
    dataMovimento: input.dataMovimento,
    descricao: input.descricao,
    documento: input.documento,
    valor: Number(input.valor) || 0,
    tipoMovimento: input.tipoMovimento,
    contaReceberId: input.contaReceberId ?? undefined,
    contaPagarId: input.contaPagarId ?? undefined,
    observacao: input.observacao ?? undefined,
  };
}

export async function listarConciliacaoLinhasApi(input: {
  tenantId?: string;
  status?: StatusConciliacao;
  contaBancariaId?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  size?: number;
}): Promise<ConciliacaoLinha[]> {
  const response = await apiRequest<ConciliacaoLinhaApiResponse[]>({
    path: "/api/v1/gerencial/financeiro/conciliacao-bancaria/linhas",
    query: {
      tenantId: input.tenantId,
      status: input.status,
      contaBancariaId: input.contaBancariaId,
      startDate: input.startDate,
      endDate: input.endDate,
      page: input.page,
      size: input.size,
    },
  });
  return response.map(normalizeConciliacaoLinha);
}

export async function importarLinhasConciliacaoApi(input: ImportarLinhasApiInput): Promise<ConciliacaoLinha[]> {
  const response = await apiRequest<ConciliacaoLinhaApiResponse[]>({
    path: "/api/v1/gerencial/financeiro/conciliacao-bancaria/linhas",
    method: "POST",
    query: {
      tenantId: input.tenantId,
    },
    body: {
      linhas: input.linhas,
    },
  });
  return response.map(normalizeConciliacaoLinha);
}

export async function conciliarLinhaApi(input: {
  tenantId?: string;
  id: string;
  contaReceberId?: string;
  contaPagarId?: string;
  observacao?: string;
}): Promise<ConciliacaoLinha> {
  const response = await apiRequest<ConciliacaoLinhaApiResponse>({
    path: `/api/v1/gerencial/financeiro/conciliacao-bancaria/linhas/${input.id}/conciliar`,
    method: "PATCH",
    query: {
      tenantId: input.tenantId,
    },
    body: {
      contaReceberId: input.contaReceberId,
      contaPagarId: input.contaPagarId,
      observacao: input.observacao,
    } as ConciliarLinhaApiPayload,
  });
  return normalizeConciliacaoLinha(response);
}

export async function ignorarLinhaApi(input: {
  tenantId?: string;
  id: string;
}): Promise<ConciliacaoLinha> {
  const response = await apiRequest<ConciliacaoLinhaApiResponse>({
    path: `/api/v1/gerencial/financeiro/conciliacao-bancaria/linhas/${input.id}/ignorar`,
    method: "PATCH",
    query: {
      tenantId: input.tenantId,
    },
  });
  return normalizeConciliacaoLinha(response);
}
