# Task ID: 96

**Title:** Higienizar base React/SSR e zerar lint crítico da UI

**Status:** done

**Dependencies:** 92 ✓, 95 ✓

**Priority:** high

**Description:** Remover smells e regressões de base antes de continuar refinando a interface, atacando efeitos problemáticos, artefatos locais e desvios de SSR/hidratação.

**Details:**

Corrigir os erros atuais de `react-hooks/set-state-in-effect`, limpar imports mortos e arquivos temporários como `template.tsx.bak`, revisar pontos de hidratação/estado client-only introduzidos nas tasks recentes e deixar a base pronta para os próximos ajustes de acessibilidade e motion. Esta tarefa pode rodar em paralelo com 97 e 98.

**Test Strategy:**

Executar `npm run lint`, validar ausência de artefatos locais acidentais no fluxo principal e revisar manualmente os pontos de SSR/hidratação afetados nas telas operacionais.

## Subtasks

### 96.1. Corrigir efeitos com setState síncrono e estados derivados instáveis

**Status:** done  
**Dependencies:** None  

Resolver os erros atuais de lint em hooks e componentes de formulário/preferências.

**Details:**

Revisar `src/components/shared/form-draft-components.tsx`, `src/components/shared/novo-cliente-wizard.tsx`, `src/hooks/use-user-preferences.ts` e quaisquer pontos correlatos para eliminar `setState` síncrono em `useEffect`, privilegiando estado derivado, lazy init ou callbacks adequados.

### 96.2. Remover artefatos e imports mortos do shell de navegação

**Status:** done  
**Dependencies:** None  

Limpar sobras de refactor e reduzir ruído estrutural no app shell.

**Details:**

Eliminar arquivos temporários como `src/app/(app)/template.tsx.bak`, revisar imports não usados em `app-topbar`, `command-palette`, `sidebar` e demais áreas tocadas recentemente, e garantir que o estado atual do shell reflita a intenção real do produto.

### 96.3. Fechar checklist de SSR/hydration safety nas áreas alteradas

**Status:** done  
**Dependencies:** 96.1, 96.2  

Garantir que os componentes recentes continuam seguros para renderização hidratável.

**Details:**

Repassar os guardrails de `AGENTS.md` nos componentes alterados recentemente, verificando `localStorage`, `window`, datas dinâmicas e estrutura consistente de Radix/Next no primeiro render.
