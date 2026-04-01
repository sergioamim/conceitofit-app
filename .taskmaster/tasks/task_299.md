# Task ID: 299

**Title:** Criar E2E spec — Gerencial (DRE, contas a receber, BI)

**Status:** done

**Dependencies:** 298 ✓

**Priority:** high

**Description:** Desenvolver um novo spec E2E para cobrir as funcionalidades gerenciais, incluindo DRE, contas a receber, BI de rede e recebimentos.

**Details:**

Criar o arquivo `tests/e2e/gerencial.spec.ts`. Implementar testes para: 1. Visualização da DRE com seletor de período. 2. Listagem de contas a receber com filtros. 3. Visualização do BI de rede (visão multi-academia). 4. Listagem de recebimentos com filtros. Mockar as APIs `getDreApi`, `listContasReceberApi`, `getBiRedeApi`, `listRecebimentosApi` via `page.route`. Pseudo-código: `test('DRE period selection', async ({ page }) => {
   await page.route('**/api/dre', route => route.fulfill({ status: 200, body: JSON.stringify({ 'receitaTotal': 10000, 'despesasTotal': 5000 }) }));
   await page.goto('/gerencial/dre');
   await page.selectOption('[data-testid="periodo-selector"]', 'lastMonth');
   await expect(page.locator('text=Receita Total: R$10.000,00')).toBeVisible();
 });`

**Test Strategy:**

Executar o spec `gerencial.spec.ts`. Validar a correta exibição dos dados financeiros e gerenciais, a funcionalidade dos seletores de período e filtros, e a integridade dos dados mockados.
