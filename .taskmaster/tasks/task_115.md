# Task ID: 115

**Title:** Padronizar tratamento de erros e estados vazios nas listagens

**Status:** done

**Dependencies:** None

**Priority:** medium

**Description:** Consolidar o padrão de error boundaries, estados vazios (empty state) e retry nas páginas de listagem. Hoje cada página implementa loading/error/empty de forma ad hoc. Criar componentes reutilizáveis e aplicar consistentemente.

**Details:**

Criar src/components/shared/list-states.tsx com: (1) EmptyState — ícone + mensagem + CTA opcional, variantes por contexto (busca sem resultado vs lista vazia); (2) ErrorState — já existe parcialmente em error-state.tsx, unificar com retry callback; (3) ListLoadingSkeleton — wrapper genérico que aceita número de linhas. Auditar as páginas de listagem (/clientes, /vendas, /matriculas, /pagamentos, /planos, /prospects, CRM pages, admin pages) e substituir implementações ad hoc de empty/error/loading pelos componentes padronizados. Garantir que mensagens de erro incluam ação (retry ou contato suporte). Não alterar a lógica de negócio, apenas a camada de apresentação de estados.

**Test Strategy:**

Simular erro de rede (desligar backend) e verificar que todas as listagens mostram ErrorState com botão retry. Verificar lista vazia (filtro sem resultados) mostra EmptyState adequado. Confirmar que loading skeletons aparecem durante fetch.

## Subtasks

### 115.1. Criar componentes compartilhados de estados de lista

**Status:** done  
**Dependencies:** None  

Implementar os componentes padronizados de empty, erro e loading para listas.

**Details:**

Criar `src/components/shared/list-states.tsx` com `EmptyState` (ícone, mensagem, CTA opcional e variantes para busca sem resultado vs lista vazia), `ErrorState` unificando o visual de `error-state.tsx`/`page-error.tsx` com callback de retry e mensagem com ação, e `ListLoadingSkeleton` como wrapper genérico que aceita número de linhas (usando `Skeleton`). Garantir consistência visual com `MOTION_CLASSNAMES` e textos estáveis no render SSR.

### 115.2. Padronizar estados nas listagens principais

**Status:** done  
**Dependencies:** 115.1  

Substituir implementações ad hoc de loading/erro/empty nas páginas principais de listagem.

**Details:**

Auditar e atualizar `src/app/(app)/clientes/page.tsx`, `src/app/(app)/vendas/page.tsx`, `src/app/(app)/matriculas/page.tsx`, `src/app/(app)/pagamentos/page.tsx`, `src/app/(app)/planos/page.tsx` e `src/app/(app)/prospects/page.tsx` para usar `EmptyState`, `ErrorState` e `ListLoadingSkeleton`. Trocar banners e linhas vazias de tabela por componentes padronizados, ligar `onRetry` às funções `load` existentes e manter a lógica de negócio intacta.

### 115.3. Aplicar padrão nas listagens administrativas e gerenciais restantes

**Status:** done  
**Dependencies:** 115.1, 115.2  

Uniformizar os estados de lista em módulos administrativos, CRM e gerenciais.

**Details:**

Revisar páginas em `src/app/(app)/administrativo/**`, `src/app/(app)/gerencial/**`, `src/app/(app)/crm/**` e `src/app/(backoffice)/admin/**` que hoje usam `PageError`, mensagens inline ou loaders próprios. Substituir por `EmptyState`, `ErrorState` e `ListLoadingSkeleton`, garantindo mensagens com ação (retry ou contato suporte) e mantendo a estrutura SSR estável.
