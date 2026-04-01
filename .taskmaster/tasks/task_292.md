# Task ID: 292

**Title:** Integrar E2E existentes ao smoke suite — lote 2 (médio impacto)

**Status:** done

**Dependencies:** 291 ✓

**Priority:** high

**Description:** Adicionar os 7 specs E2E de médio impacto na cobertura ao array SMOKE_E2E_SPECS.

**Details:**

Continuar editando `scripts/playwright-coverage.mjs` e adicionar os seguintes specs: `tests/e2e/billing-config.spec.ts`, `tests/e2e/security-flows.spec.ts`, `tests/e2e/backoffice-seguranca.spec.ts`, `tests/e2e/backoffice-seguranca-governanca.spec.ts`, `tests/e2e/backoffice-seguranca-rollout.spec.ts`, `tests/e2e/backoffice-configuracoes.spec.ts`, `tests/e2e/backoffice-importacao-evo.spec.ts`. Pseudo-código: `// Adicionar ao SMOKE_E2E_SPECS 
 'tests/e2e/billing-config.spec.ts',
 'tests/e2e/security-flows.spec.ts',
 // ... demais specs`

**Test Strategy:**

Verificar a execução bem-sucedida de cada novo spec adicionado. Rodar `npm run coverage:report` e validar o aumento da cobertura de linhas.
