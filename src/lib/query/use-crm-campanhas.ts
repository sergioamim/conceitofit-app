import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  createCrmCampanhaApi,
  dispararCrmCampanhaApi,
  encerrarCrmCampanhaApi,
  listCrmCampanhasApi,
  updateCrmCampanhaApi,
} from "@/lib/api/crm";
import type { CampanhaCRM, CampanhaStatus } from "@/lib/types";
import { queryKeys } from "./keys";

function useInvalidateCampanhas() {
  const queryClient = useQueryClient();
  return () =>
    queryClient.invalidateQueries({ queryKey: ["crmCampanhas"] });
}

export function useCrmCampanhas(input: {
  tenantId: string | undefined;
  tenantResolved: boolean;
  status?: CampanhaStatus;
}) {
  return useQuery<CampanhaCRM[]>({
    queryKey: queryKeys.crmCampanhas.list(
      input.tenantId ?? "",
      input.status,
    ),
    queryFn: () =>
      listCrmCampanhasApi({
        tenantId: input.tenantId!,
        status: input.status,
      }),
    enabled: Boolean(input.tenantId) && input.tenantResolved,
    staleTime: 2 * 60 * 1000,
  });
}

export function useCreateCrmCampanha() {
  const invalidate = useInvalidateCampanhas();

  return useMutation({
    mutationFn: (input: {
      tenantId: string;
      data: Parameters<typeof createCrmCampanhaApi>[0]["data"];
    }) => createCrmCampanhaApi(input),
    onSuccess: () => invalidate(),
  });
}

export function useUpdateCrmCampanha() {
  const invalidate = useInvalidateCampanhas();

  return useMutation({
    mutationFn: (input: {
      tenantId: string;
      id: string;
      data: Parameters<typeof updateCrmCampanhaApi>[0]["data"];
    }) => updateCrmCampanhaApi(input),
    onSuccess: () => invalidate(),
  });
}

export function useDispararCrmCampanha() {
  const invalidate = useInvalidateCampanhas();

  return useMutation({
    mutationFn: (input: { tenantId: string; id: string }) =>
      dispararCrmCampanhaApi(input),
    onSuccess: () => invalidate(),
  });
}

export function useEncerrarCrmCampanha() {
  const invalidate = useInvalidateCampanhas();

  return useMutation({
    mutationFn: (input: { tenantId: string; id: string }) =>
      encerrarCrmCampanhaApi(input),
    onSuccess: () => invalidate(),
  });
}
