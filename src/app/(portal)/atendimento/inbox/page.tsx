"use client";

import { useTenantContext } from "@/lib/tenant/hooks/use-session-context";
import { SSEConnectionProvider } from "@/lib/sse";
import { InboxContent } from "./inbox-content";

export default function InboxPage() {
  const { tenantId, tenantResolved } = useTenantContext();

  if (!tenantResolved || !tenantId) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-sm text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  return (
    <SSEConnectionProvider tenantId={tenantId}>
      <InboxContent tenantId={tenantId} tenantResolved={tenantResolved} />
    </SSEConnectionProvider>
  );
}
