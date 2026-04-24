import {
  useQuery,
  useMutation,
  useQueryClient,
  useInfiniteQuery,
  type InfiniteData,
} from "@tanstack/react-query";
import {
  listInboxApi,
  marcarLidaApi,
  registrarAcaoApi,
  marcarTodasLidasApi,
  getContadoresApi,
} from "@/lib/api/notificacoes-inbox";
import type {
  NotificacaoInboxContadores,
  NotificacaoInboxListResponse,
} from "@/lib/shared/types/notificacao-inbox";

// ---------------------------------------------------------------------------
// Query keys
// ---------------------------------------------------------------------------

const inboxKeys = {
  list: (tenantId: string, apenasNaoLidas?: boolean) =>
    ["notificacoes-inbox", tenantId, { apenasNaoLidas: !!apenasNaoLidas }] as const,
  infinite: (tenantId: string, apenasNaoLidas?: boolean) =>
    [
      "notificacoes-inbox-infinite",
      tenantId,
      { apenasNaoLidas: !!apenasNaoLidas },
    ] as const,
  contadores: (tenantId: string) =>
    ["notificacoes-inbox-contadores", tenantId] as const,
};

// ---------------------------------------------------------------------------
// Listagem (uma página — usada pelo sino)
// ---------------------------------------------------------------------------

export function useNotificacoesInbox(
  tenantId: string | undefined,
  options?: { apenasNaoLidas?: boolean; limit?: number; enabled?: boolean },
) {
  const apenasNaoLidas = options?.apenasNaoLidas ?? false;
  const limit = options?.limit ?? 50;
  return useQuery<NotificacaoInboxListResponse>({
    queryKey: inboxKeys.list(tenantId ?? "", apenasNaoLidas),
    queryFn: () =>
      listInboxApi({
        tenantId: tenantId ?? "",
        limit,
        apenasNaoLidas,
      }),
    enabled: Boolean(tenantId) && (options?.enabled ?? true),
    staleTime: 30_000,
    refetchInterval: 60_000,
  });
}

// ---------------------------------------------------------------------------
// Listagem paginada (infinite query — usada pela página /notificacoes)
// ---------------------------------------------------------------------------

export function useNotificacoesInboxInfinite(
  tenantId: string | undefined,
  options?: { apenasNaoLidas?: boolean; limit?: number; enabled?: boolean },
) {
  const apenasNaoLidas = options?.apenasNaoLidas ?? false;
  const limit = options?.limit ?? 50;
  return useInfiniteQuery<
    NotificacaoInboxListResponse,
    Error,
    InfiniteData<NotificacaoInboxListResponse>,
    ReturnType<typeof inboxKeys.infinite>,
    string | null
  >({
    queryKey: inboxKeys.infinite(tenantId ?? "", apenasNaoLidas),
    queryFn: ({ pageParam }) =>
      listInboxApi({
        tenantId: tenantId ?? "",
        limit,
        cursor: pageParam ?? undefined,
        apenasNaoLidas,
      }),
    initialPageParam: null,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    enabled: Boolean(tenantId) && (options?.enabled ?? true),
    staleTime: 30_000,
  });
}

// ---------------------------------------------------------------------------
// Contadores (badge do sino) — polling agressivo
// ---------------------------------------------------------------------------

export function useContadoresInbox(tenantId: string | undefined) {
  return useQuery<NotificacaoInboxContadores>({
    queryKey: inboxKeys.contadores(tenantId ?? ""),
    queryFn: () => getContadoresApi({ tenantId: tenantId ?? "" }),
    enabled: Boolean(tenantId),
    staleTime: 15_000,
    refetchInterval: 30_000,
  });
}

// ---------------------------------------------------------------------------
// Mutations — invalidam tanto a query simples quanto a infinite e os contadores
// ---------------------------------------------------------------------------

function invalidateInboxQueries(
  queryClient: ReturnType<typeof useQueryClient>,
  tenantId: string,
) {
  queryClient.invalidateQueries({
    predicate: (query) => {
      const key = query.queryKey;
      if (!Array.isArray(key) || key.length < 2) return false;
      const [head, qTenantId] = key;
      return (
        (head === "notificacoes-inbox" ||
          head === "notificacoes-inbox-infinite" ||
          head === "notificacoes-inbox-contadores") &&
        qTenantId === tenantId
      );
    },
  });
}

export function useMarcarLida(tenantId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (notificacaoId: string) => marcarLidaApi({ notificacaoId }),
    onSuccess: () => {
      if (tenantId) invalidateInboxQueries(queryClient, tenantId);
    },
  });
}

export function useRegistrarAcao(tenantId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (notificacaoId: string) => registrarAcaoApi({ notificacaoId }),
    onSuccess: () => {
      if (tenantId) invalidateInboxQueries(queryClient, tenantId);
    },
  });
}

export function useMarcarTodasLidas(tenantId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => marcarTodasLidasApi({ tenantId: tenantId ?? "" }),
    onSuccess: () => {
      if (tenantId) invalidateInboxQueries(queryClient, tenantId);
    },
  });
}
