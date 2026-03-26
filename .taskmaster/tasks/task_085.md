# Task ID: 85

**Title:** Implementar favoritos e acessos recentes na navegação

**Status:** done

**Dependencies:** 84 ✓

**Priority:** high

**Description:** Adicionar favoritos e seção de vistos recentemente para reduzir carga cognitiva na navegação principal e personalizar o fluxo de cada usuário.

**Details:**

Criar affordance de favoritar páginas na sidebar e/ou cabeçalho, manter seção de itens favoritos no topo da navegação e registrar os últimos links visitados com persistência local. A implementação inicial deve usar storage local compatível com SSR seguro, deixando a modelagem preparada para futura persistência cross-device no backend sem acoplar a UI a valores instáveis no render inicial.

**Test Strategy:**

Cobrir com testes unitários e E2E o toggle de favoritos, persistência em storage após mount, exibição de recentes limitada aos últimos cinco itens e restauração correta da navegação ao recarregar a aplicação.
