import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  criarCobrancaPixApi,
  consultarCobrancaPixApi,
  cancelarCobrancaPixApi,
  type PixCobranca,
} from "@/lib/api/pix";

export const pixQueryKeys = {
  cobranca: (tenantId: string, txId: string) =>
    ["pix", "cobranca", tenantId, txId] as const,
} as const;

/**
 * Polling automático do status da cobranca PIX (5s).
 * Habilitado apenas quando txId existe e status ainda nao eh terminal.
 */
export function usePixCobrancaStatus(input: {
  tenantId: string | undefined;
  txId: string | undefined;
  enabled?: boolean;
}) {
  return useQuery<{ txId: string; status: string }>({
    queryKey: pixQueryKeys.cobranca(input.tenantId ?? "", input.txId ?? ""),
    queryFn: () =>
      consultarCobrancaPixApi({
        txId: input.txId!,
        tenantId: input.tenantId!,
      }),
    enabled:
      Boolean(input.tenantId) &&
      Boolean(input.txId) &&
      (input.enabled ?? true),
    refetchInterval: 5_000,
    staleTime: 0,
  });
}

export function useCriarCobrancaPix() {
  return useMutation({
    mutationFn: (input: {
      tenantId: string;
      alunoId?: string;
      valor: number;
      descricao?: string;
    }) => criarCobrancaPixApi(input),
  });
}

export function useCancelarCobrancaPix() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: { txId: string; tenantId: string }) =>
      cancelarCobrancaPixApi(input),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({
        queryKey: pixQueryKeys.cobranca(variables.tenantId, variables.txId),
      });
    },
  });
}
