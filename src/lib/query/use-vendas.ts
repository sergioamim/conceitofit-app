import { useQuery } from "@tanstack/react-query";
import { listVendasPageService } from "@/lib/tenant/comercial/runtime";
import type { TipoFormaPagamento, TipoVenda } from "@/lib/types";
import { queryKeys } from "./keys";

export interface UseVendasInput {
  tenantId: string | undefined;
  tenantResolved: boolean;
  page?: number;
  size?: number;
  dataInicio?: string;
  dataFim?: string;
  tipoVenda?: TipoVenda;
  formaPagamento?: TipoFormaPagamento;
}

export function useVendas(input: UseVendasInput) {
  const filters = {
    page: input.page ?? 0,
    size: input.size ?? 20,
    dataInicio: input.dataInicio,
    dataFim: input.dataFim,
    tipoVenda: input.tipoVenda,
    formaPagamento: input.formaPagamento,
  };

  return useQuery({
    queryKey: queryKeys.vendas.list(input.tenantId ?? "", filters),
    queryFn: () =>
      listVendasPageService({
        tenantId: input.tenantId!,
        page: input.page,
        size: input.size,
        dataInicio: input.dataInicio,
        dataFim: input.dataFim,
        tipoVenda: input.tipoVenda,
        formaPagamento: input.formaPagamento,
      }),
    enabled: Boolean(input.tenantId) && input.tenantResolved,
    staleTime: 2 * 60 * 1000,
    refetchOnWindowFocus: true,
  });
}
