# Task ID: 120

**Title:** Implementar Global Search com Command Palette (cmdk)

**Status:** done

**Dependencies:** None

**Priority:** medium

**Description:** Criar um command palette global (Cmd+K / Ctrl+K) usando a dependência cmdk já instalada, permitindo busca rápida por clientes, prospects, vendas, planos e navegação por páginas do sistema.

**Details:**

Criar src/components/shared/command-palette.tsx usando cmdk (Command, CommandInput, CommandList, CommandGroup, CommandItem). Registrar listener Cmd+K/Ctrl+K no layout principal. Implementar busca em paralelo nas APIs existentes (listAlunosService por nome/CPF, listProspectsApi, listVendasPageService, listPlanosService) com debounce de 300ms e limite de 5 resultados por grupo. Incluir busca estática nas rotas de nav-items.ts como fallback sempre disponível. Ao selecionar um item, navegar via router.push(). Adicionar botão de busca na sidebar/header com hint "Cmd+K". Integrar no src/app/(app)/layout.tsx para disponibilidade em todas as páginas.

**Test Strategy:**

Pressionar Cmd+K em qualquer página e verificar que o modal abre. Digitar nome de cliente existente e confirmar resultados agrupados. Selecionar resultado e confirmar navegação. Testar busca por nome de página (ex: "planos") e confirmar que aparece nos resultados estáticos. Verificar fechamento com Escape.

## Subtasks

### 120.1. Criar componente CommandPalette com cmdk

**Status:** done  
**Dependencies:** None  

Criar src/components/shared/command-palette.tsx usando cmdk (Command, CommandInput, CommandList, CommandGroup, CommandItem). Registrar listener Cmd+K/Ctrl+K. Escape para fechar.

### 120.2. Implementar busca por entidades via API

**Status:** done  
**Dependencies:** 120.1  

Adicionar busca em paralelo nas APIs (alunos, prospects, vendas, planos) com debounce 300ms e limite 5 por grupo. Incluir busca estática nas rotas de nav-items.ts como fallback.

### 120.3. Integrar no layout e adicionar trigger na sidebar

**Status:** done  
**Dependencies:** 120.2  

Montar CommandPalette no src/app/(app)/layout.tsx. Adicionar botão com hint Cmd+K na sidebar. Navegar via router.push() ao selecionar.
