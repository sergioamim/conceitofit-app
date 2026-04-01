# Task ID: 229

**Title:** Migrar /matriculas para TanStack Query

**Status:** done

**Dependencies:** 225 ✓

**Priority:** medium

**Description:** Criar useMatriculas() hook. Substituir retry manual de tenant context por query retry config.

**Details:**

Hook com retry function que detecta tenant context error via isTenantContextError(). Query key: ["matriculas", tenantId, monthKey, page]. Mutations para renovar/cancelar.

**Test Strategy:**

Retry de context error funciona via TanStack Query. Renovação/cancelamento invalida cache.
