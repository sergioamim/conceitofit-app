import { useQuery } from "@tanstack/react-query";
import { listAlunosPageService, type ListAlunosPageServiceResult } from "@/lib/comercial/runtime";
import type { StatusAluno } from "@/lib/types";
import { queryKeys } from "./keys";

export function useClientes(input: {
  tenantId: string | undefined;
  tenantResolved: boolean;
  status?: StatusAluno;
  page?: number;
  size?: number;
}) {
  const filters = {
    status: input.status,
    page: input.page ?? 0,
    size: input.size ?? 20,
  };

  return useQuery<ListAlunosPageServiceResult>({
    queryKey: queryKeys.clientes.list(input.tenantId ?? "", filters),
    queryFn: () =>
      listAlunosPageService({
        tenantId: input.tenantId!,
        status: input.status,
        page: input.page,
        size: input.size,
      }),
    enabled: Boolean(input.tenantId) && input.tenantResolved,
  });
}
