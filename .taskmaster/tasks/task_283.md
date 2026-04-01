# Task ID: 283

**Title:** Migrar agregadores e catraca-acessos para TanStack Query

**Status:** done

**Dependencies:** 225 ✓

**Priority:** low

**Description:** agregadores-content.tsx e catraca-acessos/page.tsx usam useState para dados tabulares com filtros.

**Details:**

Criar useAgregadores() e useCatracaAcessos() hooks.

**Test Strategy:**

Listagem com cache. Filtros funcionam.

## Subtasks

### 283.1. Definir Query Keys e Funções de Fetching para Agregadores e Catraca Acessos

**Status:** pending  
**Dependencies:** None  

Criar as query keys padronizadas e as funções assíncronas de fetching (getters) para os dados de agregadores e acessos de catraca, considerando a estrutura dos filtros. Isso é um pré-requisito para os hooks do TanStack Query.

**Details:**

As query keys devem seguir o padrão `["agregadores", { filtros }]` e `["catracaAcessos", { filtros }]`. As funções de fetching (`fetchAgregadores`, `fetchCatracaAcessos`) devem aceitar um objeto de filtros como parâmetro e realizar a chamada à API usando a biblioteca padrão (e.g., Axios).

### 283.2. Implementar o Hook Personalizado `useAgregadores()` com TanStack Query

**Status:** pending  
**Dependencies:** 283.1  

Desenvolver o hook `useAgregadores()` que encapsula a lógica de fetching e cache para os dados de agregadores, utilizando TanStack Query e as query keys e funções de fetching definidas anteriormente. O hook deve suportar parâmetros de filtro.

**Details:**

O hook `useAgregadores()` deve utilizar a função `useQuery` do TanStack Query. Ele receberá um objeto de filtros, montará dinamicamente a `query key` baseada nos filtros e usará a função `fetchAgregadores`. O `staleTime` deve ser configurado para 2 minutos, alinhado com o contexto do projeto.

### 283.3. Implementar o Hook Personalizado `useCatracaAcessos()` com TanStack Query

**Status:** pending  
**Dependencies:** 283.1  

Desenvolver o hook `useCatracaAcessos()` que encapsula a lógica de fetching e cache para os dados de acessos de catraca, utilizando TanStack Query e as query keys e funções de fetching definidas anteriormente. O hook deve suportar parâmetros de filtro.

**Details:**

O hook `useCatracaAcessos()` deve utilizar a função `useQuery` do TanStack Query. Ele receberá um objeto de filtros, montará dinamicamente a `query key` baseada nos filtros e usará a função `fetchCatracaAcessos`. O `staleTime` deve ser configurado para 2 minutos, alinhado com o contexto do projeto.

### 283.4. Refatorar `agregadores-content.tsx` e `catraca-acessos/page.tsx` para usar os novos Hooks

**Status:** pending  
**Dependencies:** 283.2, 283.3  

Atualizar os componentes `agregadores-content.tsx` e `catraca-acessos/page.tsx` para consumir dados através dos hooks `useAgregadores()` e `useCatracaAcessos()`, respectivamente, substituindo as implementações existentes baseadas em `useState` e `useEffect`.

**Details:**

Remover as chamadas de API e gerenciamento de estado manual (`useState` e `useEffect`) nas páginas. Integrar os hooks `useAgregadores()` e `useCatracaAcessos()`, passando os estados de filtro já existentes como parâmetros. Adaptar a renderização da interface para usar os dados, estado de carregamento e erros retornados pelos hooks.
