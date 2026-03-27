# Task ID: 111

**Title:** Estabilizar suíte E2E Playwright para fluxos críticos

**Status:** done

**Dependencies:** 108 ✓

**Priority:** medium

**Description:** Revisar e reativar a suíte E2E do Playwright garantindo execução recente e estabilidade dos fluxos críticos (venda, cadastro público, matrícula, pagamento e CRM de prospects), além de remover specs obsoletas e padronizar o script de execução.

**Details:**

Mapear a suíte atual em `tests/e2e/` (35 specs) e priorizar os fluxos críticos já cobertos por `tests/e2e/comercial-fluxo.spec.ts`, `tests/e2e/clientes-cadastro.spec.ts`, `tests/e2e/adesao-publica.spec.ts` e `tests/e2e/crm-operacional.spec.ts`. Revisar seletores quebrados pós-refatorações priorizando `getByRole`/`getByLabel` como nos arquivos existentes; quando não houver acessibilidade consistente, introduzir `data-testid` nos componentes afetados e ajustar os specs. Validar e, se necessário, ajustar os mocks do `tests/e2e/support/backend-only-stubs.ts` (ex.: `installPublicJourneyApiMocks`, `seedAuthenticatedSession`) para alinhar endpoints/response usados nos fluxos críticos e evitar 404s durante `npm run dev:mock` configurado em `playwright.config.ts`. Remover specs obsoletas em `tests/e2e/` e atualizar listas de smoke/coverage quando houver alteração de arquivo, incluindo `scripts/playwright-coverage.mjs` (const `SMOKE_E2E_SPECS`) e os artefatos `docs/TEST_COVERAGE_CORE.md`, `docs/TEST_COVERAGE_CORE.json`, `docs/TEST_COVERAGE_BASELINE.json` se os arquivos referenciados mudarem. Adicionar o script `test:e2e` no `package.json` como alias para `playwright test` (ou `npm run e2e`) mantendo compatibilidade com os comandos atuais e o fluxo do `Makefile`.

**Test Strategy:**

Executar `npm run test:e2e` para validar a suíte completa com o `webServer` definido em `playwright.config.ts`. Rodar isoladamente os fluxos críticos para triagem rápida: `npx playwright test tests/e2e/comercial-fluxo.spec.ts tests/e2e/clientes-cadastro.spec.ts tests/e2e/adesao-publica.spec.ts tests/e2e/crm-operacional.spec.ts`. Conferir o relatório em `playwright-report` e garantir que não há falhas de seletor, erros de mock/rota ou falhas de navegação pós-refatoração.

## Subtasks

### 111.1. Auditar e classificar as specs E2E existentes

**Status:** done  
**Dependencies:** None  

Mapear as specs em `tests/e2e/` e classificar cada uma como funcional, quebrada ou obsoleta.

**Details:**

Listar as 35 specs, registrar status e notas de falha, validar impacto no smoke/coverage, e preparar a lista de remoções necessárias para ajustar `scripts/playwright-coverage.mjs` (SMOKE_E2E_SPECS) e os artefatos em `docs/TEST_COVERAGE_CORE.md`, `docs/TEST_COVERAGE_CORE.json` e `docs/TEST_COVERAGE_BASELINE.json` quando houver mudança de arquivo.

### 111.2. Corrigir specs dos fluxos comerciais (venda/matrícula/pagamento)

**Status:** done  
**Dependencies:** 111.1  

Estabilizar os fluxos críticos de venda e matrícula com foco em seletores e mocks.

**Details:**

Revisar `tests/e2e/comercial-fluxo.spec.ts` e `tests/e2e/clientes-cadastro.spec.ts`, migrar seletores quebrados para `getByRole`/`getByLabel`, adicionar `data-testid` em componentes quando não houver acessibilidade consistente e alinhar mocks no `tests/e2e/support/backend-only-stubs.ts` (ex.: sessão, vendas, matrículas e pagamentos) com os endpoints usados.

### 111.3. Corrigir specs de adesão pública e CRM operacional

**Status:** done  
**Dependencies:** 111.1  

Garantir estabilidade dos testes de jornada pública e CRM de prospects.

**Details:**

Ajustar `tests/e2e/adesao-publica.spec.ts` e `tests/e2e/crm-operacional.spec.ts` com seletores robustos (`getByRole`/`getByLabel`), incluir `data-testid` quando necessário e revisar mocks do `installPublicJourneyApiMocks` e demais stubs no `tests/e2e/support/backend-only-stubs.ts` para evitar 404s no fluxo público e CRM.

### 111.4. Padronizar execução E2E e rodar suíte headless no CI

**Status:** done  
**Dependencies:** 111.2, 111.3  

Uniformizar os scripts de execução e atualizar configurações de CI para rodar E2E headless.

**Details:**

Adicionar `test:e2e` no `package.json` como alias de `playwright test` mantendo compatibilidade com `e2e` e o `Makefile`, revisar `playwright.config.ts` para garantir `dev:mock` estável e criar/ajustar workflow em `.github/workflows/` para executar a suíte headless; atualizar `scripts/playwright-coverage.mjs` e docs de coverage quando arquivos forem removidos/renomeados.
