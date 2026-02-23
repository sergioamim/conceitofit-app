import type { FormaPagamento, TipoFormaPagamento } from "@/lib/types";
import { apiRequest } from "./http";

interface FormaPagamentoApiResponse {
  id: string;
  tenantId: string;
  nome: string;
  tipo: TipoFormaPagamento;
  taxaPercentual?: number | null;
  parcelasMax?: number | null;
  instrucoes?: string | null;
  ativo?: boolean | null;
}

export type CreateFormaPagamentoApiInput = Omit<FormaPagamento, "id" | "tenantId" | "ativo">;
export type UpdateFormaPagamentoApiInput = Partial<Omit<FormaPagamento, "id" | "tenantId">>;

function normalizeFormaPagamento(input: FormaPagamentoApiResponse): FormaPagamento {
  return {
    id: input.id,
    tenantId: input.tenantId,
    nome: input.nome,
    tipo: input.tipo,
    taxaPercentual: Number(input.taxaPercentual ?? 0),
    parcelasMax: Math.max(1, Number(input.parcelasMax ?? 1)),
    instrucoes: input.instrucoes ?? undefined,
    ativo: input.ativo ?? true,
  };
}

export async function listFormasPagamentoApi(input: {
  tenantId: string;
  apenasAtivas?: boolean;
}): Promise<FormaPagamento[]> {
  const response = await apiRequest<FormaPagamentoApiResponse[]>({
    path: "/api/v1/gerencial/financeiro/formas-pagamento",
    query: {
      apenasAtivas: input.apenasAtivas ?? true,
    },
  });
  return response.map(normalizeFormaPagamento);
}

export async function createFormaPagamentoApi(input: {
  tenantId: string;
  data: CreateFormaPagamentoApiInput;
}): Promise<FormaPagamento> {
  const response = await apiRequest<FormaPagamentoApiResponse>({
    path: "/api/v1/gerencial/financeiro/formas-pagamento",
    method: "POST",
    body: input.data,
  });
  return normalizeFormaPagamento(response);
}

export async function updateFormaPagamentoApi(input: {
  tenantId: string;
  id: string;
  data: UpdateFormaPagamentoApiInput;
}): Promise<FormaPagamento> {
  const response = await apiRequest<FormaPagamentoApiResponse>({
    path: `/api/v1/gerencial/financeiro/formas-pagamento/${input.id}`,
    method: "PUT",
    body: input.data,
  });
  return normalizeFormaPagamento(response);
}

export async function toggleFormaPagamentoApi(input: {
  tenantId: string;
  id: string;
}): Promise<FormaPagamento> {
  const response = await apiRequest<FormaPagamentoApiResponse>({
    path: `/api/v1/gerencial/financeiro/formas-pagamento/${input.id}/toggle`,
    method: "PATCH",
  });
  return normalizeFormaPagamento(response);
}

export async function deleteFormaPagamentoApi(input: {
  tenantId: string;
  id: string;
}): Promise<void> {
  await apiRequest<void>({
    path: `/api/v1/gerencial/financeiro/formas-pagamento/${input.id}`,
    method: "DELETE",
  });
}

export async function getFormasPagamentoLabelsApi(): Promise<
  Partial<Record<TipoFormaPagamento, string>>
> {
  return apiRequest<Partial<Record<TipoFormaPagamento, string>>>({
    path: "/api/v1/gerencial/financeiro/formas-pagamento/labels",
  });
}
