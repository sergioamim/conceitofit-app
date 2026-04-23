import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ajustarPagamentoService,
  createRecebimentoAvulsoService,
  importarPagamentosEmLoteService,
  listContasReceberOperacionais,
  listContasReceberOperacionaisPage,
  type AjustarPagamentoInput,
  type ImportarPagamentosResultado,
  type PagamentoComAluno,
  type PagamentoImportItem,
  type RecebimentoAvulsoInput,
} from "@/lib/tenant/financeiro/recebimentos";
import { emitirNfsePagamentoApi } from "@/lib/api/pagamentos";
import type { StatusPagamento } from "@/lib/types";
import { queryKeys } from "./keys";

function useInvalidatePagamentos() {
  const queryClient = useQueryClient();
  return () =>
    queryClient.invalidateQueries({ queryKey: ["pagamentos"] });
}

export function usePagamentos(input: {
  tenantId: string | undefined;
  tenantResolved: boolean;
  status?: StatusPagamento;
  startDate?: string;
  endDate?: string;
}) {
  const filters = {
    status: input.status,
    startDate: input.startDate,
    endDate: input.endDate,
  };

  return useQuery<PagamentoComAluno[]>({
    queryKey: queryKeys.pagamentos.list(input.tenantId ?? "", filters),
    queryFn: () =>
      listContasReceberOperacionais({
        tenantId: input.tenantId!,
        status: input.status,
        startDate: input.startDate,
        endDate: input.endDate,
      }),
    enabled: Boolean(input.tenantId) && input.tenantResolved,
    // Task 485: pagamentos — 30s staleTime, 5min gcTime
    staleTime: 30_000,
    gcTime: 5 * 60 * 1000,
  });
}

export interface UsePagamentosPageResult {
  items: PagamentoComAluno[];
  total: number;
  page: number;
  size: number;
  hasNext: boolean;
}

/**
 * P0-A (2026-04-23): versão paginada do `usePagamentos`. Substitui o uso
 * no `/pagamentos` pra eliminar o bug de truncamento silencioso em
 * `size=500` — agora `hasNext` permite detectar quando há mais dados
 * e o caller pode render de banner "exibindo N de M" ou pagerar.
 *
 * Mantém o hook legado `usePagamentos` intacto pros callers que só
 * precisam de lista simples (BI, emitir-em-lote).
 */
export function usePagamentosPage(input: {
  tenantId: string | undefined;
  tenantResolved: boolean;
  status?: StatusPagamento;
  startDate?: string;
  endDate?: string;
  page?: number;
  size?: number;
}) {
  const filters = {
    status: input.status,
    startDate: input.startDate,
    endDate: input.endDate,
    page: input.page ?? 0,
    size: input.size ?? 200,
  };

  return useQuery<UsePagamentosPageResult>({
    queryKey: [...queryKeys.pagamentos.list(input.tenantId ?? "", filters), "paged"],
    queryFn: () =>
      listContasReceberOperacionaisPage({
        tenantId: input.tenantId!,
        status: input.status,
        startDate: input.startDate,
        endDate: input.endDate,
        page: input.page ?? 0,
        size: input.size ?? 200,
      }),
    enabled: Boolean(input.tenantId) && input.tenantResolved,
    staleTime: 30_000,
    gcTime: 5 * 60 * 1000,
  });
}

export function useReceberPagamento() {
  const invalidate = useInvalidatePagamentos();

  return useMutation({
    mutationFn: (input: {
      tenantId: string;
      id: string;
      data: AjustarPagamentoInput;
    }) => ajustarPagamentoService(input),
    onSuccess: () => invalidate(),
  });
}

export function useEmitirNfse() {
  const invalidate = useInvalidatePagamentos();

  return useMutation({
    mutationFn: (input: { tenantId: string; id: string }) =>
      emitirNfsePagamentoApi(input),
    onSuccess: () => invalidate(),
  });
}

export function useImportarPagamentos() {
  const invalidate = useInvalidatePagamentos();

  return useMutation<
    ImportarPagamentosResultado,
    Error,
    { tenantId: string; items: PagamentoImportItem[] }
  >({
    mutationFn: (input) => importarPagamentosEmLoteService(input),
    onSuccess: () => invalidate(),
  });
}

function useCreateRecebimentoAvulso() {
  const invalidate = useInvalidatePagamentos();

  return useMutation({
    mutationFn: (input: {
      tenantId: string;
      data: RecebimentoAvulsoInput;
    }) => createRecebimentoAvulsoService(input),
    onSuccess: () => invalidate(),
  });
}
