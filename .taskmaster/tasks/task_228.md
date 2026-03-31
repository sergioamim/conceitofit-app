# Task ID: 228

**Title:** Migrar /dashboard para TanStack Query

**Status:** pending

**Dependencies:** 225

**Priority:** medium

**Description:** Criar useDashboard() hook. Configurar refetch interval 60s para KPIs atualizados.

**Details:**

Hook com refetchInterval: 60000 para auto-refresh. Query key: ["dashboard", tenantId, date]. Combinar com dados SSR via initialData do createTenantLoader.

**Test Strategy:**

Dashboard com auto-refresh sem flicker. Cache funciona em navegação.
