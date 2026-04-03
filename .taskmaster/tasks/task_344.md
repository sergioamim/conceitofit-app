# Task ID: 344

**Title:** Corrigir Testes Playwright de Multiunidade, Contexto e Navegação Responsiva

**Status:** done

**Dependencies:** 3 ✓, 343 ✓

**Priority:** medium

**Description:** Ajustar os testes E2E do Playwright para os buckets 'sessao-multiunidade', 'app-multiunidade-contrato', 'planos-context-recovery' e 'layout-bottom-nav', garantindo a estabilidade da troca de unidade, recuperação de contexto e navegação mobile.

**Details:**

1.  Revisar falhas: Iniciar analisando os relatórios de falha dos buckets que cobrem 'sessao-multiunidade', 'app-multiunidade-contrato', 'planos-context-recovery' e 'layout-bottom-nav'. Assume-se que estes buckets correspondem a arquivos de teste Playwright como tests/e2e/multiunidade/sessao-multiunidade.spec.ts, tests/e2e/multiunidade/app-multiunidade-contrato.spec.ts, tests/e2e/planos/planos-context-recovery.spec.ts e tests/e2e/layout/layout-bottom-nav.spec.ts.
2.  Mocks e Contratos (Multiunidade/Contexto):
    *   Verificar tests/e2e/support/backend-only-stubs.ts e quaisquer outros arquivos de stubbing para endpoints de multiunidade (ex: /api/v1/admin/unidades, /api/v1/context/trocarUnidade) e planos (ex: /api/v1/planos). Assegurar que os dados mockados e os contratos de API reflitam o estado atual do backend.
    *   Especial atenção à persistência do contexto de unidade (e.g., localStorage.getItem('activeUnitId')) e à restauração da sessão após a troca ou login.
3.  Fluxos de UI (Multiunidade):
    *   No contexto de sessao-multiunidade e app-multiunidade-contrato, verificar fluxos de login, seleção de unidade e navegação entre diferentes unidades, assegurando que o URL state seja mantido corretamente (ex: /[unidadeId]/app/dashboard).
    *   Validar a transição de unidade através do componente src/components/shell/multiunidade-selector.tsx ou similar, e a atualização de permissões/menus.
4.  Recuperação de Contexto (Planos):
    *   Para planos-context-recovery, simular cenários de navegação direta para rotas de planos com e sem contexto pré-definido, verificando se o aplicativo consegue carregar o contexto correto ou redireciona adequadamente. Atenção a race conditions ou chamadas de API de contexto que falham.
5.  Navegação Responsiva (Shell Mobile):
    *   Para layout-bottom-nav, executar testes em viewports mobile (ex: page.setViewportSize({ width: 375, height: 667 })). Garantir que a barra de navegação inferior (ex: src/components/layout/bottom-nav.tsx ou elementos dentro de src/components/shell/mobile-shell.tsx) esteja visível e interativa, e que a navegação para as rotas corretas ocorra sem problemas. Verificar que o shell mobile se comporta conforme o esperado, sem elementos sobrepostos ou falhas de interação.

**Test Strategy:**

1.  Execução Individual dos Buckets: Executar os testes Playwright para cada bucket afetado individualmente, garantindo que todos passem:
    *   npx playwright test tests/e2e/multiunidade/sessao-multiunidade.spec.ts
    *   npx playwright test tests/e2e/multiunidade/app-multiunidade-contrato.spec.ts
    *   npx playwright test tests/e2e/planos/planos-context-recovery.spec.ts
    *   npx playwright test tests/e2e/layout/layout-bottom-nav.spec.ts
2.  Testes de Regressão: Após a conclusão, executar um conjunto mais amplo de testes Playwright que cobrem áreas de multiunidade e contexto (por exemplo, os testes de Task 343 se estiverem concluídos ou tags @multiunidade, @contexto, @mobile-shell) para garantir que as correções não introduziram regressões em funcionalidades relacionadas.
3.  Revisão de Código: Submeter o código para revisão por pares, com foco nas alterações nos arquivos de teste, mocks e quaisquer ajustes na lógica de UI ou contexto que possam ter sido necessários.
