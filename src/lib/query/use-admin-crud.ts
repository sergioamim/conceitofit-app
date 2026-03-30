import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

const ADMIN_STALE_TIME = 5 * 60_000; // 5 min

type AdminCrudConfig<T, TCreate = unknown, TUpdate = unknown> = {
  /** Domínio para a query key (ex: "maquininhas", "contas-bancarias") */
  domain: string;
  tenantId: string | undefined;
  enabled: boolean;
  /** Função de listagem */
  listFn: (tenantId: string) => Promise<T[]>;
  /** Função de criação (opcional) */
  createFn?: (tenantId: string, data: TCreate) => Promise<unknown>;
  /** Função de atualização (opcional) */
  updateFn?: (tenantId: string, id: string, data: TUpdate) => Promise<unknown>;
  /** Função de toggle ativo/inativo (opcional) */
  toggleFn?: (tenantId: string, id: string) => Promise<unknown>;
};

function adminQueryKey(domain: string, tenantId: string) {
  return ["admin", domain, tenantId] as const;
}

export function useAdminCrud<T, TCreate = unknown, TUpdate = unknown>(
  config: AdminCrudConfig<T, TCreate, TUpdate>,
) {
  const queryClient = useQueryClient();
  const tenantId = config.tenantId ?? "";
  const qk = adminQueryKey(config.domain, tenantId);

  const query = useQuery<T[]>({
    queryKey: qk,
    queryFn: () => config.listFn(tenantId),
    enabled: config.enabled && Boolean(tenantId),
    staleTime: ADMIN_STALE_TIME,
    refetchOnWindowFocus: true,
  });

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["admin", config.domain] });

  const createMutation = useMutation({
    mutationFn: (data: TCreate) => config.createFn!(tenantId, data),
    onSuccess: () => void invalidate(),
  });

  const updateMutation = useMutation({
    mutationFn: (input: { id: string; data: TUpdate }) =>
      config.updateFn!(tenantId, input.id, input.data),
    onSuccess: () => void invalidate(),
  });

  const toggleMutation = useMutation({
    mutationFn: (id: string) => config.toggleFn!(tenantId, id),
    onSuccess: () => void invalidate(),
  });

  return {
    items: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,

    create: config.createFn ? createMutation : undefined,
    update: config.updateFn ? updateMutation : undefined,
    toggle: config.toggleFn ? toggleMutation : undefined,
  };
}
