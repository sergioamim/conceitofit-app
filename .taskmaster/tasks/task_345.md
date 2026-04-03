# Task ID: 345

**Title:** Corrigir testes Playwright dos buckets de Treinos, Reservas e Operacional

**Status:** done

**Dependencies:** 3 ✓, 340 ✓, 341 ✓, 342 ✓, 343 ✓, 344 ✓

**Priority:** medium

**Description:** Ajustar os testes E2E dos módulos 'treinos-template-list', 'treinos-v2-editor', 'treinos-web', 'treinos-atribuidos', 'reservas-aulas', 'operacional-grade-catraca' e 'crm-operacional' para ficarem verdes, estabilizando a trilha operacional.

**Details:**

1.  **Revisar Falhas:** Analisar os relatórios de falha do Playwright, especialmente aqueles gerados pela Task 340, que cobrem os seguintes buckets em `tests/e2e/`: 'treinos-template-list', 'treinos-v2-editor', 'treinos-web', 'treinos-atribuidos', 'reservas-aulas', 'operacional-grade-catraca' e 'crm-operacional'. Assumir que estes correspondem a arquivos de teste Playwright como `tests/e2e/treinos/treinos-template-list.spec.ts`, `tests/e2e/treinos/treinos-v2-editor.spec.ts`, `tests/e2e/treinos/treinos-web.spec.ts`, `tests/e2e/treinos/treinos-atribuidos.spec.ts`, `tests/e2e/reservas/reservas-aulas.spec.ts`, `tests/e2e/operacional/grade-catraca.spec.ts` e `tests/e2e/crm/operacional.spec.ts`.2.  **Mocks e Contratos de API:** Auditar `tests/e2e/support/backend-only-stubs.ts` e outros arquivos de stubbing para garantir que os mocks das APIs (e.g., para treinos, reservas, grade operacional, CRM) estejam alinhados com os contratos de API atuais. Verificar a estrutura dos dados retornados e os estados esperados em diferentes cenários.3.  **Interações de UI:** Corrigir seletores, asserções e fluxos de interação da interface do usuário que possam ter sido alterados. Prestar atenção especial a:    a.  **Visibilidade e Habilitação:** Garantir que elementos como botões, campos de entrada e tabelas estejam visíveis e interativos quando esperado.    b.  **Carregamento Assíncrono:** Ajustar esperas (`page.waitForSelector`, `page.waitForResponse`) para lidar com carregamentos assíncronos e evitar 'flaky tests'.    c.  **Navegação e Rotas:** Validar que as navegações entre as telas dos módulos de treinos, reservas e operacional funcionam conforme o esperado, incluindo parâmetros de URL e estados da rota.    d.  **Contexto Multiunidade:** Se aplicável (especialmente para `reservas-aulas` e `operacional-grade-catraca`), garantir que a troca de contexto de unidade seja corretamente tratada e os dados filtrados adequadamente.4.  **Dados de Teste e Fixtures:** Atualizar ou criar fixtures específicas em `tests/e2e/fixtures/` ou `tests/e2e/support/` para simular cenários mais realistas para treinos, reservas e operações.

**Test Strategy:**

1.  **Execução Individual dos Buckets:** Executar os testes Playwright para cada bucket afetado individualmente, garantindo que todos passem:    *   `npx playwright test tests/e2e/treinos/treinos-template-list.spec.ts`    *   `npx playwright test tests/e2e/treinos/treinos-v2-editor.spec.ts`    *   `npx playwright test tests/e2e/treinos/treinos-web.spec.ts`    *   `npx playwright test tests/e2e/treinos/treinos-atribuidos.spec.ts`    *   `npx playwright test tests/e2e/reservas/reservas-aulas.spec.ts`    *   `npx playwright test tests/e2e/operacional/grade-catraca.spec.ts`    *   `npx playwright test tests/e2e/crm/operacional.spec.ts`2.  **Execução Completa do Backoffice Operacional:** Após as correções individuais, executar um conjunto mais amplo de testes que inclua estes buckets (se houver um tag ou grupo), para validar que as correções não introduziram regressões em áreas relacionadas.3.  **Revisão de Relatórios:** Confirmar que o relatório de execução do Playwright mostra todos os testes nestes buckets como 'passed' e que não há novos 'flaky tests'.
