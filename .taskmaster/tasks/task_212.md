# Task ID: 212

**Title:** Avaliar e implementar TanStack Query para data fetching

**Status:** done

**Dependencies:** None

**Priority:** medium

**Description:** O projeto faz fetching manual com useState+useEffect+useCallback em todas as páginas client. Sem cache, deduplicação, revalidação automática ou prefetching.

**Details:**

Avaliar TanStack Query (React Query) vs SWR para o projeto. Critérios: compatibilidade com Next.js 16, suporte a mutations, devtools, tamanho do bundle. Implementar em 2-3 páginas piloto (dashboard, clientes, pagamentos) para validar o padrão. Criar custom hooks por domínio: useClientes(), usePagamentos(), useDashboard(). Manter service layer existente como fetcher functions. Benefícios esperados: cache automático, loading states grátis, retry automático, deduplicação de requests.

**Test Strategy:**

Páginas piloto funcionam com React Query. Cache funciona (navegar e voltar não refetch). Loading/error states funcionam.
