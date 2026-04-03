import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  listAgregadorTransacoesApi,
  reprocessarAgregadorTransacaoApi,
} from "@/lib/api/financeiro-operacional";
import type { AgregadorTransacao } from "@/lib/types";
import { queryKeys } from "./keys";

export function useAgregadores(input: {
  tenantId: string | undefined;
  tenantResolved: boolean;
}) {
  return useQuery<AgregadorTransacao[]>({
    queryKey: queryKeys.agregadores.list(input.tenantId ?? ""),
    queryFn: () => listAgregadorTransacoesApi({ tenantId: input.tenantId! }),
    enabled: Boolean(input.tenantId) && input.tenantResolved,
    staleTime: 2 * 60 * 1000,
    refetchOnWindowFocus: true,
  });
}

export function useReprocessarAgregador(tenantId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      reprocessarAgregadorTransacaoApi({ tenantId: tenantId!, id }),
    onSuccess: () => {
      if (tenantId) {
        void queryClient.invalidateQueries({
          queryKey: queryKeys.agregadores.all(tenantId),
        });
      }
    },
  });
}
