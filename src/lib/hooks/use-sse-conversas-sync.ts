"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { useSSE } from "@/lib/sse";
import { queryKeys } from "@/lib/query/keys";
import { playNewMessageSound } from "@/lib/utils/notification-sound";

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
  const pathname = usePathname() ?? "";

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
          // Task #517: beep só quando a conversa da mensagem NÃO está aberta.
          // O pathname /atendimento/inbox/{id} indica qual conversa está ativa.
          const isConversaAtiva =
            pathname.includes("/atendimento/inbox/") &&
            pathname.endsWith(`/${conversationId}`);
          if (!isConversaAtiva) {
            playNewMessageSound();
          }
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
  }, [subscribe, queryClient, tenantId, pathname]);
}
