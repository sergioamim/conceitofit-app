"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ArrowDown, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { MessageBubble } from "./message-bubble";
import type {
  MensagemResponse,
  MensagemPageResponse,
} from "@/lib/shared/types/whatsapp-crm";

interface MessageThreadProps {
  conversationId: string;
  mensagens: MensagemPageResponse;
  isLoading: boolean;
  hasNextPage: boolean;
  onLoadMore: () => void;
}

function isSameDay(a: string, b: string): boolean {
  return a.slice(0, 10) === b.slice(0, 10);
}

function formatDaySeparator(date: string): string {
  return format(new Date(date), "d 'de' MMMM 'de' yyyy", { locale: ptBR });
}

export function MessageThread({
  conversationId,
  mensagens,
  isLoading,
  hasNextPage,
  onLoadMore,
}: MessageThreadProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const [showNewBadge, setShowNewBadge] = useState(false);
  const prevCountRef = useRef(0);
  const userScrolledUpRef = useRef(false);

  // Mensagens invertidas (backend retorna DESC, exibir ASC)
  const sorted: MensagemResponse[] = [...mensagens.content].reverse();

  const isNearBottom = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return true;
    return el.scrollHeight - el.scrollTop - el.clientHeight < 80;
  }, []);

  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    setShowNewBadge(false);
    userScrolledUpRef.current = false;
  }, []);

  // Auto-scroll quando nova mensagem chega
  useEffect(() => {
    const count = sorted.length;
    if (count > prevCountRef.current && prevCountRef.current > 0) {
      if (isNearBottom()) {
        scrollToBottom();
      } else {
        setShowNewBadge(true);
        userScrolledUpRef.current = true;
      }
    }
    prevCountRef.current = count;
  }, [sorted.length, isNearBottom, scrollToBottom]);

  // Scroll inicial para baixo
  useEffect(() => {
    if (!isLoading && sorted.length > 0) {
      bottomRef.current?.scrollIntoView();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId]);

  const handleScroll = useCallback(() => {
    if (isNearBottom()) {
      setShowNewBadge(false);
      userScrolledUpRef.current = false;
    }
  }, [isNearBottom]);

  if (isLoading && sorted.length === 0) {
    return (
      <div className="flex flex-col gap-3 p-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className={cn(
              "flex",
              i % 2 === 0 ? "justify-start" : "justify-end"
            )}
          >
            <Skeleton
              className={cn(
                "rounded-2xl",
                i % 2 === 0 ? "h-12 w-48" : "h-10 w-40"
              )}
            />
          </div>
        ))}
      </div>
    );
  }

  if (sorted.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
        Nenhuma mensagem nesta conversa ainda.
      </div>
    );
  }

  return (
    <div className="relative flex flex-col h-full">
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-4 space-y-1"
      >
        {/* Load more */}
        {hasNextPage && (
          <div className="flex justify-center pb-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={onLoadMore}
              disabled={isLoading}
              className="text-xs text-muted-foreground"
            >
              {isLoading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
              ) : null}
              Carregar mensagens anteriores
            </Button>
          </div>
        )}

        {/* Messages with day separators */}
        {sorted.map((msg, idx) => {
          const showSeparator =
            idx === 0 ||
            !isSameDay(sorted[idx - 1].createdAt, msg.createdAt);

          return (
            <div key={msg.id}>
              {showSeparator && (
                <div className="flex items-center gap-3 py-3">
                  <div className="flex-1 h-px bg-border/40" />
                  <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
                    {formatDaySeparator(msg.createdAt)}
                  </span>
                  <div className="flex-1 h-px bg-border/40" />
                </div>
              )}
              <MessageBubble message={msg} />
            </div>
          );
        })}

        <div ref={bottomRef} />
      </div>

      {/* New message badge */}
      {showNewBadge && (
        <button
          onClick={scrollToBottom}
          className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gym-teal text-background text-xs font-medium shadow-lg hover:bg-gym-teal/90 transition-colors"
        >
          <ArrowDown className="h-3.5 w-3.5" />
          Nova mensagem
        </button>
      )}
    </div>
  );
}
