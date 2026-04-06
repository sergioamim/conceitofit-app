# Task ID: 472

**Title:** Implementar correlation ID para tracing frontend → backend

**Status:** pending

**Dependencies:** None

**Priority:** high

**Description:** Adicionar X-Correlation-Id em todos os requests HTTP para tracing distribuído entre frontend e backend Java.

**Details:**

Implementar: (1) Gerar UUID v4 por request no http.ts interceptor, (2) Adicionar header X-Correlation-Id em todos os fetch para /backend/*, (3) Incluir correlationId no contexto do Sentry para cada error, (4) Log correlationId no console em dev mode, (5) Backend Java deve propagar correlationId nos logs e responses. Usar crypto.randomUUID() apenas em handlers/effects (não em SSR render).

**Test Strategy:**

Teste unitário do interceptor http.ts verificando header X-Correlation-Id. Teste E2E: correlationId é único por request e aparece nos logs do Sentry.
