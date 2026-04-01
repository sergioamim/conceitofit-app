# Task ID: 296

**Title:** Criar E2E spec — Matrículas + Pagamentos

**Status:** done

**Dependencies:** 295 ✓

**Priority:** high

**Description:** Desenvolver um novo spec E2E para cobrir as funcionalidades de listagem e gerenciamento de matrículas e pagamentos, incluindo cancelamento e emissão em lote.

**Details:**

Criar o arquivo `tests/e2e/matriculas-pagamentos.spec.ts`. Implementar testes para: 1. Acessar a página de matrículas, verificar lista e filtros, e warnings de expiração. 2. Testar o cancelamento de uma matrícula. 3. Acessar a página de pagamentos, verificar lista e filtros. 4. Interagir com o modal 'Receber' para um pagamento. 5. Testar o fluxo de emissão em lote de pagamentos (`/pagamentos/emitir-em-lote`). Mockar as APIs `listMatriculasApi`, `cancelMatriculaApi`, `listPagamentosApi`, `receberPagamentoApi` via `page.route`. Pseudo-código: `test('Bulk payment emission', async ({ page }) => {
   await page.route('**/api/pagamentos/emitir-em-lote', route => route.fulfill({ status: 200 }));
   await page.goto('/pagamentos/emitir-em-lote');
   await page.check('input[type="checkbox"]');
   await page.click('button:text("Emitir Selecionados")');
   await expect(page.locator('text=Emissão concluída')).toBeVisible();
 });`

**Test Strategy:**

Executar o spec `matriculas-pagamentos.spec.ts` para verificar todos os fluxos. Validar a aplicação de filtros, a resposta visual a ações como cancelamento e recebimento, e a correta execução da emissão em lote. Mocks devem simular cenários de sucesso e falha.
