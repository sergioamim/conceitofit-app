# Task ID: 218

**Title:** Adicionar request correlation (X-Request-Id) entre frontend e backend

**Status:** done

**Dependencies:** 217 ✓

**Priority:** medium

**Description:** Gerar UUID por request no http.ts, passar X-Request-Id header em todas as chamadas API, incluir request-id nos logs do Sentry e do logger.ts.

**Details:**

http.ts já usa crypto.randomUUID() para context-id. Criar X-Request-Id separado por chamada API. Passar no header de cada apiRequest(). Incluir no Sentry breadcrumb e no logger.warn/error. Permitir correlação frontend↔backend pelo mesmo request-id.

**Test Strategy:**

Requests ao backend incluem X-Request-Id header. Erros no Sentry mostram request-id. Logger inclui request-id.
