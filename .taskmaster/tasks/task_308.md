# Task ID: 308

**Title:** Expandir smoke suite com cenários de erro e edge cases

**Status:** done

**Dependencies:** 300 ✓, 307 ✓

**Priority:** high

**Description:** Adicionar testes de cenários negativos e de borda aos specs E2E existentes no smoke suite, cobrindo falhas de API, sessões expiradas, dados vazios, validações e permissões negadas.

**Details:**

Revisar os specs já integrados ao smoke suite (e.g., `financeiro-admin.spec.ts`, `dashboard.spec.ts`, etc.) e adicionar blocos de teste para: 1. Simular timeout ou erro de API (status 500) e verificar a exibição de mensagens de erro. 2. Simular sessão expirada (status 401/403) e verificar o redirecionamento para login. 3. Testar a renderização de 'empty states' quando dados estão vazios. 4. Validar mensagens de erro em formulários para entradas inválidas. 5. Testar o fallback ou exibição de mensagens de 'acesso negado' para permissões insuficientes. Pseudo-código: `test('API error handling', async ({ page }) => {
   await page.route('**/api/some-endpoint', route => route.fulfill({ status: 500 }));
   await page.goto('/some-page');
   await expect(page.locator('text=Ocorreu um erro inesperado')).toBeVisible();
 });`

**Test Strategy:**

Executar o smoke suite completo (`npm test -- --project=e2e`). Validar que os cenários de erro e borda são corretamente detectados e que a aplicação se comporta de forma resiliente e com feedback adequado ao usuário. Verificar se as mensagens de erro são claras e se os redirecionamentos de segurança funcionam.
