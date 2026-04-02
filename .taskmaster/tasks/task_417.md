# Task ID: 417

**Title:** Reestabilizar shell operacional por unidade e CRUD administrativo

**Status:** done

**Dependencies:** 353 ✓

**Priority:** high

**Description:** Corrigir rotas autenticadas por unidade que ainda sobem com placeholders de contexto, seletor bloqueado ou loadings intermináveis, quebrando CRUD administrativo e telas operacionais.

**Details:**

Escopo: `tests/e2e/admin-catalogo-crud.spec.ts`, `tests/e2e/admin-config-api-only.spec.ts`, `tests/e2e/admin-financeiro-operacional-crud.spec.ts`, `tests/e2e/admin-unidade-base-equipe.spec.ts`, `tests/e2e/operacional-grade-catraca.spec.ts`, `tests/e2e/layout-bottom-nav.spec.ts` e `tests/e2e/planos-context-recovery.spec.ts`. Evidências atuais: `layout-bottom-nav` e `planos-context-recovery` ainda mostram `Selecionar unidade ativa` desabilitado e `Carregando dashboard...` em `test-results/layout-bottom-nav-Bottom-N-64312-alhos-críticos-da-BottomNav-chromium/error-context.md` e `test-results/planos-context-recovery-Pl-c20e7-em-erro-runtime-na-listagem-chromium/error-context.md`; `admin-financeiro-operacional-crud` fica em `Carregando atividades...`; os buckets administrativos seguem exibindo shell/menu, mas sem contexto consistente de academia/unidade para convergir o conteúdo. Reutilizar como fonte de verdade o pacote administrativo descrito em `docs/task-34-playwright-admin-crud.md` e a baseline anterior da task `334` em `docs/PLAYWRIGHT_STABILIZATION_BASELINE_2026-04-01.md`. Revisar `src/components/layout/*`, seleção de unidade ativa, rotas `src/app/(app)/administrativo/*`, `src/app/(app)/grade`, `src/app/(app)/atividades` e componentes compartilhados de tabela/listagem.

**Test Strategy:**

Executar os sete specs do escopo em chromium. Validar que a shell autenticada deixa de renderizar placeholders de `Academia`/`Unidade ativa`, que o seletor de unidade volta a habilitar quando a fixture é elegível e que cada rota administrativa/operacional sai do loading para dados, estado vazio ou erro explícito.
