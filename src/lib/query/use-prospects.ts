import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createProspectApi,
  deleteProspectApi,
  listProspectsApi,
  marcarProspectPerdidoApi,
  updateProspectApi,
  updateProspectStatusApi,
} from "@/lib/api/crm";
import { normalizeProspectRuntime } from "@/lib/tenant/crm/runtime";
import type { CreateProspectInput, Prospect, StatusProspect } from "@/lib/types";
import { queryKeys } from "./keys";

export function useProspects(input: {
  tenantId: string | undefined;
  tenantResolved: boolean;
}) {
  return useQuery({
    queryKey: queryKeys.prospects.all(input.tenantId ?? ""),
    queryFn: async () => {
      const rows = await listProspectsApi({ tenantId: input.tenantId! });
      return rows
        .map((p) => normalizeProspectRuntime(p))
        .sort((a, b) => b.dataCriacao.localeCompare(a.dataCriacao));
    },
    enabled: Boolean(input.tenantId) && input.tenantResolved,
  });
}

export function useCreateProspect(tenantId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateProspectInput) =>
      createProspectApi({ tenantId: tenantId!, data }),
    onSuccess: (_data, _variables, _context) => {
      if (tenantId) {
        void queryClient.invalidateQueries({
          queryKey: queryKeys.prospects.all(tenantId),
        });
        import("@/lib/shared/analytics").then(({ trackProspectCreated }) => {
          trackProspectCreated(tenantId, _data.id);
        });
      }
    },
  });
}

export function useUpdateProspect(tenantId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: { id: string; data: CreateProspectInput }) =>
      updateProspectApi({ tenantId: tenantId!, id: input.id, data: input.data }),
    onSuccess: () => {
      if (tenantId) {
        void queryClient.invalidateQueries({
          queryKey: queryKeys.prospects.all(tenantId),
        });
      }
    },
  });
}

export function useUpdateProspectStatus(tenantId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: { id: string; status: StatusProspect }) =>
      updateProspectStatusApi({ tenantId: tenantId!, id: input.id, status: input.status }),
    onSuccess: () => {
      if (tenantId) {
        void queryClient.invalidateQueries({
          queryKey: queryKeys.prospects.all(tenantId),
        });
      }
    },
  });
}

export function useMarkProspectLost(tenantId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: { id: string; motivo?: string }) =>
      marcarProspectPerdidoApi({ tenantId: tenantId!, id: input.id, motivo: input.motivo }),
    onSuccess: () => {
      if (tenantId) {
        void queryClient.invalidateQueries({
          queryKey: queryKeys.prospects.all(tenantId),
        });
      }
    },
  });
}

export function useDeleteProspect(tenantId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      deleteProspectApi({ tenantId: tenantId!, id }),
    onSuccess: () => {
      if (tenantId) {
        void queryClient.invalidateQueries({
          queryKey: queryKeys.prospects.all(tenantId),
        });
      }
    },
  });
}
