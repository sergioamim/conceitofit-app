# Task ID: 353

**Title:** Corrigir bootstrap de contexto e stuck-loaders do shell autenticado

**Status:** done

**Dependencies:** 348 ✓, 349 ✓

**Priority:** high

**Description:** Resolver os cenários em que o shell autenticado sobe, mas fica preso sem unidade ativa resolvida ou com dashboard em loading indefinido.

**Details:**

Escopo: `tests/e2e/app-multiunidade-contrato.spec.ts`, `tests/e2e/sessao-multiunidade.spec.ts`, `tests/e2e/comercial-smoke-real.spec.ts` e pontos compartilhados do shell autenticado. Evidências atuais: `Selecionar unidade ativa` desabilitado e `Carregando dashboard...` persistente em `test-results/app-multiunidade-contrato--b3fe4-aliza-bloqueios-contratuais-chromium/error-context.md` e `test-results/sessao-multiunidade-Sessão-35194-1-e-o-refresh-também-expira-chromium/error-context.md`. Revisar principalmente `src/components/layout/active-tenant-selector.tsx`, `src/app/(app)/dashboard/dashboard-content.tsx`, o bootstrap de sessão/contexto e os contratos usados pelos helpers E2E. A saída esperada é: shell converge para dados, empty state ou erro explícito; não fica preso em loading nem bloqueia a troca/visualização de unidade ativa.

**Test Strategy:**

Executar `tests/e2e/app-multiunidade-contrato.spec.ts`, `tests/e2e/sessao-multiunidade.spec.ts` e `tests/e2e/comercial-smoke-real.spec.ts` em chromium. Validar que o seletor de unidade deixa de ficar desabilitado quando o contexto é elegível e que o dashboard não permanece indefinidamente em loading.
