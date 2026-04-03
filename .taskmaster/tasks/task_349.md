# Task ID: 349

**Title:** Corrigir falhas Playwright do shell operacional e app autenticado

**Status:** done

**Dependencies:** 3 ✓, 332 ✓, 333 ✓, 348 ✓

**Priority:** high

**Description:** Resolver as falhas dos testes Playwright E2E para o shell operacional e app autenticado, cobrindo as áreas de dashboard, clientes, comercial, CRM, operação e navegação mobile.

**Details:**

Esta tarefa visa estabilizar os testes Playwright nos fluxos críticos do backoffice e do aplicativo autenticado. Com base na revalidação do relatório de testes (Task 348) e na estabilização dos fluxos de autenticação (Tasks 332, 333) e multiunidade (Task 3), o foco será em:

1.  **Bootstrap de Sessão:** Revisar a lógica de `tests/e2e/support/auth-utils.ts` e `tests/e2e/support/backend-only-stubs.ts` para garantir que o bootstrap da sessão para usuários autenticados (operador, admin, etc.) seja robusto e consistente, especialmente para cenários de multiunidade e troca de contexto.
2.  **Seletores (Selectors):** Auditar os seletores usados nos testes Playwright para os módulos mencionados (dashboard, clientes, comercial, CRM, operação). Corrigir seletores que estejam muito acoplados à implementação, usando `data-testid` ou classes CSS estáveis quando possível, em vez de IDs gerados dinamicamente ou estruturas DOM voláteis. Focar em arquivos como `tests/e2e/backoffice-dashboard.spec.ts`, `tests/e2e/backoffice-clientes.spec.ts`, `tests/e2e/backoffice-comercial.spec.ts`, `tests/e2e/backoffice-crm.spec.ts` e `tests/e2e/backoffice-operacional.spec.ts` (ou equivalentes que cubram essas áreas).
3.  **Mocks Protegidos:** Assegurar que os mocks de API definidos em `tests/e2e/support/backend-only-stubs.ts` e em arquivos de teste específicos estejam corretamente configurados e 'protegidos'. Isso significa que eles devem cobrir todos os endpoints relevantes para os fluxos testados, retornar dados consistentes com os contratos da API e não interferir com outras chamadas de rede que não deveriam ser mockadas. Implementar validações para garantir que os mocks estejam sendo aplicados corretamente.
4.  **Navegação Mobile:** Investigar e corrigir falhas relacionadas à navegação em dispositivos móveis ou viewports responsivos, com foco na estabilidade do layout e interações em cenários como `tests/e2e/layout-bottom-nav.spec.ts` (já coberto pela 344 mas precisa ser revisto em contexto). Simular diferentes tamanhos de tela (`page.setViewportSize`) e interagir com componentes específicos de UI mobile (ex: hambúrguer menu, bottom navigation).

**Escopo:** Abrange `tests/e2e/*` que cobrem os módulos citados e os fundamentos de autenticação/sessão.

**Test Strategy:**

1.  Executar os testes Playwright para cada bucket afetado individualmente, tanto em modo headless quanto headed para depuração (ex: `npx playwright test tests/e2e/backoffice-dashboard.spec.ts --headed`).
2.  Utilizar as ferramentas de inspeção do Playwright (`page.pause()`, Playwright Inspector) para identificar problemas de seletores e estados da UI.
3.  Verificar o tráfego de rede durante os testes para garantir que os mocks estejam sendo aplicados corretamente e que não há chamadas de API inesperadas ou falhas de rede.
4.  Rodar a suíte completa de testes `npx playwright test` para confirmar a estabilidade geral após as correções.
5.  Prestar atenção especial aos logs do console e de rede durante a execução dos testes para identificar erros de runtime ou warnings de API.
