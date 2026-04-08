# Task ID: 489

**Title:** Adicionar rotas de atendimento ao contexto scropado do HTTP client

**Status:** done

**Dependencies:** 487, 488

**Priority:** high

**Description:** Adicionar `/api/v1/conversas/*` e `/api/v1/whatsapp/credentials/*` ao array `CONTEXT_SCOPED_OPERATIONAL_PATTERNS` em `src/lib/api/http.ts` para que o header `X-Context-Id` (tenantId ativo) seja injetado automaticamente nessas rotas.

**Details:**

Em `src/lib/api/http.ts`, localizar o array `CONTEXT_SCOPED_OPERATIONAL_PATTERNS` e adicionar:
```ts
/^\/api\/v1\/conversas(?:\/|$)/,
/^\/api\/v1\/whatsapp\/credentials(?:\/|$)/,
```

Isso garante que qualquer chamada via `apiRequest` para essas rotas terá o `X-Context-Id` injetado automaticamente com base no tenant ativo da sessão, sem precisar passar tenantId manualmente como query param (embora o backend ainda exija o query param — o header complementa para auditoria e validação de contexto).

**Test Strategy:**

Verificar que uma chamada `apiRequest({ path: '/api/v1/conversas', ... })` resulta num fetch com header `X-Context-Id` presente. Teste manual com DevTools Network tab.
