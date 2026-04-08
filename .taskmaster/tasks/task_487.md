# Task ID: 487

**Title:** API client TypeScript para Conversas (Atendimento)

**Status:** done

**Dependencies:** 486

**Priority:** high

**Description:** Criar `src/lib/api/conversas.ts` com todas as funções de chamada à API de conversas, mensagens, status, owner, fila, unidade e tarefas, usando o wrapper `apiRequest` existente e os tipos da Task 486.

**Details:**

Criar `src/lib/api/conversas.ts` exportando:
- `listConversasApi({ tenantId, filters, page, size })` → `ConversaPageResponse` — GET `/api/v1/conversas` com query params: tenantId, unidadeId, status, queue, ownerUserId, periodoInicio, periodoFim, busca, page, size.
- `getConversaDetailApi({ tenantId, id })` → `ConversaResponse` — GET `/api/v1/conversas/{id}`.
- `createConversaApi({ tenantId, data })` → `ConversaResponse` — POST `/api/v1/conversas`.
- `updateConversaStatusApi({ tenantId, id, status })` → `ConversaResponse` — PATCH `/api/v1/conversas/{id}` com body `{ status }`.
- `assignConversaOwnerApi({ tenantId, id, ownerUserId })` → `ConversaResponse` — PATCH `/api/v1/conversas/{id}/owner?ownerUserId=X`.
- `moveConversaQueueApi({ tenantId, id, queue })` → `ConversaResponse` — PATCH `/api/v1/conversas/{id}/queue?queue=X`.
- `reattribuirConversaUnidadeApi({ tenantId, id, unidadeId })` → `ConversaResponse` — PATCH `/api/v1/conversas/{id}/unidade?unidadeId=X`.
- `getConversaThreadApi({ tenantId, id, page, size })` → `MensagemPageResponse` — GET `/api/v1/conversas/{id}/thread`.
- `sendMessageApi({ tenantId, conversationId, content, contentType?, mediaUrl?, templateName?, templateVariables?, idempotencyKey })` → `MensagemResponse` — POST `/api/v1/conversas/{id}/mensagens` com header `X-Idempotency-Key`.
- `createConversaTaskApi({ tenantId, conversationId, data })` → void — POST `/api/v1/conversas/{id}/tarefas`.

Todas as funções usam `apiRequest` de `./http`. O `tenantId` é passado como query param em todas as chamadas.

**Test Strategy:**

Testes unitários mockando `apiRequest` para cada função, verificando que path, method, query params e body estão corretos. Testar especificamente que `sendMessageApi` injeta o header `X-Idempotency-Key`.
