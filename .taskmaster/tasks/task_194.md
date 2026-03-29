# Task ID: 194

**Title:** Expandir testes unitários de componentes (meta: 50% cobertura)

**Status:** done

**Dependencies:** []

**Priority:** low

**Description:** 104 arquivos de teste existem mas cobertura de componentes React ainda é baixa. Ampliar para componentes críticos.

**Details:**

Criar testes para:
1) ClienteHeader — renderiza dados, ações, status suspenso.
2) ClienteTabs — navegação entre tabs, indicadores.
3) Sidebar — itens de navegação, collapse, mobile.
4) AppTopbar — branding, tenant selector.
5) CommandPalette — busca, navegação.
6) PaginatedTable — paginação, empty state.
7) CrudModal — open/close, form submit.

Cada componente 3-5 cenários. Meta: cobertura > 50%.

**Subtasks:**

- [x] Criar testes para ClienteHeader
- [x] Criar testes para ClienteTabs
- [x] Criar testes para Sidebar
- [x] Criar testes para AppTopbar
- [x] Criar testes para CommandPalette
- [x] Criar testes para PaginatedTable
- [x] Criar testes para CrudModal

**Test Strategy:**

npx vitest run passa. Coverage report mostra > 50% de componentes cobertos.
