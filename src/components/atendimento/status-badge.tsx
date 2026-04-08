"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { ConversationStatus } from "@/lib/shared/types/whatsapp-crm";

const STATUS_CONFIG: Record<
  ConversationStatus,
  { label: string; className: string }
> = {
  ABERTA: {
    label: "Aberta",
    className: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  },
  EM_ATENDIMENTO: {
    label: "Em atendimento",
    className: "bg-gym-teal/10 text-gym-teal border-gym-teal/20",
  },
  PENDENTE: {
    label: "Pendente",
    className: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  },
  ENCERRADA: {
    label: "Encerrada",
    className: "bg-muted/50 text-muted-foreground border-border/40",
  },
  SPAM: {
    label: "Spam",
    className: "bg-muted/30 text-muted-foreground/70 border-border/30",
  },
  BLOQUEADA: {
    label: "Bloqueada",
    className: "bg-gym-danger/10 text-gym-danger border-gym-danger/20",
  },
};

interface ConversaStatusBadgeProps {
  status: ConversationStatus;
  className?: string;
}

export function ConversaStatusBadge({ status, className }: ConversaStatusBadgeProps) {
  const config = STATUS_CONFIG[status] ?? {
    label: status,
    className: "bg-muted text-muted-foreground border-border",
  };

  return (
    <Badge
      variant="outline"
      className={cn(
        "text-[10px] font-bold uppercase tracking-wider",
        config.className,
        className
      )}
    >
      {config.label}
    </Badge>
  );
}
