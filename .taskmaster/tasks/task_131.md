# Task ID: 131

**Title:** Backoffice: busca global cross-tenant de pessoas

**Status:** done

**Dependencies:** None

**Priority:** medium

**Description:** Criar busca global em /admin/busca que permita encontrar qualquer pessoa (aluno, funcionário, admin) em qualquer academia/unidade por nome, CPF ou email, com link direto para o detalhe no contexto correto.

**Details:**

Criar src/app/(backoffice)/admin/busca/page.tsx com input de busca central (debounce 300ms), resultados agrupados por tipo (Alunos, Funcionários, Admins) e por academia/unidade. Cada resultado mostra: nome, CPF/email, academia, unidade, status. Ao clicar, navega para /clientes/[id] ou /admin/seguranca/usuarios/[id] com o tenant correto. Criar endpoint searchGlobalPessoas em src/lib/api/admin-search.ts que aceita query + tipo + page. Adicionar tipo GlobalSearchResult em types.ts. Reutilizar SuggestionInput ou criar variante dedicada para busca full-page.

**Test Strategy:**

Buscar por CPF de aluno e confirmar que aparece com academia/unidade corretos. Buscar por nome parcial e verificar agrupamento.

## Subtasks

### 131.1. Criar tipo e API client para busca global

**Status:** done  
**Dependencies:** None  

GlobalSearchResult em types.ts e searchGlobalPessoas em admin-search.ts

### 131.2. Criar página de busca com resultados agrupados

**Status:** done  
**Dependencies:** 131.1  

Input central, resultados por tipo e academia, links para detalhe no contexto correto
