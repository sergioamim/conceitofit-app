# TEST_MAP

## Estratégia de testes observada

## 1. Vitest + happy-dom

- Uso:
  - componentes
  - hooks
  - utilitários
  - acessibilidade pontual com `vitest-axe`
- Configuração:
  - `vitest.config.ts`
  - `tests/setup.ts`
- Observações:
  - `tests/setup.ts` injeta `localStorage` fake
  - `tests/setup.ts` instala `fetch` padrão para evitar acesso externo inesperado em teste

## 2. Playwright E2E

- Uso:
  - fluxos ponta a ponta do produto
  - smoke pack
  - cenários com backend real em trilhas específicas
- Configuração:
  - `playwright.config.ts`
  - `tests/e2e/global-setup.ts`
- Helpers centrais:
  - `tests/e2e/support/protected-shell-mocks.ts`
  - `tests/e2e/support/backend-only-stubs.ts`
  - `tests/e2e/support/auth-session.ts`

## 3. Playwright “unit/spec”

- Fato observado:
  - há muitos arquivos `tests/unit/**/*.spec.ts` usando `@playwright/test` como runner Node-style para contratos e serviços.
- Exemplo:
  - `tests/unit/integration-guide-contracts.spec.ts`
  - `tests/unit/auth-session-context.spec.ts`
  - `tests/unit/network-subdomain.spec.ts`

## Suites principais

### Acessibilidade e componentes

- `tests/a11y/*.a11y.test.tsx`
- `tests/components/*.test.tsx`
- Cobrem:
  - modais compartilhados
  - tabela paginada
  - badges, skeletons, topbar, sidebar

### Sessão, contexto e infra compartilhada

- `tests/session.test.ts`
- `tests/tenant-context.test.ts`
- `tests/unit/auth-session-context.spec.ts`
- `tests/unit/session-context-full.spec.ts`
- `tests/unit/network-subdomain.spec.ts`
- `tests/unit/system-health.test.ts`
- `tests/unit/env.test.ts`

### Contratos de API e adaptação de payload

- `tests/unit/integration-guide-contracts.spec.ts`
- `tests/unit/*-api.spec.ts`
- valor prático:
  - capturam normalização de payload
  - validam headers/query e compatibilidade local dos clientes HTTP

### Fluxos E2E operacionais

- `tests/e2e/sessao-multiunidade.spec.ts`
- `tests/e2e/comercial-fluxo.spec.ts`
- `tests/e2e/clientes-cadastro.spec.ts`
- `tests/e2e/crm-operacional.spec.ts`
- `tests/e2e/reservas-aulas.spec.ts`
- `tests/e2e/treinos-v2-editor.spec.ts`
- `tests/e2e/rbac.spec.ts`
- `tests/e2e/backoffice-*.spec.ts`
- `tests/e2e/onboarding-fluxo-completo.spec.ts`
- `tests/e2e/auth-rede.spec.ts`
- `tests/e2e/adesao-publica.spec.ts`
- `tests/e2e/route-taxonomy-smoke.spec.ts`

## Smoke pack e coverage governance

- Fonte de verdade documental:
  - `docs/TEST_COVERAGE_CORE.md`
  - `docs/TEST_COVERAGE_BASELINE.md`
  - `docs/TEST_COVERAGE_GOVERNANCE.md`
- Smoke pack obrigatório documentado:
  - `tests/e2e/sessao-multiunidade.spec.ts`
  - `tests/e2e/comercial-fluxo.spec.ts`
  - `tests/e2e/admin-financeiro-integracoes.spec.ts`
  - `tests/e2e/backoffice-global.spec.ts`
  - `tests/e2e/adesao-publica.spec.ts`
  - `tests/e2e/treinos-template-list.spec.ts`
  - `tests/e2e/treinos-v2-editor.spec.ts`
  - `tests/e2e/financeiro-admin.spec.ts`
  - `tests/e2e/reservas-aulas.spec.ts`
  - `tests/e2e/crm-operacional.spec.ts`
  - `tests/e2e/rbac.spec.ts`
  - `tests/e2e/bi-operacional.spec.ts`

## Comandos úteis

- `npm test`
  - roda só arquivos `*.test.ts(x)` no Vitest
- `npm run test:coverage`
  - cobertura Vitest
- `npm run e2e`
  - Playwright padrão
- `npm run test:e2e:smoke-real`
  - Playwright contra backend real
- `npm run coverage:unit`
- `npm run coverage:report`
- `npm run coverage:gate`

## Áreas bem representadas

- sessão/contexto/auth
- componentes compartilhados e a11y básica
- clientes/CRM/comercial
- backoffice e segurança
- jornada pública/storefront
- health/status
- taxonomia de rotas públicas, portal, backoffice e storefront

## Lacunas conhecidas

- Fato observado na documentação de cobertura:
  - o gate percentual atual mira `src/lib/**/*` no perfil `core`; `src/app` e `src/components` client-only ainda não entram com instrumentação confiável no gate.
- Fato observado:
  - vários arquivos grandes continuam com cobertura muito baixa, especialmente áreas pesadas de backoffice e páginas extensas de UI.
- Exemplos documentados:
  - `src/app/(backoffice)/admin/importacao-evo-p0/hooks/useEvoImportPage.ts`
  - `src/components/treinos/treino-v2-editor.tsx`
  - `src/app/(portal)/reservas/page.tsx`
- Fonte:
  - `docs/TEST_COVERAGE_BASELINE.md`
  - `docs/TEST_COVERAGE_CORE.md`
