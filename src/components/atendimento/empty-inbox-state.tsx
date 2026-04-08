"use client";

import { MessageSquare } from "lucide-react";

export function EmptyInboxState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
      <div className="relative mb-6">
        <div className="absolute inset-0 rounded-full bg-gym-teal/10 blur-xl scale-150" />
        <div className="relative flex items-center justify-center h-20 w-20 rounded-full bg-surface2 border border-border/40">
          <MessageSquare className="h-10 w-10 text-muted-foreground" />
        </div>
      </div>
      <h3 className="text-lg font-display font-semibold text-foreground mb-2">
        Nenhuma conversa ainda
      </h3>
      <p className="text-sm text-muted-foreground max-w-sm">
        Quando mensagens chegarem via WhatsApp, elas aparecerão aqui.
      </p>
    </div>
  );
}
