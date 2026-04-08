"use client";

import { use } from "react";
import { useTenantContext } from "@/lib/tenant/hooks/use-session-context";
import { SSEConnectionProvider } from "@/lib/sse";
import { ConversationDetail } from "./conversation-detail";

export default function ConversationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
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
      <ConversationDetail
        id={id}
        tenantId={tenantId}
        tenantResolved={tenantResolved}
      />
    </SSEConnectionProvider>
  );
}
