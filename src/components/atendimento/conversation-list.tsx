"use client";

import { useCallback, useRef } from "react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { ConversaStatusBadge } from "./status-badge";
import { formatRelativeTime } from "@/lib/utils/time-format";
import type { ConversaResponse } from "@/lib/shared/types/whatsapp-crm";

interface ConversationListProps {
  conversas: ConversaResponse[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  isLoading: boolean;
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

const AVATAR_COLORS = [
  "bg-blue-500/20 text-blue-400",
  "bg-violet-500/20 text-violet-400",
  "bg-amber-500/20 text-amber-400",
  "bg-gym-teal/20 text-gym-teal",
  "bg-rose-500/20 text-rose-400",
  "bg-cyan-500/20 text-cyan-400",
];

function avatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

export function ConversationList({
  conversas,
  selectedId,
  onSelect,
  isLoading,
}: ConversationListProps) {
  const listRef = useRef<HTMLDivElement>(null);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
      e.preventDefault();

      const currentIdx = conversas.findIndex((c) => c.id === selectedId);
      let nextIdx: number;

      if (e.key === "ArrowDown") {
        nextIdx = currentIdx < conversas.length - 1 ? currentIdx + 1 : 0;
      } else {
        nextIdx = currentIdx > 0 ? currentIdx - 1 : conversas.length - 1;
      }

      onSelect(conversas[nextIdx].id);
    },
    [conversas, selectedId, onSelect]
  );

  if (isLoading) {
    return (
      <div className="flex flex-col gap-1 p-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 p-3 rounded-lg">
            <Skeleton className="h-10 w-10 rounded-full shrink-0" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-3.5 w-28" />
              <Skeleton className="h-3 w-40" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div
      ref={listRef}
      role="listbox"
      aria-label="Lista de conversas"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      className="flex flex-col gap-0.5 p-2 overflow-y-auto h-full focus:outline-none"
    >
      {conversas.map((conversa) => {
        const isSelected = selectedId === conversa.id;
        return (
          <div
            key={conversa.id}
            role="option"
            aria-selected={isSelected}
            onClick={() => onSelect(conversa.id)}
            className={cn(
              "flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-colors",
              isSelected
                ? "bg-gym-teal/10 border border-gym-teal/20"
                : "hover:bg-surface2 border border-transparent"
            )}
          >
            <div
              className={cn(
                "flex items-center justify-center h-10 w-10 rounded-full shrink-0 text-xs font-bold",
                avatarColor(conversa.contatoNome)
              )}
            >
              {getInitials(conversa.contatoNome)}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-semibold text-foreground truncate">
                  {conversa.contatoNome}
                </span>
                {conversa.lastMessageAt && (
                  <span className="text-[10px] text-muted-foreground whitespace-nowrap shrink-0">
                    {formatRelativeTime(conversa.lastMessageAt)}
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between gap-2 mt-0.5">
                <p className="text-xs text-muted-foreground truncate">
                  {conversa.lastMessagePreview ?? "Sem mensagens"}
                </p>
                <ConversaStatusBadge
                  status={conversa.status}
                  className="text-[8px] px-1.5 py-0 shrink-0"
                />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
