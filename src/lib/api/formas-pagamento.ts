import type { FormaPagamento, TipoFormaPagamento } from "@/lib/types";
import { apiRequest } from "./http";

interface FormaPagamentoApiResponse {
  id: string;
  tenantId: string;
  nome: string;
  tipo: TipoFormaPagamento;
  taxaPercentual?: number | null;
  parcelasMax?: number | null;
  prazoRecebimentoDias?: number | null;
  emitirAutomaticamente?: boolean | null;
  instrucoes?: string | null;
  ativo?: boolean | null;
}

export type CreateFormaPagamentoApiInput = Omit<FormaPagamento, "id" | "tenantId" | "ativo">;
export type UpdateFormaPagamentoApiInput = Partial<Omit<FormaPagamento, "id" | "tenantId">>;

function buildFormaPagamentoPayload(
  tenantId: string,
  data: CreateFormaPagamentoApiInput | UpdateFormaPagamentoApiInput
): Record<string, unknown> {
  return {
    tenantId,
    nome: data.nome,
    tipo: data.tipo,
    taxaPercentual: data.taxaPercentual ?? 0,
    parcelasMax: data.parcelasMax ?? 1,
    instrucoes: data.instrucoes,
  };
}

function normalizeFormaPagamento(input: FormaPagamentoApiResponse): FormaPagamento {
  return {
    id: input.id,
    tenantId: input.tenantId,
    nome: input.nome,
    tipo: input.tipo,
    taxaPercentual: Number(input.taxaPercentual ?? 0),
    parcelasMax: Math.max(1, Number(input.parcelasMax ?? 1)),
    emitirAutomaticamente: Boolean(input.emitirAutomaticamente ?? false),
    prazoRecebimentoDias: input.prazoRecebimentoDias == null ? undefined : Number(input.prazoRecebimentoDias),
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
      tenantId: input.tenantId,
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
    query: { tenantId: input.tenantId },
    body: buildFormaPagamentoPayload(input.tenantId, input.data),
  });
  return {
    ...normalizeFormaPagamento(response),
    emitirAutomaticamente: input.data.emitirAutomaticamente ?? false,
    prazoRecebimentoDias: input.data.prazoRecebimentoDias,
  };
}

export async function updateFormaPagamentoApi(input: {
  tenantId: string;
  id: string;
  data: UpdateFormaPagamentoApiInput;
}): Promise<FormaPagamento> {
  const response = await apiRequest<FormaPagamentoApiResponse>({
    path: `/api/v1/gerencial/financeiro/formas-pagamento/${input.id}`,
    method: "PUT",
    query: { tenantId: input.tenantId },
    body: buildFormaPagamentoPayload(input.tenantId, input.data),
  });
  return {
    ...normalizeFormaPagamento(response),
    ...(input.data.emitirAutomaticamente !== undefined
      ? { emitirAutomaticamente: input.data.emitirAutomaticamente }
      : {}),
    ...(input.data.prazoRecebimentoDias !== undefined
      ? { prazoRecebimentoDias: input.data.prazoRecebimentoDias }
      : {}),
  };
}

export async function toggleFormaPagamentoApi(input: {
  tenantId: string;
  id: string;
}): Promise<FormaPagamento> {
  const response = await apiRequest<FormaPagamentoApiResponse>({
    path: `/api/v1/gerencial/financeiro/formas-pagamento/${input.id}/toggle`,
    method: "PATCH",
    query: { tenantId: input.tenantId },
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
    query: { tenantId: input.tenantId },
  });
}

export async function getFormasPagamentoLabelsApi(): Promise<
  Partial<Record<TipoFormaPagamento, string>>
> {
  return apiRequest<Partial<Record<TipoFormaPagamento, string>>>({
    path: "/api/v1/gerencial/financeiro/formas-pagamento/labels",
  });
}
