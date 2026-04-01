# Task ID: 294

**Title:** Criar E2E spec — Dashboard principal

**Status:** done

**Dependencies:** 293 ✓

**Priority:** high

**Description:** Desenvolver um novo spec E2E para cobrir a funcionalidade do Dashboard principal, incluindo renderização, cards de métricas, prospects e pagamentos pendentes, e navegação.

**Details:**

Criar o arquivo `tests/e2e/dashboard.spec.ts`. Implementar testes para: 1. Acessar a página do Dashboard. 2. Verificar a renderização dos cards de métricas (alunos ativos, receita, matrículas). 3. Validar a exibição de listas de prospects e pagamentos. 4. Testar a navegação para páginas de detalhe a partir do dashboard. Utilizar mocks para a API `getDashboardApi` para controlar os dados exibidos via `page.route` do Playwright. Pseudo-código: `test('Dashboard renders metrics and navigation', async ({ page }) => {
   await page.route('**/api/dashboard', route => route.fulfill({ status: 200, body: JSON.stringify({ 'totalAlunosAtivos': 100, 'receitaMensal': 50000, 'novasMatriculas': 10 }) }));
   await page.goto('/dashboard');
   await expect(page.locator('[data-testid="alunos-ativos-card"]')).toBeVisible();
   await page.locator('[data-testid="prospects-recentes-link"]').click();
   await expect(page).toHaveURL(/.*prospects/);
 });`

**Test Strategy:**

Executar o spec `dashboard.spec.ts` em modo headless e com UI para verificar a interação visual. Garantir que todos os elementos esperados são renderizados e que as navegações funcionam corretamente com os dados mockados.
