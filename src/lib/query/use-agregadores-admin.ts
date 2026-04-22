import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  type AgregadorConfigResponse,
  type AgregadorConfigSecretResponse,
  type AgregadorConfigCreateInput,
  type AgregadorConfigUpdateInput,
  type AgregadorSchemaResponse,
  type AgregadorTestConnectionResult,
  type AgregadorTipo,
  type AgregadorWebhookEventosPage,
  type ListAgregadorEventosInput,
  createAgregadorConfigApi,
  deleteAgregadorConfigApi,
  getAgregadoresSchemaApi,
  listAgregadorEventosApi,
  listAgregadoresConfigsApi,
  reprocessarAgregadorEventoApi,
  rotateAgregadorTokenApi,
  rotateAgregadorWebhookSecretApi,
  testAgregadorConnectionApi,
  updateAgregadorConfigApi,
} from "@/lib/api/agregadores-admin";
import { queryKeys } from "./keys";

/**
 * Hooks React Query para a UI admin de agregadores (ADR-012, AG-7.7 → AG-7.10).
 *
 * - Schema é imutável por release → staleTime longo.
 * - Lista de configs por tenant é a leitura principal do dashboard.
 * - test-connection e mutations de write são `useMutation` (side-effects).
 * - Rotate endpoints retornam secret one-time — callers devem mostrar em
 *   Dialog dedicado e descartar após copiar.
 */

export function useAgregadoresSchema() {
  return useQuery<AgregadorSchemaResponse>({
    queryKey: queryKeys.admin.agregadores.schema(),
    queryFn: () => getAgregadoresSchemaApi(),
    staleTime: 30 * 60 * 1000,
  });
}

export function useAgregadoresConfigs(tenantId: string | undefined) {
  return useQuery<AgregadorConfigResponse[]>({
    queryKey: queryKeys.admin.agregadores.configs(tenantId ?? ""),
    queryFn: () => listAgregadoresConfigsApi({ tenantId: tenantId! }),
    enabled: Boolean(tenantId),
  });
}

export function useTestAgregadorConnection() {
  return useMutation<
    AgregadorTestConnectionResult,
    Error,
    { tipo: AgregadorTipo; tenantId: string }
  >({
    mutationFn: (vars) => testAgregadorConnectionApi(vars),
  });
}

/**
 * Cria config do agregador no tenant. Invalida a lista de configs do tenant
 * para forçar refetch após o sucesso.
 */
export function useCreateAgregadorConfig(tenantId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation<
    AgregadorConfigSecretResponse,
    Error,
    { tipo: AgregadorTipo; payload: AgregadorConfigCreateInput }
  >({
    mutationFn: (vars) => createAgregadorConfigApi(vars),
    onSuccess: () => {
      if (tenantId) {
        void queryClient.invalidateQueries({
          queryKey: queryKeys.admin.agregadores.configs(tenantId),
        });
      }
    },
  });
}

/**
 * Atualiza campos não-sensíveis da config. Nunca envia secrets.
 */
export function useUpdateAgregadorConfig(tenantId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation<
    AgregadorConfigResponse,
    Error,
    { tipo: AgregadorTipo; payload: AgregadorConfigUpdateInput }
  >({
    mutationFn: (vars) => updateAgregadorConfigApi(vars),
    onSuccess: () => {
      if (tenantId) {
        void queryClient.invalidateQueries({
          queryKey: queryKeys.admin.agregadores.configs(tenantId),
        });
      }
    },
  });
}

/**
 * Rotaciona access_token. O caller envia o novo token recebido do parceiro.
 * A resposta NÃO exibe o token (admin já o digitou), mas pode retornar
 * metadata de grace period.
 */
export function useRotateAgregadorToken(tenantId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation<
    AgregadorConfigSecretResponse,
    Error,
    { tipo: AgregadorTipo; newAccessToken: string }
  >({
    mutationFn: (vars) =>
      rotateAgregadorTokenApi({
        tipo: vars.tipo,
        tenantId: tenantId!,
        newAccessToken: vars.newAccessToken,
      }),
    onSuccess: () => {
      if (tenantId) {
        void queryClient.invalidateQueries({
          queryKey: queryKeys.admin.agregadores.configs(tenantId),
        });
      }
    },
  });
}

/**
 * Rotaciona webhook_secret. Resposta contém o novo valor UMA ÚNICA VEZ —
 * UI deve revelar em Dialog one-time e orientar o admin a guardá-lo.
 */
export function useRotateAgregadorWebhookSecret(tenantId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation<
    AgregadorConfigSecretResponse,
    Error,
    { tipo: AgregadorTipo }
  >({
    mutationFn: (vars) =>
      rotateAgregadorWebhookSecretApi({
        tipo: vars.tipo,
        tenantId: tenantId!,
      }),
    onSuccess: () => {
      if (tenantId) {
        void queryClient.invalidateQueries({
          queryKey: queryKeys.admin.agregadores.configs(tenantId),
        });
      }
    },
  });
}

/**
 * Soft delete — desabilita a config e limpa secrets (ação reversível via
 * novo "Configurar").
 */
export function useDeleteAgregadorConfig(tenantId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation<void, Error, { tipo: AgregadorTipo }>({
    mutationFn: (vars) =>
      deleteAgregadorConfigApi({
        tipo: vars.tipo,
        tenantId: tenantId!,
      }),
    onSuccess: () => {
      if (tenantId) {
        void queryClient.invalidateQueries({
          queryKey: queryKeys.admin.agregadores.configs(tenantId),
        });
      }
    },
  });
}

/**
 * AG-7.10 — monitor de eventos. Stub enquanto endpoint GET não existe.
 */
export function useAgregadorEventos(input: ListAgregadorEventosInput) {
  const { tenantId, ...filters } = input;
  return useQuery<AgregadorWebhookEventosPage>({
    queryKey: queryKeys.admin.agregadores.eventos(
      tenantId ?? "",
      filters as Record<string, unknown>,
    ),
    queryFn: () => listAgregadorEventosApi(input),
    enabled: Boolean(tenantId),
  });
}

/**
 * Reprocessa um evento de webhook pontual. Invalida lista de eventos para
 * refletir o novo status.
 */
export function useReprocessarAgregadorEvento(tenantId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation<
    { success: boolean; message?: string },
    Error,
    { tipo: AgregadorTipo; eventId: string }
  >({
    mutationFn: (vars) =>
      reprocessarAgregadorEventoApi({
        tipo: vars.tipo,
        tenantId: tenantId!,
        eventId: vars.eventId,
      }),
    onSuccess: () => {
      if (tenantId) {
        void queryClient.invalidateQueries({
          queryKey: ["admin", "agregadores", "eventos", tenantId],
        });
      }
    },
  });
}
