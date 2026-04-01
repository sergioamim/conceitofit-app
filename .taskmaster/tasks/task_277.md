# Task ID: 277

**Title:** Migrar prospects-kanban para TanStack Query

**Status:** done

**Dependencies:** 253 ✓

**Priority:** medium

**Description:** Kanban de prospects usa useState para dados de pipeline. Alta interatividade.

**Details:**

Reusar useProspects() existente. Adicionar mutations para drag-and-drop status change com optimistic updates.

**Test Strategy:**

Kanban carrega do cache de prospects. Mover card atualiza otimisticamente.

## Subtasks

### 277.1. Adaptar hook `useProspects` para TanStack Query

**Status:** pending  
**Dependencies:** None  

Modificar o hook `useProspects` existente para integrar-se com TanStack Query. Isso envolve encapsular a lógica de busca de dados atual em uma `queryFn` e configurar o `queryKey` e `staleTime` conforme especificado.

**Details:**

Criar um `queryKey` robusto para os prospects, possivelmente incluindo `tenantId` ou outros parâmetros relevantes (ex: `['prospects', tenantId]`). Envolver a função de busca de dados da API atual dentro de `queryFn` para o `useQuery`. Configurar `staleTime: 30 * 1000` para otimizar o cache.

### 277.2. Integrar dados de prospects no componente `ProspectsKanban`

**Status:** pending  
**Dependencies:** 277.1  

Substituir o gerenciamento de estado local (`useState`) para os dados do pipeline de prospects no componente `ProspectsKanban` pela utilização do novo hook `useProspects` adaptado para TanStack Query.

**Details:**

Remover todas as chamadas de `useState` relacionadas aos dados de prospects e pipelines. Chamar o `useProspects()` adaptado no componente `ProspectsKanban` e usar o objeto `data` retornado para popular as colunas do kanban. Implementar loaders visuais enquanto `isLoading` for true.

### 277.3. Implementar mutation de mudança de status com optimistic updates

**Status:** pending  
**Dependencies:** 277.1  

Desenvolver uma mutation usando `useMutation` do TanStack Query para atualizar o status de um prospect (movimento de drag-and-drop). Esta mutation deve incluir a lógica de optimistic updates para garantir uma experiência de usuário fluida e responsiva.

**Details:**

Definir a função de `mutationFn` que chamará a API para atualizar o status do prospect. Implementar a função `onMutate` para realizar a atualização otimista no cache do TanStack Query, movendo o prospect para a nova coluna antes da resposta da API. Configurar `onError` para reverter a mudança otimista e `onSettled` para invalidar a query de prospects, garantindo a consistência dos dados após a finalização da mutação.

### 277.4. Refatorar `KanbanContent` e testar drag-and-drop completo

**Status:** pending  
**Dependencies:** 277.2, 277.3  

Refatorar o componente `KanbanContent` e seus subcomponentes para integrar a mutation de mudança de status. Realizar testes abrangentes na funcionalidade de arrastar e soltar para garantir que os optimistic updates, a persistência e a exibição de dados funcionem corretamente.

**Details:**

Conectar os eventos de drag-and-drop dentro do `KanbanContent` (ou nos componentes de card/coluna) para chamar a função `mutate` da mutation de status. Realizar testes de ponta a ponta: arrastar cards entre todas as colunas possíveis, verificar a atualização otimista na UI e a persistência correta no backend. Garantir que a UI se mantém responsiva durante e após as operações.
