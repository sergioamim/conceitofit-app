# Task ID: 29

**Title:** Fechar aderência de hidratação, contexto e data/hora no frontend

**Status:** done

**Dependencies:** 28 ✓

**Priority:** high

**Description:** Ajustar pontos remanescentes de aderência em UI/HTTP para eliminar causas reais de hydration mismatch e reduzir risco de comportamento divergente entre SSR e cliente, sem regressão funcional em contratos já estabilizados.

**Details:**

A auditoria recente identificou quatro ajustes práticos fora de escopo funcional amplo: (1) uso residual de `suppressHydrationWarning` em componente base de Select; (2) formatação temporal não determinística no render do fluxo de importação de pacote; (3) fallback de contexto com ID não determinístico no `getContextId`; (4) revisão pontual da classificação de rotas context-scoped em `http.ts` que afeta consistência de tenant scoping. Esta task agrupa esses fechamentos com subtarefas curtas e validadas por teste.

**Test Strategy:**

Executar `npx eslint` nos arquivos alterados, os testes unitários de `src/lib/api/http.ts` e o teste de contrato de importação em `tests/unit/backoffice-importacao-evo.spec.ts` (ou equivalente), além de smoke em tela de login + importação de pacote no dev para validar ausência de overlay de hydration.

## Subtasks

### 29.1. Remover `suppressHydrationWarning` do componente Select compartilhado

**Status:** done  
**Dependencies:** None  

Remover o uso de `suppressHydrationWarning` em `src/components/ui/select.tsx` (trigger), garantindo que qualquer estado de cliente continue com fallback estável e não dependa de escape hatch.

**Details:**

Remover o uso de `suppressHydrationWarning` em `src/components/ui/select.tsx` (trigger), garantindo que qualquer estado de cliente continue com fallback estável e não dependa de escape hatch.

### 29.2. Tornar `formatDateTime` do fluxo de pacote determinístico

**Status:** done  
**Dependencies:** 29.1  

Refatorar `formatDateTime` e usos correlatos em `src/app/(backoffice)/admin/importacao-evo-p0/page.tsx` para não depender de `Intl` com parsing/locale no path de render inicial.

**Details:**

Refatorar `formatDateTime` e usos correlatos em `src/app/(backoffice)/admin/importacao-evo-p0/page.tsx` para não depender de `Intl` com parsing/locale no path de render inicial, preservando o mesmo valor serializável entre SSR e primeiro render.

### 29.3. Remover fallback não determinístico de `getContextId`

**Status:** done  
**Dependencies:** None  

Substituir a geração de `crypto.randomUUID()` / `Math.random()` em `getContextId` (`src/lib/api/http.ts`) por fonte determinística derivada do estado de sessão/tenant ativo.

**Details:**

Substituir a geração de `crypto.randomUUID()` / `Math.random()` em `getContextId` (`src/lib/api/http.ts`) por fonte determinística derivada do estado de sessão/tenant ativo, evitando IDs mutáveis sem relação com contexto real e mantendo sincronização segura quando não houver contexto explícito.

### 29.4. Validar regra de rota context-scoped para `administrativo`

**Status:** done  
**Dependencies:** None  

Revisar os padrões `CONTEXT_SCOPED_OPERATIONAL_PATTERNS` e `EXPLICIT_TENANT_QUERY_PATTERNS` em `src/lib/api/http.ts`, com foco em `/api/v1/administrativo/*`.

**Details:**

Revisar os padrões `CONTEXT_SCOPED_OPERATIONAL_PATTERNS` e `EXPLICIT_TENANT_QUERY_PATTERNS` em `src/lib/api/http.ts`, com foco em `/api/v1/administrativo/*`, adicionando comentário objetivo da decisão quando rota exigir tenant explícito ou contexto ativo.

### 29.5. Expandir cobertura de regressão para os ajustes de aderência

**Status:** done  
**Dependencies:** 29.1, 29.2, 29.3, 29.4  

Adicionar/ajustar testes unitários para garantir ausência de `tenantId` redundante nas rotas context-scoped e validação de dados determinísticos no fluxo de pacote.

**Details:**

Adicionar/ajustar testes unitários para garantir: ausência de `suppressHydrationWarning` no componente de Select, datas não mutáveis no retorno de render da tela de pacote e ausência de `tenantId` redundante em rotas context-scoped com `X-Context-Id` ativo.
