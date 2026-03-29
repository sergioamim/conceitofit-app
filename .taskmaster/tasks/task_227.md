# Task ID: 227

**Title:** Migrar /pagamentos para TanStack Query

**Status:** pending

**Dependencies:** 225

**Priority:** medium

**Description:** Criar usePagamentos() hook com useQuery. Substituir loading/error manual por query states.

**Details:**

Criar hook em src/lib/tenant/hooks/. Query key: ["pagamentos", tenantId, mes, status]. Refetch on mutation (receber pagamento). Usar select para transformações.

**Test Strategy:**

Mesma funcionalidade com cache e retry automático. Receber pagamento atualiza lista.
