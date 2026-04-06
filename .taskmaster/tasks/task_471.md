# Task ID: 471

**Title:** Tornar Sentry DSN obrigatório em produção com health check

**Status:** pending

**Dependencies:** None

**Priority:** high

**Description:** Garantir que Sentry é obrigatório em produção, bloqueando boot sem DSN. Criar endpoint /api/health para health check do container.

**Details:**

Atualmente Sentry é condicional (se NEXT_PUBLIC_SENTRY_DSN não existe, Sentry é desativado silenciosamente). Implementar: (1) Se NODE_ENV=production e sem SENTRY_DSN, logar error crítico e/ou permitir boot com warning severo. (2) Criar endpoint /api/health que retorna: status do Sentry (configurado/não), status do backend (conectado/não), uptime, version. (3) Adicionar contexto ao Sentry: tenantId, userKind, page, API latency. (4) Configurar alertas no Sentry para erros críticos.

**Test Strategy:**

Teste unitário do endpoint /api/health. Teste de integração: app em prod sem DSN loga warning. Teste E2E: erro simulado é capturado pelo Sentry.
