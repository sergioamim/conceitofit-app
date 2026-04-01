# Task ID: 284

**Title:** Migrar treinos (4 páginas) para TanStack Query

**Status:** done

**Dependencies:** 225 ✓

**Priority:** medium

**Description:** Detalhes, atribuídos, exercícios e grupos musculares usam useState para server state.

**Details:**

Criar hooks: useTreinoDetail(), useTreinosAtribuidos(), useExercicios(), useGruposMusculares(). Mutations para atribuir/registrar execução.

**Test Strategy:**

Todas páginas carregam com cache. Atribuir treino invalida lista.

## Subtasks

### 284.1. Criar Hooks de Query para Treinos (Detalhes, Atribuídos, Exercícios, Grupos Musculares)

**Status:** done  
**Dependencies:** None  

Desenvolver os hooks 'useTreinoDetail()', 'useTreinosAtribuidos()', 'useExercicios()' e 'useGruposMusculares()' utilizando TanStack Query. Estes hooks devem gerenciar o estado do servidor para as páginas de detalhes de treino, treinos atribuídos, lista de exercícios e grupos musculares, substituindo o uso de useState atual.

**Details:**

Analisar os endpoints da API para cada tipo de dado de treino. Definir 'queryKeys' apropriadas para cada hook, considerando dependências e invalidação. Implementar a lógica de fetching de dados dentro de cada hook. Configurar 'staleTime' para 2 minutos, conforme contexto do projeto. Garantir que os dados carreguem e sejam cacheados corretamente seguindo os padrões existentes no codebase.

### 284.2. Implementar Mutations de Treinos e Refatorar Páginas de Detalhes e Atribuição

**Status:** done  
**Dependencies:** 284.1  

Criar mutations para atribuir treinos e registrar execuções de exercícios. Integrar os hooks de query desenvolvidos na subtarefa 1 e as novas mutations nas respectivas 4 páginas (Detalhes do Treino, Treinos Atribuídos, Lista de Exercícios, Grupos Musculares), substituindo o gerenciamento de estado local por TanStack Query.

**Details:**

Desenvolver 'useMutation' hooks para as operações de atribuição de treinos e registro de execuções, incluindo a lógica de 'onSuccess' para invalidação de queries relevantes (ex: 'useTreinosAtribuidos' após uma nova atribuição). Refatorar as páginas 'Detalhes do Treino', 'Treinos Atribuídos', 'Lista de Exercícios' e 'Grupos Musculares' para consumir os novos hooks de query. Substituir todas as chamadas de API diretas e o gerenciamento de estado com 'useState' pelos hooks do TanStack Query. Implementar 'optimistic updates' quando aplicável para as mutations, seguindo padrões já adotados. Garantir a exibição correta dos dados e o funcionamento de todas as ações de atribuição/execução.

### 284.3. Migrar Agregadores e Catraca Acessos para TanStack Query

**Status:** done  
**Dependencies:** None  

Desenvolver os hooks 'useAgregadores()' e 'useCatracaAcessos()' utilizando TanStack Query. Refatorar as duas páginas correspondentes para consumir esses hooks, garantindo a manipulação de dados tabulares com filtros. Exportar os hooks e testá-los, aplicando 'staleTime' de 2 minutos.

**Details:**

Analisar os endpoints da API para agregadores e acessos de catraca. Definir 'queryKeys' que incluam parâmetros de filtro para dados tabulares, seguindo a convenção de queries com filtros. Implementar 'useAgregadores()' e 'useCatracaAcessos()' com a lógica de fetching de dados e 'staleTime' de 2 minutos. Refatorar as páginas de agregadores e catraca-acessos para usar os novos hooks. Garantir que a lógica de filtragem, paginação e ordenação funcione corretamente com TanStack Query. Exportar os hooks para uso em outras partes da aplicação, se necessário. Criar testes unitários/de integração para os novos hooks e a integração nas páginas refatoradas.
