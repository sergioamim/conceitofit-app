# Task ID: 217

**Title:** Integrar Sentry no frontend para error tracking

**Status:** done

**Dependencies:** None

**Priority:** high

**Description:** Instalar @sentry/nextjs, configurar client/server configs, adicionar captureException nos pontos de erro (http.ts, api-error.ts, create-tenant-loader.tsx), configurar source maps e tags de contexto (tenantId, userId, route).

**Details:**

Instalar @sentry/nextjs. Criar sentry.client.config.ts e sentry.server.config.ts. Configurar instrumentation.ts para inicializar Sentry no server. Adicionar Sentry.captureException em: http.ts (API errors), api-error.ts (normalized errors), create-tenant-loader.tsx (SSR errors). Upload de source maps no build. Tags: tenantId, userId, networkId, route. Variáveis: NEXT_PUBLIC_SENTRY_DSN, SENTRY_AUTH_TOKEN. Configurar alertas por email para erros novos.

**Test Strategy:**

Erros de API e rendering aparecem no dashboard Sentry com contexto de tenant. Verificar em dev que erros são capturados.
