# Task ID: 491

**Title:** React Query hooks para Conversas (Atendimento)

**Status:** done

**Dependencies:** 487, 489, 490

**Priority:** high

**Description:** Criar `src/lib/query/use-conversas.ts` com hooks de query e mutation para todas as operações de conversas, mensagens e tarefas.

**Details:**

Criar `src/lib/query/use-conversas.ts` exportando:

**Queries:**
- `useConversas({ tenantId, filters, page, size, enabled })` — `useQuery<ConversaPageResponse>`, `staleTime: 0`, `refetchInterval: 15_000` (fallback polling SSE), `enabled` baseado em tenantId e tenantResolved.
- `useConversaDetail({ tenantId, id, enabled })` — `useQuery<ConversaResponse>`, `staleTime: 10_000`.
- `useConversaThread({ tenantId, id, page, size, enabled })` — `useQuery<MensagemPageResponse>`, `staleTime: 0`, `refetchInterval: 10_000`.

**Mutations (com invalidation):**
- `useSendMessage()` — mutation `sendMessageApi`. On success: invalidar `conversas.detail`, `conversas.thread`, `conversas.list`. Aceitar `idempotencyKey` nos headers.
- `useUpdateConversaStatus()` — mutation `updateConversaStatusApi`. On success: invalidar `conversas.detail`, `conversas.list`.
- `useAssignConversaOwner()` — mutation `assignConversaOwnerApi`. On success: invalidar `conversas.detail`, `conversas.list`.
- `useMoveConversaQueue()` — mutation `moveConversaQueueApi`. On success: invalidar `conversas.detail`, `conversas.list`.
- `useReattribuirConversaUnidade()` — mutation `reattribuirConversaUnidadeApi`. On success: invalidar `conversas.detail`, `conversas.list`.
- `useCreateConversaTask()` — mutation `createConversaTaskApi`. On success: invalidar `conversas.detail`.
- `useCreateConversa()` — mutation `createConversaApi`. On success: invalidar `conversas.list`.

Seguir padrões de `src/lib/query/use-prospects.ts` e `src/lib/query/use-whatsapp.ts` para estrutura de hooks.

**Test Strategy:**

Testes unitários com `@testing-library/react` mockando `queryClient`. Verificar que mutations chamam `invalidateQueries` com keys corretas após `onSuccess`. Verificar que queries são desabilitadas quando `tenantId` é undefined.
