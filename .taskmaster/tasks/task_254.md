# Task ID: 254

**Title:** Migrar /matriculas para TanStack Query

**Status:** done

**Dependencies:** 225 ✓

**Priority:** medium

**Description:** Matrículas usa useState para server state. Migrar para useQuery com cache.

**Details:**

Criar useMatriculas() hook. Query key: ["matriculas", tenantId, filters]. Mutations para cancelar/renovar matrícula.

**Test Strategy:**

Listagem com cache. Cancelar matrícula invalida cache automaticamente.
