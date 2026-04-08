import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  listConversasApi,
  getConversaDetailApi,
  getConversaThreadApi,
  sendMessageApi,
  updateConversaStatusApi,
  assignConversaOwnerApi,
  moveConversaQueueApi,
  reattribuirConversaUnidadeApi,
  createConversaTaskApi,
  createConversaApi,
} from "@/lib/api/conversas";
import type {
  ConversaFilters,
  EnviarMensagemRequest,
  CriarTarefaConversaRequest,
  CriarConversaRequest,
} from "@/lib/shared/types/whatsapp-crm";
import { queryKeys } from "./keys";

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

export function useConversas(input: {
  tenantId: string | undefined;
  tenantResolved: boolean;
  filters?: ConversaFilters;
  page?: number;
  size?: number;
  enabled?: boolean;
}) {
  const filters = input.filters ?? {};
  const page = input.page ?? 0;
  const size = input.size ?? 20;

  return useQuery({
    queryKey: queryKeys.conversas.list(
      input.tenantId ?? "",
      filters as Record<string, unknown>,
      page,
    ),
    queryFn: () =>
      listConversasApi({
        tenantId: input.tenantId!,
        filters,
        page,
        size,
      }),
    enabled:
      Boolean(input.tenantId) &&
      input.tenantResolved &&
      (input.enabled ?? true),
    staleTime: 0,
    refetchInterval: 15_000, // fallback polling SSE
  });
}

export function useConversaDetail(input: {
  tenantId: string | undefined;
  id: string | undefined;
  tenantResolved: boolean;
  enabled?: boolean;
}) {
  return useQuery({
    queryKey: queryKeys.conversas.detail(
      input.tenantId ?? "",
      input.id ?? "",
    ),
    queryFn: () =>
      getConversaDetailApi({
        tenantId: input.tenantId!,
        id: input.id!,
      }),
    enabled:
      Boolean(input.tenantId) &&
      Boolean(input.id) &&
      input.tenantResolved &&
      (input.enabled ?? true),
    staleTime: 10_000,
  });
}

export function useConversaThread(input: {
  tenantId: string | undefined;
  id: string | undefined;
  tenantResolved: boolean;
  page?: number;
  size?: number;
  enabled?: boolean;
}) {
  const page = input.page ?? 0;
  const size = input.size ?? 50;

  return useQuery({
    queryKey: queryKeys.conversas.thread(
      input.tenantId ?? "",
      input.id ?? "",
      page,
    ),
    queryFn: () =>
      getConversaThreadApi({
        tenantId: input.tenantId!,
        id: input.id!,
        page,
        size,
      }),
    enabled:
      Boolean(input.tenantId) &&
      Boolean(input.id) &&
      input.tenantResolved &&
      (input.enabled ?? true),
    staleTime: 0,
    refetchInterval: 10_000,
  });
}

// ---------------------------------------------------------------------------
// Mutations — helpers para invalidação
// ---------------------------------------------------------------------------

function useInvalidateConversa(tenantId: string, conversationId?: string) {
  const queryClient = useQueryClient();

  return {
    invalidateDetail: () => {
      if (conversationId) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.conversas.detail(tenantId, conversationId),
        });
      }
    },
    invalidateThread: () => {
      if (conversationId) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.conversas.thread(tenantId, conversationId, 0),
        });
      }
    },
    invalidateList: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.conversas.list(tenantId, {}, 0),
      });
    },
    all: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.conversas.all(tenantId),
      });
    },
  };
}

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

export function useSendMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: {
      tenantId: string;
      conversationId: string;
      data: EnviarMensagemRequest;
      idempotencyKey?: string;
    }) =>
      sendMessageApi({
        tenantId: input.tenantId,
        conversationId: input.conversationId,
        data: input.data,
        idempotencyKey: input.idempotencyKey,
      }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.conversas.detail(
          variables.tenantId,
          variables.conversationId,
        ),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.conversas.thread(
          variables.tenantId,
          variables.conversationId,
          0,
        ),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.conversas.list(variables.tenantId, {}, 0),
      });
    },
  });
}

export function useUpdateConversaStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: {
      tenantId: string;
      id: string;
      status: string;
    }) =>
      updateConversaStatusApi({
        tenantId: input.tenantId,
        id: input.id,
        status: input.status as never,
      }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.conversas.detail(variables.tenantId, variables.id),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.conversas.list(variables.tenantId, {}, 0),
      });
    },
  });
}

function useAssignConversaOwner() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: {
      tenantId: string;
      id: string;
      ownerUserId: string;
    }) =>
      assignConversaOwnerApi({
        tenantId: input.tenantId,
        id: input.id,
        ownerUserId: input.ownerUserId,
      }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.conversas.detail(variables.tenantId, variables.id),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.conversas.list(variables.tenantId, {}, 0),
      });
    },
  });
}

function useMoveConversaQueue() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: {
      tenantId: string;
      id: string;
      queue: string;
    }) =>
      moveConversaQueueApi({
        tenantId: input.tenantId,
        id: input.id,
        queue: input.queue,
      }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.conversas.detail(variables.tenantId, variables.id),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.conversas.list(variables.tenantId, {}, 0),
      });
    },
  });
}

function useReattribuirConversaUnidade() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: {
      tenantId: string;
      id: string;
      unidadeId: string;
    }) =>
      reattribuirConversaUnidadeApi({
        tenantId: input.tenantId,
        id: input.id,
        unidadeId: input.unidadeId,
      }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.conversas.detail(variables.tenantId, variables.id),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.conversas.list(variables.tenantId, {}, 0),
      });
    },
  });
}

function useCreateConversaTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: {
      tenantId: string;
      conversationId: string;
      data: CriarTarefaConversaRequest;
    }) =>
      createConversaTaskApi({
        tenantId: input.tenantId,
        conversationId: input.conversationId,
        data: input.data,
      }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.conversas.detail(
          variables.tenantId,
          variables.conversationId,
        ),
      });
    },
  });
}

function useCreateConversa() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: {
      tenantId: string;
      data: CriarConversaRequest;
    }) =>
      createConversaApi({
        tenantId: input.tenantId,
        data: input.data,
      }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.conversas.list(variables.tenantId, {}, 0),
      });
    },
  });
}
