# Task ID: 293

**Title:** Integrar E2E existentes ao smoke suite — lote 3 (complementar)

**Status:** done

**Dependencies:** 292 ✓

**Priority:** high

**Description:** Adicionar os 17 specs E2E restantes ao array SMOKE_E2E_SPECS, garantindo que todos os 39 specs existentes contribuam para a cobertura.

**Details:**

Completar a adição dos specs restantes em `scripts/playwright-coverage.mjs`: `tests/e2e/clientes-context-recovery.spec.ts`, `tests/e2e/clientes-exclusao-controlada.spec.ts`, `tests/e2e/clientes-migracao-unidade.spec.ts`, `tests/e2e/clientes-nfse.spec.ts`, `tests/e2e/clientes-url-state.spec.ts`, `tests/e2e/demo-account.spec.ts`, `tests/e2e/auth-rede.spec.ts`, `tests/e2e/admin-backoffice-global-crud.spec.ts`, `tests/e2e/admin-catalogo-crud.spec.ts`, `tests/e2e/admin-config-api-only.spec.ts`, `tests/e2e/admin-financeiro-operacional-crud.spec.ts`, `tests/e2e/admin-unidade-base-equipe.spec.ts`, `tests/e2e/app-multiunidade-contrato.spec.ts`, `tests/e2e/layout-bottom-nav.spec.ts`, `tests/e2e/operacional-grade-catraca.spec.ts`, `tests/e2e/planos-context-recovery.spec.ts`, `tests/e2e/treinos-web.spec.ts`, `tests/e2e/treinos-atribuidos.spec.ts`. Pseudo-código: `// Adicionar os 17 specs restantes ao SMOKE_E2E_SPECS`

**Test Strategy:**

Confirmar que todos os 39 specs E2E presentes no projeto (`tests/e2e/*.spec.ts`) estão agora incluídos no `SMOKE_E2E_SPECS`. Executar o suite completo de cobertura (`npm run coverage:report`) e validar o aumento total da cobertura.
