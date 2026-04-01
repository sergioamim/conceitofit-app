# Task ID: 252

**Title:** Migrar /pagamentos para TanStack Query

**Status:** done

**Dependencies:** 225 ✓

**Priority:** high

**Description:** Página de pagamentos usa useState para server state. Migrar para useQuery/useMutation com cache e invalidação.

**Details:**

Criar/atualizar usePagamentos() hook. Substituir useState de dados por useQuery. Mutations (receber pagamento) via useMutation com invalidação de cache. O hook usePagamentos já existe em lib/query/use-pagamentos.ts.

**Test Strategy:**

Listagem funciona com cache. Receber pagamento invalida cache. Navegar e voltar não refetch.
