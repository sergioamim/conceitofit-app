import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createCrmPlaybookApi,
  createCrmCadenciaApi,
  listCrmPlaybooksApi,
  listCrmCadenciasApi,
  updateCrmPlaybookApi,
  updateCrmCadenciaApi,
} from "@/lib/api/crm";
import type { CrmCadencia, CrmPlaybook } from "@/lib/types";
import { queryKeys } from "./keys";

// ─── Playbooks ────────────────────────────────────────────────────────────

export function useCrmPlaybooks(input: {
  tenantId: string | undefined;
}) {
  return useQuery<CrmPlaybook[]>({
    queryKey: queryKeys.crm.playbooks(input.tenantId ?? ""),
    queryFn: () => listCrmPlaybooksApi({ tenantId: input.tenantId! }),
    enabled: Boolean(input.tenantId),
    staleTime: 2 * 60 * 1000,
  });
}

export function useSavePlaybook(tenantId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: {
      id?: string;
      data: Parameters<typeof createCrmPlaybookApi>[0]["data"];
    }) =>
      input.id
        ? updateCrmPlaybookApi({ tenantId: tenantId!, id: input.id, data: input.data })
        : createCrmPlaybookApi({ tenantId: tenantId!, data: input.data }),
    onSuccess: () => {
      if (tenantId) {
        void queryClient.invalidateQueries({
          queryKey: queryKeys.crm.playbooks(tenantId),
        });
      }
    },
  });
}

// ─── Cadências ────────────────────────────────────────────────────────────

export function useCrmCadencias(input: {
  tenantId: string | undefined;
}) {
  return useQuery<CrmCadencia[]>({
    queryKey: queryKeys.crm.cadencias(input.tenantId ?? ""),
    queryFn: () => listCrmCadenciasApi({ tenantId: input.tenantId! }),
    enabled: Boolean(input.tenantId),
    staleTime: 2 * 60 * 1000,
    retry: false,
  });
}

export function useSaveCadencia(tenantId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: {
      id?: string;
      data: Parameters<typeof createCrmCadenciaApi>[0]["data"];
    }) =>
      input.id
        ? updateCrmCadenciaApi({ tenantId: tenantId!, id: input.id, data: input.data })
        : createCrmCadenciaApi({ tenantId: tenantId!, data: input.data }),
    onSuccess: () => {
      if (tenantId) {
        void queryClient.invalidateQueries({
          queryKey: queryKeys.crm.cadencias(tenantId),
        });
      }
    },
  });
}
