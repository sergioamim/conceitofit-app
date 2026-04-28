import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { listAlunosPageService, type ListAlunosPageServiceResult, updateAlunoService } from "@/lib/tenant/comercial/runtime";
import type { StatusAluno } from "@/lib/types";
import type { ClienteAgregadorTipo } from "@/lib/tenant/comercial/clientes-filters";
import type { ClienteListView } from "@/lib/tenant/comercial/clientes-list-view";
import { queryKeys } from "./keys";

export function useClientes(input: {
  tenantId: string | undefined;
  tenantResolved: boolean;
  status?: StatusAluno;
  /** Termo de busca server-side (nome/email/CPF/telefone). P0-B 2026-04-23. */
  search?: string;
  view?: ClienteListView;
  comPendenciaFinanceira?: boolean;
  comAgregador?: boolean;
  tipoAgregador?: ClienteAgregadorTipo;
  comResponsavel?: boolean;
  semPlanoAtivo?: boolean;
  acessoBloqueado?: boolean;
  page?: number;
  size?: number;
}) {
  const filters = {
    status: input.status,
    search: input.search,
    view: input.view,
    comPendenciaFinanceira: input.comPendenciaFinanceira,
    comAgregador: input.comAgregador,
    tipoAgregador: input.tipoAgregador,
    comResponsavel: input.comResponsavel,
    semPlanoAtivo: input.semPlanoAtivo,
    acessoBloqueado: input.acessoBloqueado,
    page: input.page ?? 0,
    size: input.size ?? 20,
  };

  return useQuery<ListAlunosPageServiceResult>({
    queryKey: queryKeys.clientes.list(input.tenantId ?? "", filters),
    queryFn: () =>
      listAlunosPageService({
        tenantId: input.tenantId!,
        status: input.status,
        search: input.search,
        view: input.view,
        comPendenciaFinanceira: input.comPendenciaFinanceira,
        comAgregador: input.comAgregador,
        tipoAgregador: input.tipoAgregador,
        comResponsavel: input.comResponsavel,
        semPlanoAtivo: input.semPlanoAtivo,
        acessoBloqueado: input.acessoBloqueado,
        page: input.page,
        size: input.size,
      }),
    enabled: Boolean(input.tenantId) && input.tenantResolved,
    // Task 485: lista de clientes muda pouco — 60s staleTime, 10min gcTime
    staleTime: 60_000,
    gcTime: 10 * 60 * 1000,
  });
}

export function useUpdateCliente(tenantId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: {
      tenantId: string;
      id: string;
      data: Parameters<typeof updateAlunoService>[0]["data"];
    }) => updateAlunoService(input),
    onSuccess: () => {
      if (tenantId) {
        void queryClient.invalidateQueries({
          queryKey: queryKeys.clientes.all(tenantId),
        });
      }
    },
  });
}
