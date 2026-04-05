# Task ID: 445

**Title:** Migrar tabela de Saúde Operacional para PaginatedTable

**Status:** done

**Dependencies:** 432 ✓

**Priority:** low

**Description:** Substituir tabelas de detalhamento em /admin/operacional/saude por PaginatedTable, mantendo cards de status.

**Details:**

Em src/app/(backoffice)/admin/operacional/saude/page.tsx, manter cards de status/resumo no topo. Substituir tabelas de detalhamento (métricas por academia) por PaginatedTable. Colunas: academia (texto), score de saúde (número com cor condicional), alunos ativos, taxa de churn (%), última sincronização (data relativa), ações. Adicionar TableFilters com busca textual e filtro por range de score.

**Test Strategy:**

Teste manual: abrir /admin/operacional/saude, verificar cards no topo, PaginatedTable abaixo com métricas por academia, filtros funcionam.
