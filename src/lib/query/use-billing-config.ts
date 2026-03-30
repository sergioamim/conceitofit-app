import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getBillingConfigApi,
  saveBillingConfigApi,
  testBillingConnectionApi,
} from "@/lib/api/billing";
import type { BillingConfig, ProvedorGateway } from "@/lib/types";
import { queryKeys } from "./keys";

export function useBillingConfig(input: { tenantId: string | undefined }) {
  return useQuery<BillingConfig | null>({
    queryKey: queryKeys.billingConfig(input.tenantId ?? ""),
    queryFn: () => getBillingConfigApi({ tenantId: input.tenantId! }),
    enabled: Boolean(input.tenantId),
    staleTime: 5 * 60 * 1000,
  });
}

export function useSaveBillingConfig(tenantId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      provedorAtivo: ProvedorGateway;
      chaveApi: string;
      ambiente: "SANDBOX" | "PRODUCAO";
      ativo: boolean;
    }) => saveBillingConfigApi({ tenantId: tenantId!, data }),
    onSuccess: () => {
      if (tenantId) {
        void queryClient.invalidateQueries({
          queryKey: queryKeys.billingConfig(tenantId),
        });
      }
    },
  });
}

export function useTestBillingConnection(tenantId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => testBillingConnectionApi({ tenantId: tenantId! }),
    onSuccess: () => {
      if (tenantId) {
        void queryClient.invalidateQueries({
          queryKey: queryKeys.billingConfig(tenantId),
        });
      }
    },
  });
}
