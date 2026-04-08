# Task ID: 508

**Title:** Página Detalhe da Conversa — /atendimento/inbox/[id]

**Status:** pending

**Dependencies:** 491, 493, 494, 498, 502, 503, 504, 505, 506, 507

**Priority:** high

**Description:** Criar página de detalhe da conversa com header, thread de mensagens, input de envio e card de contato, integrada com SSE para updates em tempo real.

**Details:**

Criar `src/app/(portal)/atendimento/inbox/[id]/page.tsx` e `src/app/(portal)/atendimento/inbox/[id]/conversation-detail.tsx`:

**`page.tsx`:**
- Client component com `"use client"`.
- Obter `id` dos params da rota.
- Obter `tenantId` via `useTenantContext()`.
- Validar: se `!tenantId` ou `!tenantResolved`, mostrar loading.

**`conversation-detail.tsx`:**
- Usar `useConversaDetail({ tenantId, id })` para dados da conversa.
- Usar `useConversaThread({ tenantId, id, page: 0, size: 50 })` para mensagens.
- Usar `useSSEConversasSync({ tenantId })` para sync.
- Mutations disponíveis: `useSendMessage`, `useUpdateConversaStatus`, `useAssignConversaOwner`, `useMoveConversaQueue`, `useReattribuirConversaUnidade`.
- **Layout:**
  - Topo: `ConversationHeader` com ações rápidas.
  - Centro: `MessageThread` com paginação "load more".
  - Base: `MessageInput` com envio de mensagens.
  - Side panel (colapsável): `ContactCard`.
- **Envio de mensagem:**
  - `MessageInput.onSend` → `sendMessage.mutate({ content, idempotencyKey })`.
  - Optimistic update: append bubble com estado "pending".
  - Se erro: toast + marcar bubble como falha com botão "Reenviar".
  - Se sucesso: React Query invalida thread → re-render com mensagem confirmada.
- **Mobile:** Side panel é um sheet/drawer que abre sobre o thread.
- **Botão voltar:** Em mobile, botão "← Voltar" que navega para `/atendimento/inbox`.
- **Loading:** Skeleton para thread + header.
- **Erro 404:** "Conversa não encontrada" com botão voltar.

**Test Strategy:**

Teste E2E completo: abrir conversa → ver thread → enviar mensagem → verificar que aparece → receber mensagem via SSE mock → verificar auto-scroll. Testar mudança de status → verificar toast + UI atualizada. Testar erro de envio → verificar feedback visual.
