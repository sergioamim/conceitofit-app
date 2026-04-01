# Task ID: 295

**Title:** Criar E2E spec — Prospects lista + conversão

**Status:** done

**Dependencies:** 294 ✓

**Priority:** high

**Description:** Desenvolver um novo spec E2E para cobrir as funcionalidades de listagem de prospects, criação via modal, progressão de status e o fluxo de conversão (wizard).

**Details:**

Criar o arquivo `tests/e2e/prospects.spec.ts`. Implementar testes para: 1. Acessar a página de prospects e verificar a lista com filtros. 2. Abrir o modal de criação de prospect, preencher e salvar. 3. Alterar o status de um prospect (NOVO → CONTATADO → QUALIFICADO). 4. Iniciar e completar o wizard de conversão de prospect (`/prospects/[id]/converter`). Mockar as APIs `listProspectsApi`, `createProspectApi`, `updateProspectApi`, `convertProspectApi` usando `page.route`. Pseudo-código: `test('Prospect conversion flow', async ({ page }) => {
   await page.route('**/api/prospects', route => route.fulfill({ status: 200, body: JSON.stringify([{ id: '123', name: 'João', status: 'NOVO' }]) }));
   await page.goto('/prospects');
   await page.locator('[data-testid="novo-prospect-button"]').click();
   await page.fill('#prospect-name', 'Novo Prospect');
   await page.click('button:text("Salvar")');
   await page.goto('/prospects/123/converter');
   await page.click('button:text("Próximo")');
   // interact with wizard steps
 });`

**Test Strategy:**

Executar o spec `prospects.spec.ts` para validar o fluxo completo, desde a listagem até a conversão. Verificar mensagens de sucesso e erros, e o estado final dos dados após as interações. Assegurar que os mocks de API simulam os comportamentos esperados.
