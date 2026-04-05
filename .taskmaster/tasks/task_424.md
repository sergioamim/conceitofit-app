# Task ID: 424

**Title:** Estabilizar testes E2E do fluxo de criação de conta demo e testes adjacentes intermitentes

**Status:** done

**Dependencies:** 416 ✓, 111 ✓, 327 ✓

**Priority:** medium

**Description:** Corrigir a instabilidade dos testes E2E relacionados ao formulário de criação de conta de demonstração e outros testes intermitentes, focando em problemas de renderização, validação e redirecionamento pós-submissão.

**Details:**

O foco desta tarefa é resolver a natureza 'flaky' de múltiplos testes E2E, com especial atenção aos do fluxo de `demo-account`. As principais áreas a serem investigadas e corrigidas são:

1.  **Diagnóstico da renderização e validação do formulário de demo-account:**
    *   Investigar a causa da falha intermitente da asserção `'toBeVisible'` para mensagens de erro de validação (testes 252 e 263). Assegurar que o formulário RHF+Zod em `/demo/criar-conta` seja renderizado de forma estável no ambiente de teste mock. Verificar se o componente do formulário em `src/app/demo/criar-conta/page.tsx` (ou similar) não possui condições de corrida na renderização das mensagens de validação.
    *   Garantir que os seletores do Playwright para as mensagens de erro (e.g., elementos com `role='alert'` ou `data-testid='validation-error'`) sejam robustos e que o Playwright aguarde a sua visibilidade completa com `expect(page.locator('[data-testid="validation-error-message"]').first()).toBeVisible();`.

2.  **Estabilização do redirecionamento pós-submissão:**
    *   Analisar a falha intermitente do teste 274, que lida com o redirecionamento para `/dashboard?demo=1` após a submissão bem-sucedida da conta demo. Investigar possíveis condições de corrida entre a submissão do formulário, a resposta da API (que pode ser mockada usando `page.route` no `tests/e2e/demo-account.spec.ts`) e o redirecionamento do roteador Next.js (`router.push`).
    *   Implementar a espera adequada para navegação, por exemplo, usando `await Promise.all([page.waitForURL('/dashboard?demo=1'), page.locator('button[type="submit"]').click()])` ou `await page.waitForNavigation()` com o destino esperado.

3.  **Aplicação de estratégias de estabilização a outros testes 'flaky' adjacentes:**
    *   Estender as técnicas de estabilização (como `page.waitForSelector`, `page.waitForLoadState('networkidle')` quando apropriado, e asserções robustas de visibilidade) aos seguintes testes identificados como intermitentes:
        *   `reservas-aulas:15`
        *   `rbac:483`
        *   `planos-context-recovery:149`
        *   `sessao-multiunidade:221`
        *   `comercial-smoke-real:369`
    *   Para cada um, identificar o ponto de instabilidade (e.g., elemento não visível, redirecionamento incompleto, API call demorada) e aplicar o `waitFor` ou a asserção apropriada.

4.  **Revisão do arquivo de teste `tests/e2e/demo-account.spec.ts`:** Garantir que o setup do teste, mocks de API e interações estejam alinhados com as melhores práticas do Playwright para evitar flakiness.

    *   Verificar o uso de `data-testid` para seletores em vez de seletores CSS/XPath que podem ser mais frágeis.
    *   Garantir que as interações do usuário (digitação, cliques) sejam precedidas por esperas de visibilidade ou habilitadas para evitar interações com elementos que ainda não estão prontos.

**Test Strategy:**

1.  Executar o arquivo `tests/e2e/demo-account.spec.ts` isoladamente e repetidamente (e.g., `npx playwright test tests/e2e/demo-account.spec.ts --repeat-each 10 --workers 1`) para confirmar a estabilidade dos testes 233, 242, 252, 263, 274, 289 e 299.
2.  Executar os testes adjacentes específicos que foram corrigidos (e.g., `npx playwright test tests/e2e/reservas-aulas.spec.ts --grep '15'` se a ID corresponder a um bloco `test.only`). Repetir várias vezes para verificar a estabilidade.
3.  Executar a suíte completa de testes E2E (`npm run test:e2e`) para verificar se as correções não introduziram regressões e se a taxa de falhas gerais diminuiu, com atenção especial aos testes mencionados.
4.  Monitorar o pipeline de CI/CD para observar a taxa de falhas dos testes afetados durante múltiplos runs após a implementação e deployment.
