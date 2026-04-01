# Task ID: 251

**Title:** Migrar dashboard para TanStack Query

**Status:** done

**Dependencies:** 225 ✓

**Priority:** high

**Description:** Dashboard usa useState+useEffect para fetching. Migrar para useQuery com cache, staleTime e invalidação automática.

**Details:**

Criar hook useDashboard() com useQuery. Query key: ["dashboard", tenantId, referenceDate]. Remover useState de dados, loading, error. Manter filtros como estado local. O hook useDashboard já existe em lib/query/use-dashboard.ts mas pode não estar sendo usado na página.

**Test Strategy:**

Dashboard carrega com cache. Navegar para outra página e voltar não refaz fetch. Refresh manual funciona.
