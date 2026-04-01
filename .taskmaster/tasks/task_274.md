# Task ID: 274

**Title:** Migrar CRM tarefas (tarefas/page.tsx) para TanStack Query

**Status:** done

**Dependencies:** 225 ✓

**Priority:** medium

**Description:** Tarefas CRM usa useState para tasks, funcionarios, prospects. CRUD manual.

**Details:**

Criar useCrmTasks() hook com useQuery + mutations para criar/atualizar. Invalidar cache em mutations.

**Test Strategy:**

Listagem com cache. Criar/concluir tarefa invalida. Filtros funcionam.

## Subtasks

### 274.1. Definir Query Keys para Tarefas, Funcionários e Prospects do CRM

**Status:** done  
**Dependencies:** None  

Criar e padronizar as chaves de query (query keys) para as listas de tarefas, funcionários e prospects usadas no módulo de CRM. Este passo é fundamental para o correto gerenciamento do cache do TanStack Query.

**Details:**

Analisar a estrutura de dados existente e definir query keys como `['crmTasks', { tenantId, filters }]`, `['crmEmployees', { tenantId }]` e `['crmProspects', { tenantId }]`. Assegurar que quaisquer IDs de tenant ou parâmetros de filtro relevantes sejam incorporados nas chaves para garantir o isolamento e a granularidade adequada do cache.

### 274.2. Implementar Hook `useCrmTasks` com Queries e Mutations

**Status:** done  
**Dependencies:** 274.1  

Desenvolver o hook personalizado `useCrmTasks` que encapsulará a lógica de obtenção de dados para tarefas, funcionários e prospects usando `useQuery`, e a lógica de modificação (criação, atualização e conclusão de tarefas) usando `useMutation` do TanStack Query.

**Details:**

Criar o arquivo `src/hooks/useCrmTasks.ts`. Dentro do hook, implementar `useQuery` para buscar tarefas (com filtros), funcionários e prospects, configurando um `staleTime` de 30 segundos (30000 ms) para otimizar o desempenho. Implementar `useMutation` para `createTask`, `updateTask` e `completeTask`. Garantir que as funções `onSuccess` de cada mutação invalidem as query keys relevantes (ex: `queryClient.invalidateQueries(['crmTasks'])`) para forçar a revalidação e atualização da interface do usuário.

### 274.3. Refatorar `tarefas/page.tsx` para Consumir `useCrmTasks`

**Status:** done  
**Dependencies:** 274.2  

Substituir a gestão de estado local baseada em `useState` e as chamadas diretas à API na página `tarefas/page.tsx` pela utilização do recém-criado hook `useCrmTasks` do TanStack Query. Isso padronizará e simplificará a gestão de dados na página.

**Details:**

Modificar o componente `tarefas/page.tsx` para importar e consumir os dados e funções de mutação do `useCrmTasks`. Remover todas as instâncias de `useState` e chamadas `fetch` manuais relacionadas a tarefas, funcionários e prospects. Adaptar a renderização da lista, os formulários de criação/edição e os botões de ação para interagir com as funções e estados fornecidos pelo hook. Validar que a lógica de filtragem existente e a exibição de dados persistem corretamente.

### 274.4. Implementar Testes de End-to-End e Otimizações de Cache Finais

**Status:** done  
**Dependencies:** 274.3  

Desenvolver ou atualizar testes de end-to-end para a página de tarefas do CRM, garantindo que a migração para TanStack Query manteve a funcionalidade e melhorou a experiência do usuário, além de realizar otimizações no comportamento do cache.

**Details:**

Criar novos testes E2E ou estender os existentes para a rota `/tarefas` utilizando a estrutura de testes do projeto (ex: Playwright/Cypress). Cobrir cenários como: carregamento inicial da página (verificar uso do cache e `staleTime`), criação de uma nova tarefa (verificar atualização da lista), conclusão de uma tarefa (verificar atualização e invalidacão), e aplicação de diferentes filtros. Revisar e ajustar `staleTime`, `gcTime` e outras configurações do TanStack Query para garantir o desempenho ideal e a consistência dos dados.
