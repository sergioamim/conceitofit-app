# Task ID: 208

**Title:** Refactor: Centralizar constantes de filtro e status (TODOS, ATIVO, INATIVO)

**Status:** pending

**Dependencies:** None

**Priority:** medium

**Description:** Strings como "TODOS", "ATIVO", "INATIVO" estão hardcoded em 200+ locais. Criar constantes centralizadas.

**Details:**

Criar src/lib/shared/constants/filters.ts com: export const FILTER_ALL = "TODOS" as const; export const STATUS_VALUES = { ATIVO: "ATIVO", INATIVO: "INATIVO", ... } as const; Substituir gradualmente as strings hardcoded pelos imports. Começar pelos arquivos mais usados: use-table-search-params.ts, páginas de listagem, modais de filtro.

**Test Strategy:**

Filtros funcionam identicamente. Sem strings "TODOS" hardcoded nos arquivos migrados.
