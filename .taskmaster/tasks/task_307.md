# Task ID: 307

**Title:** Criar E2E spec — Admin backoffice (financeiro + segurança + operacional)

**Status:** done

**Dependencies:** 293 ✓

**Priority:** high

**Description:** Desenvolver um novo spec E2E para cobrir as páginas do backoffice administrativo, incluindo módulos financeiro, segurança, operacional, compliance e leads.

**Details:**

Criar o arquivo `tests/e2e/admin-backoffice-coverage.spec.ts`. Implementar testes para: 1. Admin financeiro: dashboards, cobranças, contratos, gateways, planos. 2. Admin segurança: overview, revisões. 3. Admin operacional: alertas, saúde. 4. Admin compliance: dashboard LGPD. 5. Admin leads: lista, detalhe, mudança de status. Mockar todos os endpoints das APIs administrativas relevantes (já usando TanStack Query) via `page.route`. Pseudo-código: `test('Admin finance dashboard loads', async ({ page }) => {
   await page.route('**/api/admin/financeiro/dashboard', route => route.fulfill({ status: 200, body: JSON.stringify({ 'totalFaturamento': 100000 }) }));
   await page.goto('/admin/financeiro/dashboard');
   await expect(page.locator('text=Visão Geral Financeira')).toBeVisible();
   await expect(page.locator('text=R$100.000,00')).toBeVisible();
 });`

**Test Strategy:**

Executar o spec `admin-backoffice-coverage.spec.ts`. Validar a renderização e interação com os diferentes módulos do backoffice administrativo. Assegurar que os dados mockados são exibidos corretamente e que as ações (ex: mudança de status de lead) são refletidas na UI. Foco na cobertura de UI/UX para estas áreas.
