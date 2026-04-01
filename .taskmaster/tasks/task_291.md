# Task ID: 291

**Title:** Integrar E2E existentes ao smoke suite — lote 1 (alto impacto)

**Status:** done

**Dependencies:** None

**Priority:** high

**Description:** Adicionar os 5 specs E2E de alto impacto na cobertura de src/lib ao array SMOKE_E2E_SPECS em scripts/playwright-coverage.mjs.

**Details:**

Editar o arquivo `scripts/playwright-coverage.mjs` e adicionar os seguintes caminhos de specs ao array `SMOKE_E2E_SPECS`: `tests/e2e/financeiro-admin.spec.ts`, `tests/e2e/reservas-aulas.spec.ts`, `tests/e2e/crm-operacional.spec.ts`, `tests/e2e/rbac.spec.ts`, `tests/e2e/bi-operacional.spec.ts`. Certificar-se de que cada spec executa com sucesso individualmente antes da integração. Pseudo-código: `// scripts/playwright-coverage.mjs 
 const SMOKE_E2E_SPECS = [
   'tests/e2e/financeiro-admin.spec.ts',
   'tests/e2e/reservas-aulas.spec.ts',
   'tests/e2e/crm-operacional.spec.ts',
   'tests/e2e/rbac.spec.ts',
   'tests/e2e/bi-operacional.spec.ts'
   // ... outros specs existentes
 ];`

**Test Strategy:**

Rodar individualmente cada spec (`npx playwright test tests/e2e/financeiro-admin.spec.ts`). Após a integração, executar `npm run coverage:report` e validar que a porcentagem de cobertura de linhas em `src/lib` aumentou.
