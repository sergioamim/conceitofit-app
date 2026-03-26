# Task ID: 110

**Title:** Consolidar páginas experimentais do financeiro no gerencial

**Status:** pending

**Dependencies:** None

**Priority:** medium

**Description:** Avaliar as páginas experimentais de contas a receber, contas a pagar e DRE em `src/app/(app)/gerencial/` para decidir se substituem as versões estáveis ou se devem ser removidas, mantendo apenas rotas canônicas no app.

**Details:**

Mapear e comparar as rotas estáveis (`src/app/(app)/gerencial/contas-a-receber/page.tsx`, `src/app/(app)/gerencial/contas-a-pagar/page.tsx`, `src/app/(app)/gerencial/dre/page.tsx`) com as experimentais (`src/app/(app)/gerencial/contas-a-receber-experimental/page.tsx`, `src/app/(app)/gerencial/contas-a-pagar-experimental/page.tsx`, `src/app/(app)/gerencial/dre-experimental/page.tsx`, além de `.../contas-a-receber-experimental/novo/page.tsx` e `.../contas-a-pagar-experimental/nova/page.tsx`).
Comparar funcionalidades, dados consumidos e UX (ex.: DRE experimental usa cards e projeção unificada com `getDreGerencialApi`/`getDreProjecaoApi`, enquanto o estável separa filtros e projeção) e decidir a versão canônica.
Se a versão experimental for a escolhida: migrar o conteúdo para as rotas estáveis, removendo as pastas `*-experimental`, consolidando imports/estados no `page.tsx` estável e atualizando o menu em `src/lib/nav-items.ts` (remover “DRE (Protótipo)” e apontar somente para `/gerencial/dre`).
Se a versão estável permanecer: excluir as páginas experimentais (incluindo páginas de redirect), remover referências no `src/lib/nav-items.ts` e em qualquer link interno encontrado via busca (`rg "dre-experimental|contas-a-receber-experimental|contas-a-pagar-experimental" src`).
Garantir que não sobrem rotas duplicadas ou apontamentos para caminhos removidos (sem links ou itens de navegação para páginas inexistentes).

**Test Strategy:**

Validar via busca que não existem referências a rotas experimentais após a consolidação: `rg "dre-experimental|contas-a-receber-experimental|contas-a-pagar-experimental" src`.
Navegar em `/gerencial/contas-a-receber`, `/gerencial/contas-a-pagar` e `/gerencial/dre` confirmando carregamento e filtros/ações principais.
Verificar o menu gerencial em `src/lib/nav-items.ts` para garantir que apenas as rotas canônicas aparecem.
Rodar `npm run lint` para confirmar ausência de erros básicos após remoções/migração.

## Subtasks

### 110.1. Auditar páginas estáveis vs experimentais do gerencial

**Status:** pending  
**Dependencies:** None  

Mapear as rotas estáveis e experimentais e registrar diferenças funcionais e de UX.

**Details:**

Comparar `src/app/(app)/gerencial/contas-a-receber/page.tsx`, `contas-a-pagar/page.tsx` e `dre/page.tsx` com as versões em `*-experimental`, incluindo redirects em `novo/nova` e o painel avançado do DRE experimental, listando APIs, filtros e componentes usados.

### 110.2. Consolidar a versão canônica nas rotas principais

**Status:** pending  
**Dependencies:** 110.1  

Decidir a versão canônica e migrar o conteúdo vencedor para as rotas estáveis.

**Details:**

Se a versão experimental for escolhida, portar o conteúdo para `src/app/(app)/gerencial/dre/page.tsx` e demais páginas estáveis, preservando melhorias (cards, horizonte de projeção, cenários) e alinhar imports/estados; se a versão estável ficar, registrar o racional e manter apenas os arquivos estáveis.

### 110.3. Remover páginas experimentais e limpar navegação

**Status:** pending  
**Dependencies:** 110.2  

Excluir rotas experimentais e remover quaisquer referências internas.

**Details:**

Remover pastas `contas-a-receber-experimental`, `contas-a-pagar-experimental` e `dre-experimental`, ajustar `src/lib/nav-items.ts` para manter apenas `/gerencial/dre` e limpar links via busca por rotas experimentais.
