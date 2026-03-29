import { useQuery } from "@tanstack/react-query";
import {
  listContasReceberOperacionais,
  type PagamentoComAluno,
} from "@/lib/financeiro/recebimentos";
import type { StatusPagamento } from "@/lib/types";
import { queryKeys } from "./keys";

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
  });
}
