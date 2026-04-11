import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getBillingConfigApi,
  listAssinaturasApi,
  saveBillingConfigApi,
  testBillingConnectionApi,
} from "@/lib/api/billing";
import { ApiRequestError } from "@/lib/api/http";
import type {
  Assinatura,
  BillingConfig,
  ProvedorGateway,
  StatusAssinatura,
} from "@/lib/types";
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

/**
 * Lista assinaturas recorrentes com tolerância a backend fantasma
 * (`listAssinaturasApi` pode retornar 404/405/501 enquanto o endpoint
 * `/api/v1/billing/assinaturas` não for implementado no BE — ver ADR-001).
 * Em caso de erro conhecido, retorna array vazio e a UI renderiza
 * estado "sem dados" sem quebrar.
 */
export function useAssinaturas(input: {
  tenantId: string | undefined;
  status?: StatusAssinatura;
}) {
  const filters = { status: input.status };
  return useQuery<Assinatura[]>({
    queryKey: queryKeys.assinaturas.list(input.tenantId ?? "", filters),
    queryFn: async () => {
      try {
        return await listAssinaturasApi({
          tenantId: input.tenantId!,
          status: input.status,
        });
      } catch (error) {
        // Backend fantasma: 404/405/501 vira lista vazia
        if (
          error instanceof ApiRequestError &&
          [404, 405, 501].includes(error.status)
        ) {
          return [];
        }
        throw error;
      }
    },
    enabled: Boolean(input.tenantId),
    staleTime: 60 * 1000,
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
