"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useConversaDetail,
  useConversaThread,
  useSendMessage,
  useUpdateConversaStatus,
} from "@/lib/query/use-conversas";
import { useSSE } from "@/lib/sse";
import { useSSEConversasSync } from "@/lib/hooks/use-sse-conversas-sync";
import { ConversationHeader } from "@/components/atendimento/conversation-header";
import { MessageThread } from "@/components/atendimento/message-thread";
import { MessageInput } from "@/components/atendimento/message-input";
import { ContactCard } from "@/components/atendimento/contact-card";
import type {
  ConversationStatus,
  EnviarMensagemRequest,
} from "@/lib/shared/types/whatsapp-crm";
import { normalizeErrorMessage } from "@/lib/utils/api-error";

interface ConversationDetailProps {
  id: string;
  tenantId: string;
  tenantResolved: boolean;
}

export function ConversationDetail({
  id,
  tenantId,
  tenantResolved,
}: ConversationDetailProps) {
  const router = useRouter();
  const { toast } = useToast();
  const { isConnected } = useSSE();
  const [threadPage] = useState(0);
  const [showContact, setShowContact] = useState(true);

  // SSE sync
  useSSEConversasSync({ tenantId });

  // Queries
  const {
    data: conversation,
    isLoading: conversationLoading,
    error: conversationError,
  } = useConversaDetail({
    tenantId,
    id,
    tenantResolved,
  });

  const {
    data: threadData,
    isLoading: threadLoading,
  } = useConversaThread({
    tenantId,
    id,
    tenantResolved,
    page: threadPage,
    size: 50,
  });

  // Mutations
  const sendMessage = useSendMessage();
  const updateStatus = useUpdateConversaStatus();

  const handleSend = useCallback(
    async (data: EnviarMensagemRequest, idempotencyKey: string) => {
      await sendMessage.mutateAsync({
        tenantId,
        conversationId: id,
        data,
        idempotencyKey,
      });
    },
    [sendMessage, tenantId, id],
  );

  const handleStatusChange = useCallback(
    (status: ConversationStatus) => {
      updateStatus.mutate(
        { tenantId, id, status },
        {
          onSuccess: () => {
            toast({ title: `Status alterado para ${status}` });
          },
          onError: (err) => {
            toast({
              title: "Erro ao alterar status",
              description: normalizeErrorMessage(err),
              variant: "destructive",
            });
          },
        },
      );
    },
    [updateStatus, tenantId, id, toast],
  );

  // 404
  if (conversationError) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4">
        <p className="text-sm text-muted-foreground">
          Conversa não encontrada.
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push("/atendimento/inbox")}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar ao inbox
        </Button>
      </div>
    );
  }

  // Loading
  if (conversationLoading || !conversation) {
    return (
      <div className="flex h-full flex-col">
        <div className="border-b border-border/40 p-4">
          <Skeleton className="h-5 w-40 mb-1" />
          <Skeleton className="h-3 w-28" />
        </div>
        <div className="flex-1 p-4 space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className={`flex ${i % 2 === 0 ? "justify-start" : "justify-end"}`}
            >
              <Skeleton className="h-12 w-48 rounded-2xl" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const hasNextPage = threadData ? !threadData.last : false;

  return (
    <div className="flex h-full">
      {/* Main column */}
      <div className="flex flex-1 flex-col min-w-0">
        <ConversationHeader
          conversation={conversation}
          onStatusChange={handleStatusChange}
          onOwnerChange={() => {}}
          onQueueChange={() => {}}
          onUnidadeChange={() => {}}
          onCloseConversation={() => handleStatusChange("ENCERRADA")}
        />

        <div className="flex-1 overflow-hidden">
          {threadData ? (
            <MessageThread
              conversationId={id}
              mensagens={threadData}
              isLoading={threadLoading}
              hasNextPage={hasNextPage}
              onLoadMore={() => {}}
            />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
              Carregando mensagens...
            </div>
          )}
        </div>

        <MessageInput
          conversationId={id}
          tenantId={tenantId}
          onSend={handleSend}
          isSending={sendMessage.isPending}
          sendError={
            sendMessage.isError
              ? normalizeErrorMessage(sendMessage.error)
              : null
          }
        />
      </div>

      {/* Side panel: contact card (desktop) */}
      {showContact && (
        <aside className="hidden xl:flex w-72 flex-col border-l border-border/40 overflow-y-auto p-4">
          <ContactCard conversation={conversation} />
        </aside>
      )}
    </div>
  );
}
