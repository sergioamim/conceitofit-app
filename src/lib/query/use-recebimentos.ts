import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getNfseConfiguracaoAtualApi, listAgregadorTransacoesApi } from "@/lib/api/financeiro-operacional";
import { emitirNfsePagamentoApi } from "@/lib/api/pagamentos";
import {
  createRecebimentoAvulsoService,
  listContasReceberOperacionais,
  type PagamentoComAluno,
} from "@/lib/tenant/financeiro/recebimentos";
import type { AgregadorTransacao, NfseConfiguracao, TipoFormaPagamento } from "@/lib/types";
import { queryKeys } from "./keys";

export interface UseRecebimentosInput {
  tenantId: string | undefined;
  tenantResolved: boolean;
  startDate: string;
  endDate: string;
}

export interface RecebimentosData {
  pagamentos: PagamentoComAluno[];
  transacoes: AgregadorTransacao[];
  nfseConfiguracao: NfseConfiguracao | null;
}

export function useRecebimentos(input: UseRecebimentosInput) {
  const filters = { startDate: input.startDate, endDate: input.endDate };

  return useQuery<RecebimentosData>({
    queryKey: queryKeys.recebimentos.list(input.tenantId ?? "", filters),
    queryFn: async () => {
      const [pagamentos, transacoes, nfseConfig] = await Promise.all([
        listContasReceberOperacionais({
          tenantId: input.tenantId!,
          startDate: input.startDate,
          endDate: input.endDate,
        }),
        listAgregadorTransacoesApi({ tenantId: input.tenantId! }),
        getNfseConfiguracaoAtualApi({ tenantId: input.tenantId! }).catch(() => null),
      ]);
      return { pagamentos, transacoes, nfseConfiguracao: nfseConfig };
    },
    enabled: Boolean(input.tenantId) && input.tenantResolved,
    staleTime: 2 * 60 * 1000,
    refetchOnWindowFocus: true,
  });
}

export function useCreateRecebimentoAvulso(tenantId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      clienteNome?: string;
      descricao: string;
      valor: number;
      dataVencimento: string;
      status: "PENDENTE" | "PAGO";
      dataPagamento?: string;
      formaPagamento?: TipoFormaPagamento;
      codigoTransacao?: string;
    }) => createRecebimentoAvulsoService({ tenantId: tenantId!, data }),
    onSuccess: async () => {
      if (tenantId) {
        await queryClient.invalidateQueries({ queryKey: ["recebimentos", "list", tenantId] });
        await queryClient.refetchQueries({ queryKey: ["recebimentos", "list", tenantId], type: "active" });
      }
    },
  });
}

export function useEmitirNfse(tenantId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      emitirNfsePagamentoApi({ tenantId: tenantId!, id }),
    onSuccess: async (pagamento) => {
      if (tenantId) {
        queryClient.setQueriesData<RecebimentosData>(
          { queryKey: ["recebimentos", "list", tenantId] },
          (current) =>
            current
              ? {
                  ...current,
                  pagamentos: current.pagamentos.map((item) =>
                    item.id === pagamento.id
                      ? {
                          ...item,
                          nfseEmitida: pagamento.nfseEmitida,
                          nfseNumero: pagamento.nfseNumero,
                          nfseChave: pagamento.nfseChave,
                          dataEmissaoNfse: pagamento.dataEmissaoNfse,
                        }
                      : item
                  ),
                }
              : current
        );
        await queryClient.invalidateQueries({ queryKey: ["recebimentos", "list", tenantId] });
        await queryClient.refetchQueries({ queryKey: ["recebimentos", "list", tenantId], type: "active" });
      }
    },
  });
}
