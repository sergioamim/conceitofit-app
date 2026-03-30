import { useQuery } from "@tanstack/react-query";
import {
  listContasReceberOperacionais,
  type PagamentoComAluno,
} from "@/lib/tenant/financeiro/recebimentos";
import { queryKeys } from "./keys";

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
    queryKey: queryKeys.contasReceber.list(input.tenantId ?? "", filters),
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
