import { useQuery } from "@tanstack/react-query";
import {
  getSumarioOperacionalContaPagarApi,
  listContasPagarPageApi,
  type SumarioOperacionalContaPagarResponse,
} from "@/lib/api/financeiro-gerencial";
import type {
  CategoriaContaPagar,
  ContaPagar,
  GrupoDre,
  StatusContaPagar,
} from "@/lib/types";

export interface UseContasPagarPageResult {
  items: ContaPagar[];
  total: number;
  page: number;
  size: number;
  hasNext: boolean;
}

/**
 * F4 redesign (2026-04-23): versão paginada com filtros server-side para
 * a tela `/gerencial/contas-a-pagar`. Espelho de `useContasReceberPage`
 * mas sobre o endpoint `/contas-pagar`. Query-key distinta pra evitar
 * invalidação cruzada com receber.
 */
export function useContasPagarPage(input: {
  tenantId: string | undefined;
  status?: StatusContaPagar;
  categoria?: CategoriaContaPagar;
  tipoContaId?: string;
  grupoDre?: GrupoDre;
  origem?: ContaPagar["origemLancamento"];
  startDate?: string;
  endDate?: string;
  documentoFornecedor?: string;
  page?: number;
  size?: number;
  enabled?: boolean;
}) {
  const filters = {
    status: input.status ?? null,
    categoria: input.categoria ?? null,
    tipoContaId: input.tipoContaId ?? null,
    grupoDre: input.grupoDre ?? null,
    origem: input.origem ?? null,
    startDate: input.startDate ?? null,
    endDate: input.endDate ?? null,
    documentoFornecedor: input.documentoFornecedor ?? null,
    page: input.page ?? 0,
    size: input.size ?? 50,
  };

  return useQuery<UseContasPagarPageResult>({
    queryKey: ["contas-a-pagar", "page", input.tenantId ?? "", filters],
    queryFn: () =>
      listContasPagarPageApi({
        tenantId: input.tenantId!,
        status: input.status,
        categoria: input.categoria,
        tipoContaId: input.tipoContaId,
        grupoDre: input.grupoDre,
        origem: input.origem,
        startDate: input.startDate,
        endDate: input.endDate,
        documentoFornecedor: input.documentoFornecedor,
        page: input.page ?? 0,
        size: input.size ?? 50,
      }),
    enabled: Boolean(input.tenantId) && (input.enabled ?? true),
    staleTime: 30_000,
    gcTime: 5 * 60 * 1000,
  });
}

/**
 * F4 redesign (2026-04-23): sumário por status + período para os KPIs.
 * Consome endpoint `/contas-pagar/sumario-operacional` (F1 backend).
 */
export function useSumarioOperacionalContaPagar(input: {
  tenantId: string | undefined;
  startDate?: string;
  endDate?: string;
  documentoFornecedor?: string;
  enabled?: boolean;
}) {
  return useQuery<SumarioOperacionalContaPagarResponse>({
    queryKey: [
      "contas-a-pagar",
      "sumario",
      input.tenantId ?? "",
      input.startDate ?? null,
      input.endDate ?? null,
      input.documentoFornecedor ?? null,
    ],
    queryFn: () =>
      getSumarioOperacionalContaPagarApi({
        tenantId: input.tenantId!,
        startDate: input.startDate,
        endDate: input.endDate,
        documentoFornecedor: input.documentoFornecedor,
      }),
    enabled: Boolean(input.tenantId) && (input.enabled ?? true),
    staleTime: 30_000,
    gcTime: 5 * 60 * 1000,
  });
}
