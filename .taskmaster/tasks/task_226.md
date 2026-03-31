# Task ID: 226

**Title:** Migrar /clientes para TanStack Query

**Status:** pending

**Dependencies:** 225

**Priority:** medium

**Description:** Substituir os 12 useState em clientes-client.tsx por useQuery/useMutation. Criar useClientes() hook.

**Details:**

Criar src/lib/tenant/hooks/use-clientes-query.ts com useQuery para listagem e useMutation para operações. Manter service layer (listAlunosPageService, updateAlunoService) como fetcher functions. Invalidar cache em mutations. Query key: ["clientes", tenantId, filtro, page, pageSize].

**Test Strategy:**

Listagem funciona com cache. Navegar e voltar não refetch. Mutations invalidam corretamente.
