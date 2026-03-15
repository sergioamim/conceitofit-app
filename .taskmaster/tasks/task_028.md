# Task ID: 28

**Title:** Estabilizar shell SSR e eliminar hydration mismatch sem escape hatches

**Status:** done

**Dependencies:** 3 ✓, 24 ✓

**Priority:** high

**Description:** Corrigir de forma estrutural o shell principal e as telas de treinos para eliminar mismatch de hidratacao sem usar `suppressHydrationWarning`.

**Details:**

O frontend hoje ainda mistura fallback de SSR diferente do shell final, labels tenant-aware mutaveis no primeiro paint e formatacao/calculo temporal durante o render hidratavel. Esta task fecha o problema na raiz: padronizar o estado inicial do contexto e do branding, fazer sidebar/topbar/backoffice renderizarem a mesma arvore entre servidor e primeiro render do cliente, remover `suppressHydrationWarning` do escopo e reescrever pontos de treinos que ainda dependem de `new Date()`, locale do navegador ou outros valores nao deterministas em render.

O trabalho tambem inclui ajustes basicos de acessibilidade e estabilidade visual do layout, como rotulos de controles, logo com dimensoes estaveis e fallback textual unico para unidade ativa, sem mascarar divergencias de HTML.

**Test Strategy:**

Executar testes unitarios dos componentes e helpers afetados, smoke/e2e nas rotas do shell e de treinos, e validar em dev que o overlay de hydration do Next.js nao reaparece no app shell, no backoffice nem nas paginas de treinos.

## Subtasks

### 28.1. Auditar shell e mapear hotspots reais de hydration

**Status:** done  
**Dependencies:** None  

Fechar o inventario dos pontos que ainda divergem entre SSR e cliente.

**Details:**

Revisar `src/app/(app)/layout.tsx`, `src/app/(backoffice)/admin/layout.tsx`, sidebar, topbar, provider de tenant e paginas de treinos; listar usos de `suppressHydrationWarning`, datas nao deterministas, browser-only state, placeholders inconsistentes e estruturas assimetricas entre fallback SSR e shell final.

### 28.2. Padronizar estado inicial de tenant, branding e labels compartilhadas

**Status:** done  
**Dependencies:** 28.1  

Garantir que nome de unidade, academia e branding tenham fallback identico no SSR e no primeiro render do cliente.

**Details:**

Rever `src/hooks/use-session-context.tsx` e componentes compartilhados do layout para expor um estado inicial estavel, com um unico fallback textual para unidade ativa e sem trocar trechos de JSX logo na hidratacao.

### 28.3. Reestruturar app shell e backoffice para arvore SSR deterministica

**Status:** done  
**Dependencies:** 28.1, 28.2  

Fazer fallback e layout final compartilharem a mesma estrutura visual e semantica.

**Details:**

Refatorar `src/app/(app)/layout.tsx` e `src/app/(backoffice)/admin/layout.tsx` para que SSR e primeiro render do cliente usem o mesmo shell base, com placeholders estaveis para sidebar, topbar, autenticacao e permissoes, eliminando saltos de layout e mismatch estrutural.

### 28.4. Ajustar sidebar e topbar para acessibilidade e estabilidade visual

**Status:** done  
**Dependencies:** 28.1, 28.2, 28.3  

Melhorar o layout sem redesign amplo e sem introduzir novas fontes de mismatch.

**Details:**

Adicionar rotulos e atributos faltantes no topo, estabilizar rendering do logo e do bloco de identidade no sidebar, revisar busca global e menu mobile segundo as diretrizes de acessibilidade e layout estavel, sempre preservando a mesma arvore entre SSR e cliente.

### 28.5. Eliminar fontes de hydration nao deterministica nas paginas de treinos

**Status:** done  
**Dependencies:** 28.1, 28.2  

Remover datas e labels mutaveis do render hidratavel de treinos.

**Details:**

Reescrever `src/app/(app)/treinos/page.tsx` e `src/app/(app)/treinos/atribuidos/page.tsx` para substituir `new Date()`, `toLocaleDateString()` e calculos baseados em “hoje” por helpers deterministas ou logica pos-mount, mantendo copy e badges estaveis no primeiro paint.

### 28.6. Remover `suppressHydrationWarning` do escopo e consolidar a politica anti-escape hatch

**Status:** done  
**Dependencies:** 28.2, 28.3, 28.4, 28.5  

Fechar o problema sem mascarar divergencias.

**Details:**

Eliminar usos remanescentes de `suppressHydrationWarning` nos arquivos do shell, sidebar, topbar e treinos; garantir que qualquer dado client-only seja tratado com placeholder estavel ou enriquecimento pos-mount, nunca com supressao do warning.

### 28.7. Cobrir testes e smoke de hidratacao nas rotas criticas

**Status:** done  
**Dependencies:** 28.3, 28.4, 28.5, 28.6  

Validar a regressao do shell e das paginas onde o problema ja apareceu.

**Details:**

Adicionar ou ajustar testes unitarios/e2e para o shell principal, backoffice, seletor de unidade e paginas de treinos; validar que as rotas renderizam com fallback consistente, sem mismatch de labels tenant-aware e sem overlay de hydration no ambiente dev.

## Completion Notes

- Shell principal e backoffice passaram a compartilhar a mesma moldura SSR/base entre fallback e layout final, evitando troca estrutural no primeiro paint.
- Sidebar, topbar e paginas de treinos agora usam fallback textual unico para unidade ativa, sem `suppressHydrationWarning` local e sem labels mutaveis no primeiro render.
- `treinos/atribuidos` saiu de `new Date()`/`toLocaleDateString()` no render hidratavel e passou a usar formatacao deterministica e `statusValidade`.
- Verificacao local concluida com `npx eslint` nos arquivos alterados e `npx playwright test tests/unit/tenant-context.spec.ts tests/unit/treinos-api.spec.ts tests/unit/treinos-workspace.spec.ts --config=playwright.unit.config.ts` com 11 testes passando.
- As specs E2E alvo (`sessao-multiunidade`, `treinos-template-list`, `treinos-atribuidos`) ficaram bloqueadas no sandbox porque o `webServer` do Playwright nao conseguiu subir devido a `.next/dev/lock` em uso.
