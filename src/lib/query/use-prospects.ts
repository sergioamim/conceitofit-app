import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createProspectApi,
  deleteProspectApi,
  getSumarioProspectsApi,
  listProspectsApi,
  listProspectsPageApi,
  marcarProspectPerdidoApi,
  updateProspectApi,
  updateProspectStatusApi,
  type SumarioProspectsApiResponse,
} from "@/lib/api/crm";
import { normalizeProspectRuntime } from "@/lib/tenant/crm/runtime";
import { triggerCadenciasOnStatusChange } from "@/lib/tenant/crm/cadence-engine";
import { logger } from "@/lib/shared/logger";
import type { CreateProspectInput, OrigemProspect, Prospect, StatusProspect } from "@/lib/types";
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
    // Task 485: prospects mudam rápido — 15s staleTime
    staleTime: 15_000,
  });
}

export interface UseProspectsPageResult {
  items: Prospect[];
  total: number;
  page: number;
  size: number;
  hasNext: boolean;
}

/**
 * P1 (2026-04-23): versão paginada do `useProspects` com filtros
 * server-side. Substitui o load-all-then-filter na tela /prospects.
 * O hook legado `useProspects` fica preservado pro kanban (cadence-engine
 * etc.) que ainda carrega tudo.
 */
export function useProspectsPage(input: {
  tenantId: string | undefined;
  tenantResolved: boolean;
  status?: StatusProspect;
  origem?: OrigemProspect;
  search?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  size?: number;
}) {
  const filters = {
    status: input.status ?? null,
    origem: input.origem ?? null,
    search: input.search ?? null,
    startDate: input.startDate ?? null,
    endDate: input.endDate ?? null,
    page: input.page ?? 0,
    size: input.size ?? 50,
  };

  return useQuery<UseProspectsPageResult>({
    queryKey: [
      ...queryKeys.prospects.all(input.tenantId ?? ""),
      "paged",
      filters,
    ],
    queryFn: async () => {
      const page = await listProspectsPageApi({
        tenantId: input.tenantId!,
        status: input.status,
        origem: input.origem,
        search: input.search,
        startDate: input.startDate,
        endDate: input.endDate,
        page: input.page ?? 0,
        size: input.size ?? 50,
      });
      return {
        ...page,
        items: page.items.map((p) => normalizeProspectRuntime(p)),
      };
    },
    enabled: Boolean(input.tenantId) && input.tenantResolved,
    staleTime: 15_000,
  });
}

/**
 * P1 (2026-04-23): sumário de prospects por status no período.
 * Popula os cards da tela /prospects via GROUP BY no DB.
 */
export function useSumarioProspects(input: {
  tenantId: string | undefined;
  tenantResolved: boolean;
  startDate?: string;
  endDate?: string;
}) {
  return useQuery<SumarioProspectsApiResponse>({
    queryKey: [
      "prospects",
      "sumario",
      input.tenantId ?? "",
      input.startDate ?? null,
      input.endDate ?? null,
    ],
    queryFn: () =>
      getSumarioProspectsApi({
        tenantId: input.tenantId!,
        startDate: input.startDate,
        endDate: input.endDate,
      }),
    enabled: Boolean(input.tenantId) && input.tenantResolved,
    staleTime: 15_000,
  });
}

export function useCreateProspect(tenantId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateProspectInput) =>
      createProspectApi({ tenantId: tenantId!, data }),
    onSuccess: (_data) => {
      if (tenantId) {
        void queryClient.invalidateQueries({
          queryKey: queryKeys.prospects.all(tenantId),
        });
        // Disparar cadências com gatilho NOVO_PROSPECT
        void triggerCadenciasOnStatusChange({
          tenantId,
          prospectId: _data.id,
          novoStatus: "NOVO",
        }).then((result) => {
          if (result.errors.length > 0) {
            logger.warn("Cadência(s) falharam ao disparar para novo prospect", { module: "crm", errors: result.errors });
          }
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
    onSuccess: (_data, variables) => {
      if (tenantId) {
        void queryClient.invalidateQueries({
          queryKey: queryKeys.prospects.all(tenantId),
        });
        // Disparar cadências vinculadas à nova etapa
        void triggerCadenciasOnStatusChange({
          tenantId,
          prospectId: variables.id,
          novoStatus: variables.status,
        }).then((result) => {
          if (result.errors.length > 0) {
            logger.warn("Cadência(s) falharam ao disparar", { module: "crm", errors: result.errors });
          }
        });
      }
    },
  });
}

/**
 * Mutation com optimistic update para o kanban drag-and-drop.
 * Atualiza o cache imediatamente (UI responsiva) e reverte se a API falhar.
 */
export function useOptimisticProspectStatus(tenantId: string | undefined) {
  const queryClient = useQueryClient();
  const queryKey = queryKeys.prospects.all(tenantId ?? "");

  return useMutation({
    mutationFn: (input: { id: string; status: StatusProspect; motivo?: string }) =>
      input.status === "PERDIDO"
        ? marcarProspectPerdidoApi({ tenantId: tenantId!, id: input.id, motivo: input.motivo })
        : updateProspectStatusApi({ tenantId: tenantId!, id: input.id, status: input.status }),

    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<Prospect[]>(queryKey);

      queryClient.setQueryData<Prospect[]>(queryKey, (old) =>
        old?.map((p) =>
          p.id === variables.id
            ? normalizeProspectRuntime(
                { ...p, status: variables.status, dataUltimoContato: new Date().toISOString().slice(0, 19) },
                p,
              )
            : p,
        ),
      );

      return { previous };
    },

    onError: (_err, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData<Prospect[]>(queryKey, context.previous);
      }
    },

    onSettled: (_data, _error, variables) => {
      if (tenantId) {
        void queryClient.invalidateQueries({ queryKey });
        void triggerCadenciasOnStatusChange({
          tenantId,
          prospectId: variables.id,
          novoStatus: variables.status,
        }).then((result) => {
          if (result.errors.length > 0) {
            logger.warn("Cadência(s) falharam ao disparar", { module: "crm-kanban", errors: result.errors });
          }
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
