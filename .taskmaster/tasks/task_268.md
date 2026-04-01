# Task ID: 268

**Title:** Migrar CRM workspace (crm-content.tsx) para TanStack Query

**Status:** done

**Dependencies:** 225 ✓

**Priority:** high

**Description:** crm-content.tsx usa useState para prospects, tasks, automations e snapshot. Fetching manual via load() com Promise.all.

**Details:**

Criar useCrmWorkspace() hook com useQuery para o snapshot agregado. Mutations para toggleAutomation com invalidação. Remover useState de snapshot/automations/loading/error. O CadenceExecutionsPanel já carrega dados independentemente.

**Test Strategy:**

Workspace carrega com cache. Toggle automação invalida corretamente. Navegar e voltar não refaz fetch.

## Subtasks

### 268.1. Definir query keys para o CRM workspace

**Status:** pending  
**Dependencies:** None  

Criar e exportar as query keys necessárias para o CRM workspace no arquivo src/lib/query/keys.ts. Isso incluirá uma chave para o snapshot do workspace, e possivelmente chaves para entidades individuais se forem usadas diretamente (e.g., 'automations', 'prospects', 'tasks', 'employees').

**Details:**

Adicionar um objeto `crmKeys` em `src/lib/query/keys.ts` com, no mínimo, `crmKeys.all` e `crmKeys.snapshot()`. As chaves devem ser baseadas no tenant ID e permitir a invalidação precisa do snapshot.

### 268.2. Implementar hook useCrmWorkspace() para o snapshot agregado

**Status:** pending  
**Dependencies:** 268.1  

Desenvolver o custom hook `useCrmWorkspace()` em `src/lib/query/crm.ts` que utiliza `useQuery` do TanStack Query para buscar o snapshot agregado do CRM. Este hook deve encapsular a lógica de fetching de `listProspectsApi`, `listCrmTasksApi`, `listCrmAutomacoesApi`, `listFuncionariosApi` e a agregação `buildCrmWorkspaceSnapshotRuntime()`.

**Details:**

Criar `src/lib/query/crm.ts`. Definir a função `fetchCrmWorkspaceSnapshot` que chama `Promise.all` para as APIs existentes e então `buildCrmWorkspaceSnapshotRuntime`. O hook `useCrmWorkspace` deve usar `useQuery` com a chave `crmKeys.snapshot()`, `staleTime: 30 * 1000` (30 segundos) e `refetchOnWindowFocus: true`.

### 268.3. Criar mutation useToggleCrmAutomation() com invalidação

**Status:** pending  
**Dependencies:** 268.1, 268.2  

Desenvolver o custom hook `useToggleCrmAutomation()` em `src/lib/query/crm.ts` que utiliza `useMutation` do TanStack Query para alternar o status de uma automação via `updateCrmAutomacaoApi`. A mutação deve invalidar as query keys relevantes após o sucesso para garantir que o `useCrmWorkspace` refetch os dados atualizados.

**Details:**

No arquivo `src/lib/query/crm.ts`, criar o hook `useToggleCrmAutomation` que recebe o `queryClient` e chama `updateCrmAutomacaoApi`. Após o sucesso da mutação, usar `queryClient.invalidateQueries(crmKeys.snapshot())` para refetch do snapshot. Considerar `onMutate` para updates otimistas, se viável.

### 268.4. Refatorar crm-content.tsx para usar os hooks do TanStack Query

**Status:** pending  
**Dependencies:** 268.2, 268.3  

Atualizar o componente `crm-content.tsx` para consumir os dados do workspace através do hook `useCrmWorkspace()` e gerenciar as automações com `useToggleCrmAutomation()`. Remover as chamadas manuais `load()` e os estados `useState` de `snapshot`, `automations`, `loading` e `error`, substituindo-os pelos retornos dos hooks do TanStack Query. Manter qualquer estado de UI que não seja server state.

**Details:**

Em `crm-content.tsx`, importar `useCrmWorkspace` e `useToggleCrmAutomation`. Substituir o `useState` de dados do servidor (snapshot, automations, loading, error) pelas variáveis retornadas por `useCrmWorkspace` (e.g., `data`, `isLoading`, `isError`). Adaptar a função `toggleAutomation` para usar a nova mutation.

### 268.5. Exportar hooks no barrel index.ts e realizar testes de integração

**Status:** pending  
**Dependencies:** 268.1, 268.2, 268.3, 268.4  

Exportar os novos hooks `useCrmWorkspace` e `useToggleCrmAutomation` no arquivo barrel `src/lib/query/index.ts`. Realizar testes de integração abrangentes para validar o funcionamento do CRM workspace, garantindo que os dados são carregados, atualizados e armazenados em cache corretamente e que a página funciona de ponta a ponta.

**Details:**

Adicionar as exportações em `src/lib/query/index.ts`. Realizar testes manuais completos no ambiente de desenvolvimento, navegando para o CRM workspace, verificando o carregamento inicial, alternando automações, navegando para fora e retornando para observar o comportamento do cache e a invalidação. Validar que o `CadenceExecutionsPanel` não foi afetado e continua a carregar dados independentemente.
