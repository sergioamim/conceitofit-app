# Task ID: 495

**Title:** Utilitário de idempotência para envio de mensagens

**Status:** pending

**Dependencies:** None

**Priority:** high

**Description:** Criar `src/lib/utils/idempotency.ts` com geração de `X-Idempotency-Key` e store de deduplicação no frontend para prevenir envio duplicado de mensagens.

**Details:**

Criar `src/lib/utils/idempotency.ts` exportando:

- `generateIdempotencyKey(): string` — usa `crypto.randomUUID()`.
- `IdempotencyKeyStore` — classe singleton com:
  - `acquireKey(operationId: string): string` — retorna key existente se operationId já tem key (dentro de 30s), senão gera nova.
  - `releaseKey(operationId: string)` — libera key após confirmação de sucesso.
  - `cleanup()` — remove keys expiradas (> 30s).
- Persistência em `sessionStorage` para sobreviver a refresh de página:
  - Chave: `idempotency_keys_atendimento`
  - Formato: `{ [operationId]: { key, createdAt } }`
  - TTL: 30 segundos

Uso no `MessageInput`: ao iniciar envio, `acquireKey(conversationId)`. Se o usuário clicar "Enviar" duas vezes rápido, a mesma key será reusada. Após sucesso do mutation, `releaseKey(conversationId)`.

**Test Strategy:**

Testes unitários: gerar keys e verificar unicidade. Testar que `acquireKey` retorna mesma key para mesmo operationId dentro de 30s. Testar expiração após 30s. Testar persistência via sessionStorage mock.
