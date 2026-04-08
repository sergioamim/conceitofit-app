"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useSSE } from "@/lib/sse";
import { queryKeys } from "@/lib/query/keys";

interface SSEConversasSyncOptions {
  tenantId: string;
}

interface NovaMensagemData {
  conversationId: string;
  messageId: string;
  content: string;
  contactId: string;
}

interface ConversaEventData {
  conversationId: string;
}

export function useSSEConversasSync({ tenantId }: SSEConversasSyncOptions) {
  const { subscribe } = useSSE();
  const queryClient = useQueryClient();

  useEffect(() => {
    const unsubscribe = subscribe((event, data) => {
      switch (event) {
        case "nova_mensagem": {
          const { conversationId } = data as NovaMensagemData;
          queryClient.invalidateQueries({
            queryKey: queryKeys.conversas.detail(tenantId, conversationId),
          });
          queryClient.invalidateQueries({
            queryKey: queryKeys.conversas.thread(tenantId, conversationId, 0),
          });
          queryClient.invalidateQueries({
            queryKey: queryKeys.conversas.list(tenantId, {}, 0),
          });
          break;
        }
        case "conversa_atualizada": {
          const { conversationId } = data as ConversaEventData;
          queryClient.invalidateQueries({
            queryKey: queryKeys.conversas.detail(tenantId, conversationId),
          });
          queryClient.invalidateQueries({
            queryKey: queryKeys.conversas.list(tenantId, {}, 0),
          });
          break;
        }
        case "conversa_encerrada": {
          const { conversationId } = data as ConversaEventData;
          queryClient.invalidateQueries({
            queryKey: queryKeys.conversas.detail(tenantId, conversationId),
          });
          queryClient.invalidateQueries({
            queryKey: queryKeys.conversas.list(tenantId, {}, 0),
          });
          break;
        }
      }
    });

    return unsubscribe;
  }, [subscribe, queryClient, tenantId]);
}
