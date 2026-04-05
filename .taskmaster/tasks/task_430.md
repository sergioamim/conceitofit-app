# Task ID: 430

**Title:** Estabilizar testes E2E flaky de navegação e timeouts específicos

**Status:** done

**Dependencies:** 111 ✓, 420 ✓, 327 ✓, 356 ✓, 416 ✓, 417 ✓, 418 ✓

**Priority:** medium

**Description:** Corrigir a intermitência de 8 testes E2E do Playwright que falham devido a timeouts de navegação (page.goto, waitForURL) e redirecionamentos incorretos após ações, focando na otimização de mocks e lógica de navegação da aplicação.

**Details:**

O problema central é um conjunto de testes E2E que são 'flaky', exigindo retries frequentes. Os problemas se dividem em duas categorias principais: timeouts de navegação e redirecionamentos incorretos. A meta é estabilizar os 8 testes identificados na descrição da tarefa.

**Test Strategy:**

1. **Isolar e repetir:** Executar cada um dos specs identificados como flaky individualmente (e.g., `npx playwright test tests/e2e/financeiro-admin.spec.ts --repeat-each 5 --workers 1`) para confirmar a intermitência e observar o comportamento.
2. **Debugging com traces:** Habilitar traces do Playwright (`playwright.config.ts` -> `trace: 'on-first-retry'`) e examinar os relatórios para cada falha, identificando o momento exato e a causa dos timeouts ou redirecionamentos inesperados.
3. **Verificação de mocks:** Para problemas relacionados a timeouts, temporariamente logar todas as requisições de rede (`page.on('request')`) durante a execução do teste para identificar endpoints com respostas lentas ou mocks ausentes. Confirmar que `tests/e2e/support/backend-only-stubs.ts` cobre todas as rotas necessárias para esses testes.
4. **Validação do fluxo da aplicação:** Para problemas de redirecionamento, navegar manualmente pela aplicação (via `npm run dev`) e executar as mesmas ações do teste para observar o caminho de navegação esperado e identificar discrepâncias na lógica da aplicação.
5. **Execução completa da suíte:** Após aplicar as correções, executar a suíte E2E completa (`npm run test:e2e`) várias vezes para garantir a estabilidade e que nenhuma nova regressão foi introduzida. Monitorar o pipeline de CI/CD para uma redução nas falhas de testes intermitentes para os specs afetados.
