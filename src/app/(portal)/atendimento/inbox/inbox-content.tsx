"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useConversas } from "@/lib/query/use-conversas";
import { useSSEConversasSync } from "@/lib/hooks/use-sse-conversas-sync";
import { InboxLayout } from "@/components/atendimento/inbox-layout";
import { ConversationList } from "@/components/atendimento/conversation-list";
import {
  ConversationFilters,
} from "@/components/atendimento/conversation-filters";
import { EmptyInboxState } from "@/components/atendimento/empty-inbox-state";
import type { ConversaFilters as ConversaFiltersType } from "@/lib/shared/types/whatsapp-crm";
import type { ActiveFilters } from "@/components/shared/table-filters";

interface InboxContentProps {
  tenantId: string;
  tenantResolved: boolean;
}

export function InboxContent({ tenantId, tenantResolved }: InboxContentProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Sync filters from URL
  const filters = useMemo<ConversaFiltersType>(() => {
    const f: ConversaFiltersType = {};
    const status = searchParams.get("status");
    const queue = searchParams.get("queue");
    const busca = searchParams.get("busca");
    const ownerUserId = searchParams.get("ownerUserId");

    if (status) f.status = status as ConversaFiltersType["status"];
    if (queue) f.queue = queue;
    if (busca) f.busca = busca;
    if (ownerUserId) f.ownerUserId = ownerUserId;

    return f;
  }, [searchParams]);

  // Conversas query
  const { data, isLoading } = useConversas({
    tenantId,
    tenantResolved,
    filters,
    page: 0,
    size: 50,
  });

  // SSE sync
  useSSEConversasSync({ tenantId });

  const conversas = data?.content ?? [];

  // Handle filter changes → sync to URL
  const handleFiltersChange = useCallback(
    (activeFilters: ActiveFilters) => {
      const params = new URLSearchParams();
      for (const [key, value] of Object.entries(activeFilters)) {
        if (value) params.set(key, value);
      }
      const qs = params.toString();
      router.replace(`/atendimento/inbox${qs ? `?${qs}` : ""}`, {
        scroll: false,
      });
    },
    [router],
  );

  // Handle select → navigate to detail
  const handleSelect = useCallback(
    (id: string) => {
      setSelectedId(id);
      router.push(`/atendimento/inbox/${id}`);
    },
    [router],
  );

  const handleBack = useCallback(() => {
    setSelectedId(null);
  }, []);

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="border-b border-border/40 p-3">
        <ConversationFilters onFiltersChange={handleFiltersChange} />
      </div>
      <ConversationList
        conversas={conversas}
        selectedId={selectedId}
        onSelect={handleSelect}
        isLoading={isLoading}
      />
    </div>
  );

  return (
    <InboxLayout
      sidebar={sidebar}
      selectedConversationId={selectedId}
      onBack={handleBack}
    >
      <EmptyInboxState />
    </InboxLayout>
  );
}
