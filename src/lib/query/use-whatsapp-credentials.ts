import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  listCredentialsApi,
  createCredentialApi,
  updateCredentialApi,
  deleteCredentialApi,
  checkCredentialHealthApi,
  refreshCredentialTokenApi,
} from "@/lib/api/whatsapp-credentials";
import type { WhatsAppCredentialRequest } from "@/lib/shared/types/whatsapp-crm";
import { queryKeys } from "./keys";

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

export function useWhatsAppCredentials(input: {
  tenantId: string | undefined;
  tenantResolved: boolean;
  enabled?: boolean;
}) {
  return useQuery({
    queryKey: queryKeys.credentials.all(input.tenantId ?? ""),
    queryFn: () =>
      listCredentialsApi({
        tenantId: input.tenantId!,
      }),
    enabled:
      Boolean(input.tenantId) &&
      input.tenantResolved &&
      (input.enabled ?? true),
    staleTime: 5 * 60 * 1000,
  });
}

export function useCredentialHealth(input: {
  tenantId: string | undefined;
  id: string | undefined;
  tenantResolved: boolean;
  enabled?: boolean;
}) {
  return useQuery({
    queryKey: queryKeys.credentials.health(
      input.tenantId ?? "",
      input.id ?? "",
    ),
    queryFn: () =>
      checkCredentialHealthApi({
        tenantId: input.tenantId!,
        id: input.id!,
      }),
    enabled:
      Boolean(input.tenantId) &&
      Boolean(input.id) &&
      input.tenantResolved &&
      (input.enabled ?? true),
    staleTime: 30_000,
    refetchInterval: 60_000,
  });
}

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

export function useCreateWhatsAppCredential() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: {
      tenantId: string;
      data: WhatsAppCredentialRequest;
    }) =>
      createCredentialApi({
        tenantId: input.tenantId,
        data: input.data,
      }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.credentials.all(variables.tenantId),
      });
    },
  });
}

export function useUpdateWhatsAppCredential() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: {
      tenantId: string;
      id: string;
      data: WhatsAppCredentialRequest;
    }) =>
      updateCredentialApi({
        tenantId: input.tenantId,
        id: input.id,
        data: input.data,
      }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.credentials.all(variables.tenantId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.credentials.health(variables.tenantId, variables.id),
      });
    },
  });
}

export function useDeleteWhatsAppCredential() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: {
      tenantId: string;
      id: string;
    }) =>
      deleteCredentialApi({
        tenantId: input.tenantId,
        id: input.id,
      }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.credentials.all(variables.tenantId),
      });
    },
  });
}

export function useRefreshCredentialToken() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: {
      tenantId: string;
      id: string;
    }) =>
      refreshCredentialTokenApi({
        tenantId: input.tenantId,
        id: input.id,
      }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.credentials.all(variables.tenantId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.credentials.health(variables.tenantId, variables.id),
      });
    },
  });
}
