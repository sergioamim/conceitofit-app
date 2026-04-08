import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getWhatsAppConfigApi,
  saveWhatsAppConfigApi,
  testWhatsAppConnectionApi,
  listWhatsAppTemplatesApi,
  createWhatsAppTemplateApi,
  updateWhatsAppTemplateApi,
  deleteWhatsAppTemplateApi,
  listWhatsAppLogsApi,
  sendWhatsAppMessageApi,
  getWhatsAppMessageStatusApi,
  getWhatsAppStatsApi,
} from "@/lib/api/whatsapp";
import type {
  WhatsAppConfig,
  WhatsAppMessageLog,
  WhatsAppTemplate,
} from "@/lib/types";
import { queryKeys } from "./keys";

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

export function useWhatsAppConfig(input: {
  tenantId: string | undefined;
  tenantResolved: boolean;
}) {
  return useQuery<WhatsAppConfig | null>({
    queryKey: queryKeys.whatsapp.config(input.tenantId ?? ""),
    queryFn: () => getWhatsAppConfigApi({ tenantId: input.tenantId! }),
    enabled: Boolean(input.tenantId) && input.tenantResolved,
    staleTime: 10 * 60 * 1000,
  });
}

export function useSaveWhatsAppConfig() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: {
      tenantId: string;
      data: Parameters<typeof saveWhatsAppConfigApi>[0]["data"];
    }) => saveWhatsAppConfigApi(input),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.whatsapp.config(variables.tenantId),
      });
    },
  });
}

// ---------------------------------------------------------------------------
// Templates
// ---------------------------------------------------------------------------

export function useWhatsAppTemplates(input: {
  tenantId: string | undefined;
  tenantResolved: boolean;
}) {
  return useQuery<WhatsAppTemplate[]>({
    queryKey: queryKeys.whatsapp.templates(input.tenantId ?? ""),
    queryFn: () => listWhatsAppTemplatesApi({ tenantId: input.tenantId! }),
    enabled: Boolean(input.tenantId) && input.tenantResolved,
    staleTime: 5 * 60 * 1000,
  });
}

function useInvalidateTemplates() {
  const queryClient = useQueryClient();
  return (tenantId: string) =>
    queryClient.invalidateQueries({
      queryKey: queryKeys.whatsapp.templates(tenantId),
    });
}

export function useCreateWhatsAppTemplate() {
  const invalidate = useInvalidateTemplates();

  return useMutation({
    mutationFn: (input: {
      tenantId: string;
      data: Parameters<typeof createWhatsAppTemplateApi>[0]["data"];
    }) => createWhatsAppTemplateApi(input),
    onSuccess: (_data, variables) => invalidate(variables.tenantId),
  });
}

export function useUpdateWhatsAppTemplate() {
  const invalidate = useInvalidateTemplates();

  return useMutation({
    mutationFn: (input: {
      tenantId: string;
      id: string;
      data: Parameters<typeof updateWhatsAppTemplateApi>[0]["data"];
    }) => updateWhatsAppTemplateApi(input),
    onSuccess: (_data, variables) => invalidate(variables.tenantId),
  });
}

export function useDeleteWhatsAppTemplate() {
  const invalidate = useInvalidateTemplates();

  return useMutation({
    mutationFn: (input: { tenantId: string; id: string }) =>
      deleteWhatsAppTemplateApi(input),
    onSuccess: (_data, variables) => invalidate(variables.tenantId),
  });
}

// ---------------------------------------------------------------------------
// Logs (polling — staleTime:0, refetchInterval:10s)
// ---------------------------------------------------------------------------

export function useWhatsAppLogs(input: {
  tenantId: string | undefined;
  tenantResolved: boolean;
  enabled?: boolean;
}) {
  return useQuery<WhatsAppMessageLog[]>({
    queryKey: queryKeys.whatsapp.logs(input.tenantId ?? ""),
    queryFn: () =>
      listWhatsAppLogsApi({ tenantId: input.tenantId!, size: 50 }),
    enabled:
      Boolean(input.tenantId) &&
      input.tenantResolved &&
      (input.enabled ?? true),
    staleTime: 0,
    refetchInterval: 10_000,
  });
}

// ---------------------------------------------------------------------------
// Send Message (Task 480)
// ---------------------------------------------------------------------------

export function useSendWhatsAppMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: {
      tenantId: string;
      data: {
        templateId?: string;
        evento: string;
        destinatario: string;
        destinatarioNome?: string;
        variaveis?: Record<string, string>;
      };
    }) => sendWhatsAppMessageApi(input),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.whatsapp.logs(variables.tenantId),
      });
    },
  });
}

// ---------------------------------------------------------------------------
// Message Status (Task 479)
// ---------------------------------------------------------------------------

function useWhatsAppMessageStatus(input: {
  tenantId: string | undefined;
  messageId: string | undefined;
  enabled?: boolean;
}) {
  return useQuery({
    queryKey: ["whatsapp", "status", input.tenantId, input.messageId],
    queryFn: () =>
      getWhatsAppMessageStatusApi({
        tenantId: input.tenantId!,
        messageId: input.messageId!,
      }),
    enabled:
      Boolean(input.tenantId) &&
      Boolean(input.messageId) &&
      (input.enabled ?? true),
    staleTime: 5_000,
    refetchInterval: 5_000,
  });
}

// ---------------------------------------------------------------------------
// Test Connection (Task 481)
// ---------------------------------------------------------------------------

export function useTestWhatsAppConnection() {
  return useMutation({
    mutationFn: (input: { tenantId: string }) =>
      testWhatsAppConnectionApi(input),
  });
}

// ---------------------------------------------------------------------------
// Stats / Monitoring (Task 481)
// ---------------------------------------------------------------------------

export function useWhatsAppStats(input: {
  tenantId: string | undefined;
  tenantResolved: boolean;
  enabled?: boolean;
}) {
  return useQuery({
    queryKey: ["whatsapp", "stats", input.tenantId],
    queryFn: () => getWhatsAppStatsApi({ tenantId: input.tenantId! }),
    enabled:
      Boolean(input.tenantId) &&
      input.tenantResolved &&
      (input.enabled ?? true),
    staleTime: 30_000,
    refetchInterval: 30_000,
  });
}
