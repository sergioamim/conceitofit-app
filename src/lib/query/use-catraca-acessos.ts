import { useQuery } from "@tanstack/react-query";
import {
  listarAcessosCatracaDashboardApi,
  type CatracaAcessosDashboardResponse,
} from "@/lib/api/catraca";
import { queryKeys } from "./keys";

export interface UseCatracaAcessosInput {
  tenantId: string | undefined;
  tenantResolved: boolean;
  page?: number;
  size?: number;
  startDate?: string;
  endDate?: string;
  memberId?: string;
  tipoLiberacao?: "TODOS" | "MANUAL" | "AUTOMATICA";
  status?: "TODOS" | "LIBERADO" | "BLOQUEADO";
}

export function useCatracaAcessos(input: UseCatracaAcessosInput) {
  const filters = {
    page: input.page ?? 0,
    size: input.size ?? 20,
    startDate: input.startDate,
    endDate: input.endDate,
    memberId: input.memberId,
    tipoLiberacao: input.tipoLiberacao,
    status: input.status,
  };

  return useQuery<CatracaAcessosDashboardResponse>({
    queryKey: queryKeys.catracaAcessos.list(input.tenantId ?? "", filters),
    queryFn: () =>
      listarAcessosCatracaDashboardApi({
        tenantId: input.tenantId!,
        page: input.page,
        size: input.size,
        startDate: input.startDate,
        endDate: input.endDate,
        memberId: input.memberId,
        tipoLiberacao: input.tipoLiberacao !== "TODOS" ? input.tipoLiberacao : undefined,
        status: input.status !== "TODOS" ? input.status : undefined,
      }),
    enabled: Boolean(input.tenantId) && input.tenantResolved,
    staleTime: 2 * 60 * 1000,
    refetchOnWindowFocus: true,
  });
}
