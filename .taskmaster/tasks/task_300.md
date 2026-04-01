# Task ID: 300

**Title:** Criar E2E spec — Administrativo (funcionários, salas, horários)

**Status:** done

**Dependencies:** 299 ✓

**Priority:** high

**Description:** Desenvolver um novo spec E2E para cobrir as funcionalidades administrativas de gerenciamento de funcionários, salas, horários, produtos e formas de pagamento.

**Details:**

Criar o arquivo `tests/e2e/administrativo.spec.ts`. Implementar testes para: 1. Listagem, cadastro e edição de funcionários. 2. Listagem e criação de salas. 3. Configuração de grade de horários. 4. Listagem e criação de produtos. 5. Listagem de formas de pagamento. Mockar as APIs `listFuncionariosApi`, `createFuncionarioApi`, `listSalasApi`, `listHorariosApi`, `listProdutosApi`, `listFormasPagamentoApi` via `page.route`. Pseudo-código: `test('Employee management flow', async ({ page }) => {
   await page.goto('/admin/funcionarios');
   await page.locator('[data-testid="novo-funcionario-button"]').click();
   await page.fill('#funcionario-nome', 'Funcionario Teste');
   await page.click('button:text("Salvar")');
   await expect(page.locator('text=Funcionario Teste')).toBeVisible();
 });`

**Test Strategy:**

Executar o spec `administrativo.spec.ts`. Verificar se os formulários de cadastro e edição funcionam, se as listas são atualizadas corretamente e se os dados são persistidos via mocks. Garantir que a configuração de horários e a gestão de produtos e formas de pagamento funcionem.
