# Task ID: 282

**Title:** Migrar contabilidade (4 páginas) para TanStack Query

**Status:** done

**Dependencies:** 225 ✓

**Priority:** low

**Description:** Livros razão, transações, relatórios e monitoramento usam useState para server state.

**Details:**

Criar hooks: useLedgers(), useFinancialTransactions(), useFinancialReports(), useFinancialMonitoring(). Mutations com invalidação para CRUD.

**Test Strategy:**

Todas 4 páginas carregam com cache. CRUD invalida corretamente.

## Subtasks

### 282.1. Definir e implementar Query Keys para módulos de Contabilidade

**Status:** done  
**Dependencies:** None  

Estabelecer um padrão de 'query keys' para os domínios de contabilidade (Livros Razão, Transações Financeiras, Relatórios Financeiros, Monitoramento Financeiro) para uso com TanStack Query, garantindo consistência e granularidade no cache.

**Details:**

Criar um arquivo centralizado, como 'src/queries/financial/keys.ts', para exportar objetos de 'query keys' seguindo um padrão consistente como ['financial', 'ledgers', { id }] ou ['financial', 'transactions', { status, dateRange }]. Isso permitirá cache e invalidação eficientes ao longo da migração.

### 282.2. Implementar hooks useLedgers() e useFinancialTransactions() com CRUD e invalidação

**Status:** done  
**Dependencies:** 282.1  

Desenvolver os hooks 'useLedgers()' e 'useFinancialTransactions()' para buscar dados dos livros razão e transações financeiras, respectivamente. Incluir 'useMutation' para operações CRUD (Criar, Ler, Atualizar, Deletar) e configurar a lógica de invalidação de cache apropriada para cada domínio.

**Details:**

Criar os arquivos 'src/hooks/useLedgers.ts' e 'src/hooks/useFinancialTransactions.ts'. Para cada hook, implementar 'useQuery' para busca de dados e 'useMutation' para operações de escrita, garantindo que o cache seja invalidado (e.g., 'queryClient.invalidateQueries(financialKeys.ledgers.all())') após uma mutação bem-sucedida. Incluir tratamento de erros e estados de carregamento.

### 282.3. Implementar hooks useFinancialReports() e useFinancialMonitoring()

**Status:** done  
**Dependencies:** 282.1  

Desenvolver os hooks 'useFinancialReports()' e 'useFinancialMonitoring()' para buscar dados relacionados a relatórios financeiros e monitoramento financeiro. Estes hooks podem envolver filtros e parâmetros complexos, que devem ser gerenciados através das 'query keys'.

**Details:**

Criar os arquivos 'src/hooks/useFinancialReports.ts' e 'src/hooks/useFinancialMonitoring.ts'. Implementar 'useQuery' para buscar os dados, incorporando parâmetros de filtro dinâmicos nas 'query keys' para garantir cache eficiente para diferentes estados de relatórios e monitoramento. Avaliar se há necessidade de mutations e, se sim, implementar a invalidação de cache correspondente.

### 282.4. Refatorar páginas de Contabilidade para usar hooks TanStack Query e testar integração

**Status:** done  
**Dependencies:** 282.2, 282.3  

Atualizar as quatro páginas de contabilidade (Livros Razão, Transações Financeiras, Relatórios Financeiros, Monitoramento Financeiro) para consumir os novos hooks do TanStack Query, removendo o uso de 'useState' para estado do servidor e garantindo a correta exibição, interação e exportação dos dados.

**Details:**

Para cada uma das páginas (`LedgersPage`, `FinancialTransactionsPage`, `FinancialReportsPage`, `FinancialMonitoringPage`), substituir as chamadas 'fetch' existentes e o gerenciamento de estado local por chamadas aos respectivos hooks do TanStack Query (e.g., `const { data, isLoading, error } = useLedgers()`). Garantir que a integração com componentes da UI para filtros, paginação e operações CRUD funcione corretamente com o cache e os estados dos hooks. Finalmente, exportar os componentes e hooks conforme padrão do projeto.
