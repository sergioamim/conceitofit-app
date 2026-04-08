# Task ID: 507

**Title:** Página Inbox de Conversas — /atendimento/inbox

**Status:** pending

**Dependencies:** 491, 493, 494, 499, 500, 501

**Priority:** high

**Description:** Criar página principal do inbox integrando ConversationList, ConversationFilters e InboxLayout com conexão SSE e React Query.

**Details:**

Criar `src/app/(portal)/atendimento/inbox/page.tsx` e `src/app/(portal)/atendimento/inbox/inbox-content.tsx`:

**`page.tsx`:**
- Client component com `"use client"`.
- Obter `tenantId` e `tenantResolved` via `useTenantContext()`.
- Envolver com `SSEConnectionProvider({ tenantId })`.
- Renderizar `InboxContent`.

**`inbox-content.tsx`:**
- Usar `useConversas({ tenantId, filters, page, size })` para carregar lista.
- Usar `useSSEConversasSync({ tenantId })` para sync em tempo real.
- Estado local: `selectedConversationId: string | null`.
- Layout: `InboxLayout` com:
  - Sidebar: `ConversationList` + `ConversationFilters` acima.
  - Main: Se `selectedConversationId` existe, navegar para `/atendimento/inbox/{id}` via `router.push`. Senão, mostrar `EmptyInboxState`.
- **URL search params:** Filtros (`status`, `queue`, `busca`, `ownerUserId`) sincronizados com URL. Usar `useSearchParams` + `useRouter` para persistir filtros.
- **Loading:** Skeleton na lista lateral.
- **Erro:** Toast + retry.
- **Paginação:** Infinite scroll ou "Carregar mais" no final da lista.

**Test Strategy:**

Teste E2E: abrir inbox → ver lista de conversas → aplicar filtro → selecionar conversa → navegar para detalhe. Testar SSE: simular nova mensagem e verificar que lista atualiza. Testar mobile: layout responsivo.
