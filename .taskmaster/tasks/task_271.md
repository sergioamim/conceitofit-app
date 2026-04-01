# Task ID: 271

**Title:** Migrar contas-a-receber para TanStack Query

**Status:** done

**Dependencies:** 225 ✓

**Priority:** high

**Description:** contas-a-receber-content.tsx usa useState para contas, formas pagamento. Domínio financeiro de alta frequência.

**Details:**

Criar useContasReceber() hook. Mutations para receber/cancelar. Invalida cache no onSuccess.

**Test Strategy:**

Listagem com cache. Receber conta invalida. Filtros preservados.

## Subtasks

### 271.1. Definir chaves de consulta e estrutura inicial para useContasReceber

**Status:** pending  
**Dependencies:** None  

Criar um arquivo de query-keys para contas a receber e rascunhar a estrutura inicial do hook useContasReceber com suas funções de fetch.

**Details:**

Criar src/hooks/useContasReceber.ts e src/query-keys/contasReceberKeys.ts. Definir a chave base ["contasReceber"] e chaves específicas para listagem de contas e formas de pagamento. Incluir as chamadas de fetch iniciais para os dados dentro do hook useContasReceber usando TanStack Query.

### 271.2. Implementar queries e mutations em useContasReceber

**Status:** pending  
**Dependencies:** 271.1  

Desenvolver as queries para buscar contas a receber e formas de pagamento, e as mutations para 'receber' e 'cancelar recebimento' de contas, incluindo a invalidação de cache.

**Details:**

No arquivo useContasReceber.ts, implementar useQuery para buscar a lista de contas a receber e formas de pagamento, configurando staleTime para 30 segundos. Implementar useMutation para as ações de 'receberConta' e 'cancelarRecebimento', assegurando que queryClient.invalidateQueries(contasReceberKeys.lists()) seja invocado no onSuccess de ambas as mutations para garantir a atualização da lista.

### 271.3. Refatorar contas-a-receber-content.tsx para usar o hook

**Status:** pending  
**Dependencies:** 271.2  

Substituir o gerenciamento de estado local (useState) e as chamadas diretas à API em contas-a-receber-content.tsx pelo novo hook useContasReceber.

**Details:**

Modificar o componente contas-a-receber-content.tsx para consumir os dados de contas e formas de pagamento fornecidos pelo hook useContasReceber. Adaptar a interface do usuário para gerenciar os estados de carregamento e erro do TanStack Query e integrar as funções de mutação aos botões 'receber' e 'cancelar'.

### 271.4. Exportar hook e realizar testes de integração e validação

**Status:** pending  
**Dependencies:** 271.3  

Garantir que o hook useContasReceber esteja devidamente exportado para uso global no projeto e realizar testes completos para validar a migração e as interações no ambiente de teste.

**Details:**

Adicionar o useContasReceber ao arquivo de exportação de hooks principais, se a arquitetura exigir. Executar testes manuais e automatizados abrangendo a listagem com cache (staleTime), recebimento de conta com invalidação e atualização da UI, cancelamento de recebimento, e verificar se os filtros aplicados anteriormente persistem corretamente após as operações. Validar o comportamento geral da página.
