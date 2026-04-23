import { useQuery } from "@tanstack/react-query";
import {
  listContasReceberOperacionais,
  listContasReceberOperacionaisPage,
  type PagamentoComAluno,
} from "@/lib/tenant/financeiro/recebimentos";
import {
  getSumarioOperacionalContaReceberApi,
  type SumarioOperacionalContaReceberResponse,
  type StatusContaReceberApi,
} from "@/lib/api/contas-receber";
import type { StatusPagamento } from "@/lib/types";
import { queryKeys } from "./keys";

/**
 * Hook legado — lista completa (load-all). Preservado para
 * compatibilidade com a tela atual enquanto F3 migra pra versão
 * paginada. Novos consumidores devem usar `useContasReceberPage`.
 */
export function useContasReceber(input: {
  tenantId: string | undefined;
  startDate: string;
  endDate: string;
}) {
  const filters = {
    startDate: input.startDate,
    endDate: input.endDate,
  };

  return useQuery<PagamentoComAluno[]>({
    queryKey: queryKeys.pagamentos.list(input.tenantId ?? "", filters),
    queryFn: () =>
      listContasReceberOperacionais({
        tenantId: input.tenantId!,
        startDate: input.startDate,
        endDate: input.endDate,
      }),
    enabled: Boolean(input.tenantId) && input.startDate.length > 0 && input.endDate.length > 0,
    staleTime: 30_000,
  });
}

export interface UseContasReceberPageResult {
  items: PagamentoComAluno[];
  total: number;
  page: number;
  size: number;
  hasNext: boolean;
}

/**
 * F3 redesign (2026-04-23): versão paginada com filtros server-side
 * para a tela `/gerencial/contas-a-receber`. Espelha `usePagamentosPage`
 * mas com query-key distinta pra evitar invalidação cruzada entre as
 * duas telas (operacional vs gerencial).
 */
export function useContasReceberPage(input: {
  tenantId: string | undefined;
  status?: StatusPagamento;
  startDate?: string;
  endDate?: string;
  documentoCliente?: string;
  page?: number;
  size?: number;
  enabled?: boolean;
}) {
  const filters = {
    status: input.status ?? null,
    startDate: input.startDate ?? null,
    endDate: input.endDate ?? null,
    documentoCliente: input.documentoCliente ?? null,
    page: input.page ?? 0,
    size: input.size ?? 50,
  };

  return useQuery<UseContasReceberPageResult>({
    queryKey: ["contas-a-receber", "page", input.tenantId ?? "", filters],
    queryFn: () =>
      listContasReceberOperacionaisPage({
        tenantId: input.tenantId!,
        status: input.status,
        startDate: input.startDate,
        endDate: input.endDate,
        documentoCliente: input.documentoCliente,
        page: input.page ?? 0,
        size: input.size ?? 50,
      }),
    enabled: Boolean(input.tenantId) && (input.enabled ?? true),
    staleTime: 30_000,
    gcTime: 5 * 60 * 1000,
  });
}

/**
 * F3 redesign (2026-04-23): sumário operacional por status + período
 * para alimentar os cards de dashboard da tela. Compartilha o endpoint
 * com `/pagamentos` mas com query-key própria.
 */
export function useSumarioOperacionalContaReceber(input: {
  tenantId: string | undefined;
  startDate?: string;
  endDate?: string;
  documentoCliente?: string;
  enabled?: boolean;
}) {
  return useQuery<SumarioOperacionalContaReceberResponse>({
    queryKey: [
      "contas-a-receber",
      "sumario",
      input.tenantId ?? "",
      input.startDate ?? null,
      input.endDate ?? null,
      input.documentoCliente ?? null,
    ],
    queryFn: () =>
      getSumarioOperacionalContaReceberApi({
        tenantId: input.tenantId!,
        startDate: input.startDate,
        endDate: input.endDate,
        documentoCliente: input.documentoCliente,
      }),
    enabled: Boolean(input.tenantId) && (input.enabled ?? true),
    staleTime: 30_000,
    gcTime: 5 * 60 * 1000,
  });
}

/** Reexport pra uso direto pelos componentes se precisarem do tipo. */
export type { StatusContaReceberApi };
