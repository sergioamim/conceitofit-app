# Task ID: 104

**Title:** Padronizar tratamento de erro de carregamento nas páginas administrativas de CRUD

**Status:** done

**Dependencies:** 102 ✓

**Priority:** low

**Description:** Uniformizar o handling de erro de carregamento nas páginas administrativas de CRUD, criando um componente compartilhado de erro com retry e aplicando-o em todas as páginas que fazem fetch de dados.

**Details:**

Criar o componente `src/components/shared/page-error.tsx` inspirado em `src/components/shared/error-state.tsx`, usando `AlertTriangle`, `Button` e `MOTION_CLASSNAMES.fadeInSubtle` para manter o visual consistente; o componente deve aceitar `error` (string ou unknown normalizado via `normalizeErrorMessage`) e `onRetry` opcional, renderizar mensagem amigável e botão “Tentar novamente”, e retornar `null` quando não houver erro. Atualizar páginas administrativas que fazem fetch e hoje têm erro inline ou nenhum tratamento para usar o novo componente: começar por `src/app/(app)/administrativo/bandeiras/page.tsx`, `src/app/(app)/administrativo/salas/page.tsx` e `src/app/(app)/administrativo/convenios/page.tsx` (adicionando `try/catch` no `load`, estado `loadError`, e renderização de `<PageError error={loadError} onRetry={load} />`), além das páginas com `setError` de carregamento já identificadas (ex.: `src/app/(app)/administrativo/academia/page.tsx`, `contas-bancarias/page.tsx`, `conciliacao-bancaria/page.tsx`, `integracoes/page.tsx`, `atividades-grade/page.tsx`, `catraca-status/page.tsx`, `nfse/page.tsx`, `unidades/page.tsx`, `maquininhas/page.tsx`). Para páginas que usam o hook `useCrudOperations` (task 102), substituir o UI de erro de carregamento manual pelo `PageError` consumindo o erro/reload expostos pelo hook. Separar erro de carregamento de erro de ação quando necessário (ex.: manter mensagens de falha de salvar/ativar em banners específicos), removendo `setError()` de string usado apenas para load e garantindo que o estado de erro seja limpo antes de novo carregamento.

**Test Strategy:**

1) Forçar erro de carregamento (ex.: mockar resposta de API ou lançar erro no `load`) em cada página administrativa e validar que o `PageError` aparece com mensagem consistente e botão de retry. 2) Clicar em “Tentar novamente” e confirmar que o `load` é reexecutado e o erro some após sucesso. 3) Verificar que erros de ações (salvar/ativar/remover) continuam sendo exibidos nos locais existentes sem interferir no estado de load. 4) Conferir páginas que usam `useCrudOperations` exibindo o `PageError` usando o erro do hook.

## Subtasks

### 104.1. Auditar páginas administrativas e mapear padrões de erro

**Status:** done  
**Dependencies:** None  

Levantar todas as páginas CRUD administrativas com fetch e identificar como cada uma trata erro de carregamento hoje.

**Details:**

Usar glob em `src/app/(app)/administrativo/**/page.tsx`, grep por `setError`, `load` e `Promise.all`, e registrar quais páginas usam erro inline, não tratam erro ou misturam erro de load com erro de ação.

### 104.2. Criar componente compartilhado PageError

**Status:** done  
**Dependencies:** 104.1  

Implementar o componente `PageError` para exibir erro de carregamento com botão de retry.

**Details:**

Adicionar `src/components/shared/page-error.tsx` inspirado em `error-state.tsx`, usando `AlertTriangle`, `Button` e `MOTION_CLASSNAMES.fadeInSubtle`; aceitar `error` (string ou unknown normalizado via `normalizeErrorMessage`) e `onRetry` opcional, renderizar mensagem amigável e botão “Tentar novamente”, e retornar `null` quando não houver erro.

### 104.3. Padronizar bandeiras, salas e convênios com PageError

**Status:** done  
**Dependencies:** 104.2  

Adicionar tratamento consistente de erro de carregamento nessas páginas iniciais.

**Details:**

Em `src/app/(app)/administrativo/bandeiras/page.tsx`, `salas/page.tsx` e `convenios/page.tsx`, criar estado `loadError`, envolver `load` em `try/catch`, limpar erro antes de carregar, separar erro de ação quando existir e renderizar `<PageError error={loadError} onRetry={load} />` próximo ao topo.

### 104.4. Aplicar PageError nas demais páginas administrativas listadas

**Status:** done  
**Dependencies:** 104.2  

Uniformizar páginas com `setError` de load ou sem tratamento para usar o novo componente.

**Details:**

Atualizar `academia/page.tsx`, `contas-bancarias/page.tsx`, `conciliacao-bancaria/page.tsx`, `integracoes/page.tsx`, `atividades-grade/page.tsx`, `catraca-status/page.tsx`, `nfse/page.tsx`, `unidades/page.tsx`, `maquininhas/page.tsx`; separar `loadError` de erros de ação, limpar estado antes de novo carregamento, ajustar mensagens de empty state para usar `loadError` e incluir `<PageError error={loadError} onRetry={load} />`.

### 104.5. Revisar páginas que usam useCrudOperations

**Status:** done  
**Dependencies:** 104.2  

Trocar UI manual de erro de carregamento pelo `PageError` nas telas baseadas no hook.

**Details:**

Localizar páginas que usam `useCrudOperations` (task 102) e substituir o erro de load manual por `<PageError error={loadErrorFromHook} onRetry={reloadFromHook} />`, garantindo que erros de ação continuem em banners específicos e que `loadError` seja limpo antes de recarregar.
