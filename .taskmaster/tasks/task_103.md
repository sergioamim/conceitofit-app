# Task ID: 103

**Title:** Consolidar estado das seções colapsáveis no Sidebar

**Status:** done

**Dependencies:** None

**Priority:** low

**Description:** Refatorar o estado interno do sidebar para substituir os seis pares de `useState`/`useEffect` por um único objeto de estado, mantendo o comportamento atual de abertura automática por rota ativa.

**Details:**

Basear a mudança em `src/components/layout/sidebar.tsx`, dentro de `SidebarNavigation`, mantendo o layout e comportamento atuais.

- Criar a função `getInitialSectionStates(pathname: string): Record<string, boolean>` próxima de `matchesAnyPath`, reaproveitando as mesmas regras existentes: `atividade` usa `matchesAnyPath(pathname, atividadeItemsSorted)`, e as demais (`crm`, `treinos`, `seguranca`, `administrativo`, `gerencial`) usam `pathname.startsWith("/<section>")`.
- Substituir os seis `useState` por um único `useState<Record<string, boolean>>(() => getInitialSectionStates(pathname))`. Se necessário, declarar um mapa de chaves (ex.: `const SECTION_KEYS = {...} as const`) para evitar strings soltas.
- Trocar os seis `useEffect` por um único `useEffect` que reage ao `pathname` e faz `setOpenSections(getInitialSectionStates(pathname))`, preservando o `useEffect` que fecha o menu mobile.
- Atualizar cada `CollapsibleSection` para ler `open` via `openSections["atividade"]` etc. e `onToggle` via `setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }))`, garantindo fallback booleano quando a chave não existir.
- Não alterar arrays de navegação (`atividadeItemsSorted`, `crmItemsSorted`, etc.) nem a lógica de favoritos/recents; o objetivo é apenas reduzir duplicação e manter o comportamento idêntico.
- Confirmar que o arquivo mantém as restrições de hidratação: sem novos valores dinâmicos no render e sem mudança de árvore condicional dos itens Radix.

Resultado esperado: redução de duplicação (~600 linhas) sem mudança visual ou funcional.

**Test Strategy:**

- Navegar para cada rota principal e verificar se a seção correspondente abre automaticamente: `/atividades`, `/treinos`, `/crm`, `/seguranca`, `/administrativo`, `/gerencial`.
- Alternar manualmente cada seção e confirmar que o estado é preservado até a próxima navegação (como hoje).
- Validar que o menu mobile continua fechando ao mudar de rota.
- Fazer smoke test visual do sidebar colapsado/expandido para garantir que itens e labels não mudaram.

## Subtasks

### 103.1. Mapear estado atual do SidebarNavigation e padrões locais

**Status:** done  
**Dependencies:** None  

Revisar o arquivo do sidebar e identificar como os estados e efeitos atuais são usados nas seções colapsáveis.

**Details:**

Inspecionar `src/components/layout/sidebar.tsx` para listar os seis `useState`/`useEffect` e como cada `CollapsibleSection` consome `open`/`onToggle`, mantendo as regras de rota e filtros já existentes.

### 103.2. Criar helper de estado inicial e chaves de seção

**Status:** done  
**Dependencies:** 103.1  

Definir função utilitária para calcular o estado inicial das seções com base no pathname.

**Details:**

Adicionar `getInitialSectionStates(pathname: string)` próximo de `matchesAnyPath` com a lógica atual (atividade via `matchesAnyPath`, demais via `startsWith`), e opcionalmente declarar um mapa/constante de chaves para evitar strings soltas.

### 103.3. Consolidar estado e efeitos em um único objeto

**Status:** done  
**Dependencies:** 103.2  

Substituir os seis estados locais por um único `Record<string, boolean>` e unificar a atualização por rota.

**Details:**

Trocar os `useState` por `useState<Record<string, boolean>>(() => getInitialSectionStates(pathname))` e consolidar os seis `useEffect` em um único `useEffect` que faz `setOpenSections(getInitialSectionStates(pathname))`, mantendo o `useEffect` de fechamento do menu mobile.

### 103.4. Atualizar CollapsibleSection e validar comportamento

**Status:** done  
**Dependencies:** 103.3  

Ajustar o consumo do estado consolidado e conferir se o comportamento visual e de hidratação permanece idêntico.

**Details:**

Atualizar cada `CollapsibleSection` para ler `open` via `openSections["<chave>"]` e `onToggle` via `setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }))`, garantindo fallback booleano; revisar checklist de hidratação e confirmar que a árvore Radix e dados client-only não mudaram.
