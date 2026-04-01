# Task ID: 297

**Title:** Criar E2E spec — Grade de aulas + Atividades

**Status:** done

**Dependencies:** 296 ✓

**Priority:** high

**Description:** Desenvolver um novo spec E2E para cobrir a visualização da grade semanal de aulas e a listagem de atividades, incluindo filtros.

**Details:**

Criar o arquivo `tests/e2e/grade-atividades.spec.ts`. Implementar testes para: 1. Acessar a página da grade de aulas. 2. Verificar a renderização da grade semanal e a exibição das aulas. 3. Aplicar filtros por modalidade e instrutor. 4. Acessar a listagem de atividades e verificar a exibição. Mockar as APIs `getGradeApi`, `listAtividadesApi` via `page.route`. Pseudo-código: `test('Class schedule filtering', async ({ page }) => {
   await page.route('**/api/grade', route => route.fulfill({ status: 200, body: JSON.stringify([{ id: 'yoga-class', title: 'Yoga', instructor: 'Maria' }]) }));
   await page.goto('/grade-aulas');
   await page.selectOption('[data-testid="modalidade-filter"]', 'Yoga');
   await expect(page.locator('.aula-card:not(:has-text("Yoga"))')).not.toBeVisible();
 });`

**Test Strategy:**

Executar o spec `grade-atividades.spec.ts`. Validar que a grade carrega corretamente, os filtros funcionam como esperado, e que as atividades são listadas sem erros. Testar diferentes combinações de filtros com dados mockados.
