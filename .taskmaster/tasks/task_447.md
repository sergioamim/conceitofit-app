# Task ID: 447

**Title:** Melhorar command palette com indexação completa de rotas do backoffice

**Status:** done

**Dependencies:** None

**Priority:** low

**Description:** Indexar todas as rotas /admin/* na command palette com títulos, ícones, tags de busca e seção de ações rápidas.

**Details:**

A command palette (Cmd+K) já existe mas pode não cobrir todas as rotas. Garantir que cada página do /admin/* tenha entrada com: título legível em pt-BR, ícone consistente com sidebar, tags de busca (sinônimos — ex: "cobrança", "billing", "fatura" apontam para mesma rota). Adicionar seção "Ações rápidas" no topo: criar academia, novo lead, gerar cobrança, etc. (executam navegação para a página com modal aberto ou ação direta). Adicionar seção "Acessos recentes" — persistir em localStorage, ler após mount. Ordenar resultados: recentes primeiro, depois por relevância de busca.

**Test Strategy:**

Teste manual: abrir Cmd+K, buscar por sinônimos ("fatura" → cobranças), verificar ações rápidas, verificar recentes após navegar por algumas páginas.
