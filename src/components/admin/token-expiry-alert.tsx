"use client";

import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { WhatsAppCredentialResponse } from "@/lib/shared/types/whatsapp-crm";

interface TokenExpiryAlertProps {
  credentials: WhatsAppCredentialResponse[];
  onRenew?: (ids: string[]) => void;
}

export function TokenExpiryAlert({
  credentials,
  onRenew,
}: TokenExpiryAlertProps) {
  const expiring = credentials.filter(
    (c) => c.tokenExpiringSoon || c.tokenExpired,
  );

  if (expiring.length === 0) return null;

  const expired = expiring.filter((c) => c.tokenExpired);
  const soonCount = expiring.length - expired.length;

  return (
    <div className="flex items-center gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3">
      <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0" />
      <div className="flex-1 text-sm">
        {expired.length > 0 && (
          <span className="font-medium text-gym-danger">
            {expired.length} credencial(is) com token expirado.{" "}
          </span>
        )}
        {soonCount > 0 && (
          <span className="text-amber-400">
            {soonCount} credencial(is) com token expirando em breve.
          </span>
        )}
      </div>
      {onRenew && (
        <Button
          variant="outline"
          size="sm"
          className="shrink-0 text-xs border-amber-500/30 text-amber-400 hover:bg-amber-500/15"
          onClick={() => onRenew(expiring.map((c) => c.id))}
        >
          Renovar agora
        </Button>
      )}
    </div>
  );
}
