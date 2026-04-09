"use client";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { formatRelativeTime } from "@/lib/formatters";
import type { MensagemResponse } from "@/lib/shared/types/whatsapp-crm";
import { MessageMediaPreview } from "./message-media-preview";

const DELIVERY_ICONS: Record<string, string> = {
  PENDENTE: "\u2713",
  ENTREGUE: "\u2713\u2713",
  LIDO: "\u2713\u2713\u2713",
  FALHOU: "\u2717",
  NAO_ENTREGUE: "\u2717",
};

interface MessageBubbleProps {
  message: MensagemResponse;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isOutbound = message.direction === "OUTBOUND";
  const isText = message.contentType === "TEXTO";

  return (
    <div
      className={cn(
        "flex w-full",
        isOutbound ? "justify-end" : "justify-start"
      )}
    >
      <div
        className={cn(
          "max-w-[75%] rounded-2xl px-4 py-2.5 space-y-1",
          isOutbound
            ? "bg-gym-teal/15 text-foreground rounded-br-md"
            : "bg-surface2 text-foreground rounded-bl-md"
        )}
      >
        {message.isAutomated && (
          <Badge
            variant="secondary"
            className="text-[9px] px-1.5 py-0 mb-1 font-medium"
          >
            Automação
          </Badge>
        )}

        {isText ? (
          <p className="text-sm whitespace-pre-wrap break-words">
            {message.content}
          </p>
        ) : (
          <MessageMediaPreview
            contentType={message.contentType}
            mediaUrl={message.mediaUrl}
            content={message.content}
          />
        )}

        <div
          className={cn(
            "flex items-center gap-1.5 text-[10px] text-muted-foreground",
            isOutbound ? "justify-end" : "justify-start"
          )}
        >
          <span>{formatRelativeTime(message.createdAt)}</span>
          {isOutbound && (
            <span
              className={cn(
                message.deliveryStatus === "FALHOU" ||
                  message.deliveryStatus === "NAO_ENTREGUE"
                  ? "text-gym-danger"
                  : message.deliveryStatus === "LIDO"
                    ? "text-blue-400"
                    : "text-muted-foreground"
              )}
            >
              {DELIVERY_ICONS[message.deliveryStatus] ?? ""}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
