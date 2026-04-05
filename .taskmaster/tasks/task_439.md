# Task ID: 439

**Title:** Migrar tabela de Compliance para PaginatedTable

**Status:** done

**Dependencies:** 432 ✓

**Priority:** medium

**Description:** Substituir tabela HTML raw em /admin/seguranca/compliance por PaginatedTable com filtros padronizados.

**Details:**

Em src/app/(backoffice)/admin/seguranca/compliance/page.tsx, substituir <table> manual por PaginatedTable. Definir colunas: regra (texto), categoria (badge), status (StatusBadge), última verificação (data formatada), ações (DataTableRowActions). Adicionar TableFilters com filtro por status (Select com valores fixos) e busca textual. Implementar paginação server-side via API existente.

**Test Strategy:**

Teste manual: abrir /admin/seguranca/compliance, verificar PaginatedTable renderiza com colunas corretas, filtros funcionam, paginação funciona, ações de row funcionam.
