# Task ID: 270

**Title:** Migrar vendas/page.tsx para TanStack Query

**Status:** done

**Dependencies:** 225 ✓

**Priority:** high

**Description:** Listagem de vendas usa useState para loading/error/data. Página acessada frequentemente após cada venda.

**Details:**

Criar useVendas() hook com useQuery. Query key: ["vendas", tenantId, filters]. Cache com staleTime 2min.

**Test Strategy:**

Listagem com cache. Criar venda invalida lista. Filtros funcionam.

## Subtasks

### 270.1. Definir Query Keys e Funções de Fetching para Vendas

**Status:** pending  
**Dependencies:** None  

Centralizar a definição das chaves de consulta (query keys) e a função assíncrona para buscar os dados das vendas. Isso padroniza o acesso aos dados e facilita a manutenção, preparando o terreno para o hook `useVendas`.

**Details:**

Criar um arquivo ou módulo dedicado (ex: `src/features/vendas/api/queries.ts`) para exportar um objeto de query keys (e.g., `vendasKeys`) e uma função `fetchVendas(tenantId, filters)` que fará a chamada à API. Esta função deve aceitar `tenantId` e um objeto `filters` como parâmetros.

### 270.2. Criar Hook Personalizado `useVendas` com TanStack Query

**Status:** pending  
**Dependencies:** 270.1  

Desenvolver o hook `useVendas()` que encapsula a lógica de busca de vendas usando `useQuery` do TanStack Query, utilizando as definições de query keys e a função de fetching criadas na subtask anterior.

**Details:**

Implementar `useVendas()` em `src/features/vendas/hooks/useVendas.ts`. Este hook deve utilizar a query key `vendasKeys.list(tenantId, filters)` e a função de fetching `fetchVendas`. Configurar `staleTime: 2 * 60 * 1000` (2 minutos) para o cache, conforme especificado.

### 270.3. Refatorar `vendas/page.tsx` para usar `useVendas`

**Status:** pending  
**Dependencies:** 270.2  

Atualizar o componente `vendas/page.tsx` para consumir os dados de vendas através do novo hook `useVendas()`, substituindo a lógica existente baseada em `useState` para gerenciamento de loading, error e data.

**Details:**

Remover todas as instâncias de `useState` e `useEffect` em `vendas/page.tsx` que são responsáveis pela busca e gerenciamento do estado dos dados de vendas. Importar e utilizar `useVendas()` para obter `data`, `isLoading`, `isError` e `error`. Ajustar a renderização condicional da UI baseada nesses novos estados fornecidos pelo hook.

### 270.4. Implementar Invalidação e Testar Fluxos Chave

**Status:** pending  
**Dependencies:** 270.3  

Garantir que a lista de vendas seja invalidada e atualizada após a criação de uma nova venda ou outros eventos relevantes. Validar o comportamento do cache e a funcionalidade dos filtros com TanStack Query.

**Details:**

Identificar o(s) local(is) onde novas vendas são criadas ou atualizadas (ex: em um modal de criação de venda ou API call de sucesso). Nesse(s) ponto(s), adicionar uma invalidação da query key `vendasKeys.list()` usando `queryClient.invalidateQueries({ queryKey: vendasKeys.list() })` para garantir que a lista seja re-buscada. Ajustar qualquer uso de filtros para garantir que o query key builder os inclua corretamente.
