# Task ID: 494

**Title:** Hook de sync SSE com React Query invalidation

**Status:** pending

**Dependencies:** 491, 493

**Priority:** high

**Description:** Criar hook `useSSEConversasSync` que ouve eventos SSE e invalida as queries de conversas/thread correspondentes no React Query.

**Details:**

Criar `src/lib/hooks/use-sse-conversas-sync.ts`:

Hook `useSSEConversasSync({ tenantId })`:
- Usar `useSSE()` para obter `subscribe`.
- Usar `useQueryClient()` do React Query.
- Registrar handler SSE que escuta eventos e invalida queries:
  - `nova_mensagem` com `{ conversationId, messageId, content, contactId }`:
    - Invalidar `queryKeys.conversas.detail(tenantId, conversationId)`
    - Invalidar `queryKeys.conversas.thread(tenantId, conversationId, 0)`
    - Invalidar `queryKeys.conversas.list(tenantId, {}, 0)`
  - `conversa_atualizada` com `{ conversationId }`:
    - Invalidar `queryKeys.conversas.detail(tenantId, conversationId)`
    - Invalidar `queryKeys.conversas.list(tenantId, {}, 0)`
  - `conversa_encerrada` com `{ conversationId }`:
    - Invalidar `queryKeys.conversas.detail(tenantId, conversationId)`
    - Invalidar `queryKeys.conversas.list(tenantId, {}, 0)`
- Cleanup: chamar unsubscribe no unmount.
- Só ativar se `isConnected` do SSE for true.

**Test Strategy:**

Mock do `useSSE` emitindo eventos e verificar que `queryClient.invalidateQueries` é chamado com as keys corretas. Verificar cleanup no unmount.
