# Task ID: 275

**Title:** Migrar CRM playbooks para TanStack Query

**Status:** done

**Dependencies:** 225 ✓

**Priority:** medium

**Description:** Playbooks e cadências usam useState para listagem e CRUD.

**Details:**

Criar useCrmPlaybooks() e useCrmCadencias() hooks. Mutations com invalidação.

**Test Strategy:**

CRUD funciona com cache. Criar/editar invalida lista.

## Subtasks

### 275.1. Definir Query Keys e Configurar Estrutura Inicial TanStack Query para CRM

**Status:** pending  
**Dependencies:** None  

Criar um arquivo centralizado para definir as Query Keys para playbooks e cadências do CRM. Garantir que o cliente TanStack Query está acessível e configurado para o staleTime de 2 minutos conforme especificado.

**Details:**

Criar o arquivo `src/features/crm/playbooks/query-keys.ts` com chaves como `['crm', 'playbooks']` e `['crm', 'cadencias']`. Verificar a configuração global do QueryClient em `src/lib/react-query.ts` ou similar, garantindo que `staleTime: 1000 * 60 * 2` esteja aplicado ou seja aplicável aos novos hooks.

### 275.2. Implementar Hooks `useCrmPlaybooks` e `useCrmCadencias` com Mutações CRUD

**Status:** pending  
**Dependencies:** 275.1  

Desenvolver os hooks `useCrmPlaybooks()` e `useCrmCadencias()` usando `useQuery` para buscar e listar os dados de playbooks e cadências. Adicionar hooks de mutação (`useMutation`) para operações de criação, edição e exclusão (CRUD) para ambos, incluindo a lógica de invalidação das query keys após cada mutação bem-sucedida para atualizar a lista.

**Details:**

Criar `src/features/crm/playbooks/hooks/useCrmPlaybooks.ts` e `useCrmCadencias.ts`. Implementar funções de fetch para `useQuery` para obter os dados. Para `useMutation`, incluir a propriedade `onSuccess` para chamar `queryClient.invalidateQueries({ queryKey: ['crm', 'playbooks'] })` e `queryClient.invalidateQueries({ queryKey: ['crm', 'cadencias'] })` conforme a mutação.

### 275.3. Refatorar `playbooks/page.tsx` para Utilizar os Novos Hooks TanStack Query

**Status:** pending  
**Dependencies:** 275.2  

Atualizar a página `playbooks/page.tsx` para substituir as implementações existentes baseadas em `useState` e `useEffect` para gerenciamento de dados pelas novas chamadas dos hooks `useCrmPlaybooks()` e `useCrmCadencias()`. Adaptar o código para consumir os estados de carregamento, erro e dados fornecidos pelo TanStack Query, mantendo a funcionalidade existente de CRUD com steps.

**Details:**

Remover `useState` e `useEffect` para gerenciamento de dados e carregamento em `playbooks/page.tsx`. Integrar os dados, estados `isLoading`, `isError` e funções de mutação (`mutate`) dos novos hooks. Garantir que a lógica de steps para CRUD e a interface do usuário respondam de forma consistente.

### 275.4. Exportar Hooks e Implementar Testes Abrangentes de Integração/E2E para CRUD

**Status:** pending  
**Dependencies:** 275.3  

Garantir que os hooks recém-criados sejam exportados corretamente para uso em outros módulos. Implementar ou estender testes de integração ou E2E que validem o fluxo completo de CRUD (criação, leitura, atualização, exclusão) para playbooks e cadências, verificando a interação com o cache do TanStack Query, incluindo a invalidação e o comportamento do `staleTime` de 2 minutos.

**Details:**

Adicionar ou verificar os `exports` em `src/features/crm/playbooks/hooks/index.ts` para os novos hooks. Criar ou atualizar cenários de teste E2E (com Cypress, Playwright ou similar) para `playbooks/page.tsx`, focando em: carregamento inicial (usando cache), criação de um item (lista atualiza), edição de um item (lista atualiza), exclusão de um item (lista atualiza).
