# Task ID: 262

**Title:** Aumentar cobertura de testes de componentes para 30%

**Status:** done

**Dependencies:** 258 ✓

**Priority:** medium

**Description:** Apenas 19 testes para 133 componentes (14%). Priorizar formulários e modais críticos.

**Details:**

Criar testes para: prospect-modal, receber-pagamento-modal, nova-matricula-modal, cliente-resumo-dialog, clientes-filter-bar, clientes-table, pagamentos-client, matriculas-client, status-badge, export-menu. Usar padrão existente: vi.mock para Dialog/Select, render + fireEvent + expect.

**Test Strategy:**

Cobertura de componentes sobe de 14% para 30%. CI não regride.

## Subtasks

### 262.1. Criar testes para StatusBadge e ExportMenu

**Status:** pending  
**Dependencies:** None  

Desenvolver testes de unidade e integração para os componentes StatusBadge e ExportMenu, garantindo a cobertura de renderização e interações básicas. Estes são componentes menores e independentes.

**Details:**

Criar arquivos de teste `StatusBadge.test.tsx` e `ExportMenu.test.tsx` na pasta `__tests__` ou `tests/` co-localizada. Utilizar `render` do `@testing-library/react`, simular eventos com `fireEvent` e validar o comportamento com `expect`. Para componentes que usam Radix, aplicar `vi.mock` conforme o padrão existente.

### 262.2. Criar testes para ClientesFilterBar e ClientesTable

**Status:** pending  
**Dependencies:** None  

Desenvolver testes para os componentes ClientesFilterBar e ClientesTable, cobrindo filtragem, renderização de dados, paginação e interações com a tabela de clientes.

**Details:**

Criar `ClientesFilterBar.test.tsx` e `ClientesTable.test.tsx`. Focar em testar a funcionalidade de busca e filtragem na barra, e a renderização correta dos clientes na tabela, incluindo paginação se aplicável. Utilizar `vi.mock` para dependências como `Dialog` ou `Select` do Radix, conforme o padrão existente.

### 262.3. Criar testes para ProspectModal

**Status:** pending  
**Dependencies:** None  

Desenvolver testes abrangentes para o modal de prospecção (ProspectModal), cobrindo sua abertura, preenchimento, submissão do formulário, e validação de dados de entrada e mensagens de erro.

**Details:**

Criar `ProspectModal.test.tsx`. Simular a abertura do modal, preenchimento de campos do formulário, interações com botões (salvar, cancelar) e validação de mensagens de erro. Utilizar `vi.mock` para quaisquer componentes Radix (ex: `Dialog`) ou hooks externos que o modal possa depender, seguindo o padrão já estabelecido.

### 262.4. Criar testes para ReceberPagamentoModal e NovaMatriculaModal

**Status:** pending  
**Dependencies:** None  

Desenvolver testes para os modais críticos de ReceberPagamentoModal e NovaMatriculaModal, garantindo a funcionalidade de recebimento de pagamentos e criação de novas matrículas, incluindo validações e interações.

**Details:**

Criar `ReceberPagamentoModal.test.tsx` e `NovaMatriculaModal.test.tsx`. Focar na simulação do fluxo de preenchimento dos formulários de pagamento e matrícula, validações e interações com APIs (mockadas). Usar `vi.mock` para dependências Radix, mantendo a consistência do codebase.

### 262.5. Criar testes para ClienteResumoDialog, PagamentosClient e MatriculasClient

**Status:** pending  
**Dependencies:** None  

Desenvolver testes para o dialog de resumo do cliente (ClienteResumoDialog) e para as funções de cliente relacionadas a pagamentos e matrículas, cobrindo a exibição de informações e a integração com a camada de dados.

**Details:**

Criar `ClienteResumoDialog.test.tsx`, `PagamentosClient.test.ts` e `MatriculasClient.test.ts`. Para o dialog, focar na renderização correta das informações do cliente. Para `*Client`, focar em testar as chamadas de API e o tratamento de dados (mockando as respostas da API). Usar `vi.mock` para o dialog Radix e para chamadas de API conforme o padrão.
