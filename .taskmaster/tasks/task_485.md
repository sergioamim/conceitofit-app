# Task ID: 485

**Title:** Otimizar TanStack Query: staleTime, gcTime e prefetch em páginas críticas

**Status:** pending

**Dependencies:** None

**Priority:** medium

**Description:** Configurar caching策略 do TanStack Query em páginas de alto tráfego para reduzir refetch desnecessário.

**Details:**

Configurar em páginas críticas: (1) Dashboard: staleTime=30s, gcTime=5min, (2) Lista de clientes: staleTime=60s, gcTime=10min, (3) Lista de pagamentos: staleTime=30s, (4) CRM Prospects: staleTime=15s (dados mudam rápido), (5) Grade de aulas: staleTime=5min, (6) Portal do aluno: staleTime=60s para treinos/aulas. Implementar prefetch para navegação provável (ex: ao listar clientes, prefetch dados do primeiro cliente). Configurar background refetch com staleTime.

**Test Strategy:**

Teste: navegar entre páginas e verificar no Network tab que requests são cacheados quando apropriado. Métrica de redução de API calls. Teste E2E de dados stale sendo refetchados em background.
