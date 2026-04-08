"use client";

import { AlertTriangle, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { WhatsAppCredentialResponse, WhatsAppOnboardingStatus } from "@/lib/shared/types/whatsapp-crm";

const STATUS_STYLES: Record<WhatsAppOnboardingStatus, { label: string; className: string }> = {
  VERIFIED: {
    label: "Verificado",
    className: "bg-gym-teal/10 text-gym-teal border-gym-teal/20",
  },
  PENDING: {
    label: "Pendente",
    className: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  },
  REJECTED: {
    label: "Rejeitado",
    className: "bg-gym-danger/10 text-gym-danger border-gym-danger/20",
  },
  EXPIRED: {
    label: "Expirado",
    className: "bg-muted/50 text-muted-foreground border-border/40",
  },
};

interface CredentialHealthBadgeProps {
  credential: WhatsAppCredentialResponse;
  className?: string;
}

export function CredentialHealthBadge({
  credential,
  className,
}: CredentialHealthBadgeProps) {
  const config = STATUS_STYLES[credential.onboardingStatus];

  const tooltipLines = [
    `Status: ${config.label}`,
    credential.tokenExpired ? "Token expirado" : null,
    credential.tokenExpiringSoon ? "Token expirando em breve" : null,
    credential.lastHealthCheckAt
      ? `Último check: ${credential.lastHealthCheckAt.slice(0, 16).replace("T", " ")}`
      : null,
  ].filter(Boolean);

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className={cn("inline-flex items-center gap-1", className)}>
            <Badge
              variant="outline"
              className={cn("text-[10px] font-bold uppercase tracking-wider", config.className)}
            >
              {config.label}
            </Badge>
            {credential.tokenExpiringSoon && !credential.tokenExpired && (
              <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
            )}
            {credential.tokenExpired && (
              <XCircle className="h-3.5 w-3.5 text-gym-danger" />
            )}
          </span>
        </TooltipTrigger>
        <TooltipContent>
          {tooltipLines.map((line, i) => (
            <p key={i}>{line}</p>
          ))}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
