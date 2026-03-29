import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getMatriculasDashboardMensalService,
  cancelarMatriculaService,
  renovarMatriculaService,
} from "@/lib/tenant/comercial/runtime";
import type { MatriculaDashboardMensalResult } from "@/lib/api/matriculas";
import { ApiRequestError } from "@/lib/api/http";
import { isTenantContextErrorMessage } from "@/lib/shared/utils/error-codes";
import { queryKeys } from "./keys";

const PAGE_SIZE = 20;

function isTenantContextError(error: unknown): boolean {
  if (error instanceof ApiRequestError) {
    return isTenantContextErrorMessage(error.message);
  }
  if (error instanceof Error) {
    return isTenantContextErrorMessage(error.message);
  }
  return false;
}

export function useMatriculas(input: {
  tenantId: string | undefined;
  tenantResolved: boolean;
  monthKey: string;
  page: number;
}) {
  return useQuery<MatriculaDashboardMensalResult>({
    queryKey: queryKeys.matriculas.dashboard(
      input.tenantId ?? "",
      input.monthKey,
      input.page,
    ),
    queryFn: () =>
      getMatriculasDashboardMensalService({
        tenantId: input.tenantId!,
        mes: input.monthKey,
        page: input.page,
        size: PAGE_SIZE,
      }),
    enabled: Boolean(input.tenantId) && input.tenantResolved && input.monthKey.length > 0,
    retry: (failureCount, error) => {
      if (isTenantContextError(error) && failureCount < 1) return true;
      return false;
    },
  });
}

export function useRenovarMatricula() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: { tenantId: string; id: string }) =>
      renovarMatriculaService(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["matriculas"] });
    },
  });
}

export function useCancelarMatricula() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: { tenantId: string; id: string }) =>
      cancelarMatriculaService(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["matriculas"] });
    },
  });
}
