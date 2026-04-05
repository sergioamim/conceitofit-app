# Task ID: 423

**Title:** Atualizar Seletores e Asserções de Testes E2E do Backoffice

**Status:** done

**Dependencies:** 333 ✓, 414 ✓

**Priority:** medium

**Description:** Corrigir testes E2E do backoffice que falham devido a seletores e asserções desatualizados em relação à interface de usuário atual, sem alterar a lógica ou visual da aplicação.

**Details:**

Vários testes E2E do backoffice estão falhando devido a mudanças na UI ou na estrutura de elementos, tornando seletores e asserções obsoletos. Esta tarefa foca na atualização estrita dos arquivos de teste (.spec.ts) para refletir o estado atual da UI.

Para cada um dos testes listados abaixo:
1.  **Revisar Logs de Falha e Snapshots:** Localizar o `error-context.md` ou artefatos de trace/screenshot gerados na falha do teste para entender o estado atual da UI no momento do erro.
2.  **Comparar com a UI Atual:** Inspecionar manualmente a aplicação no ambiente de desenvolvimento/staging para confirmar a estrutura e o conteúdo dos elementos da UI que o teste tenta interagir ou verificar.
3.  **Atualizar Seletores:** No arquivo `tests/e2e/*.spec.ts` correspondente, ajustar os seletores (ex: `page.locator()`, `getByText()`, `getByRole()`) para que apontem corretamente para os elementos da UI atual. Priorizar seletores robustos como `data-testid`, atributos semânticos ou texto visível, em vez de classes CSS voláteis.
4.  **Atualizar Asserções:** Modificar as asserções (`expect()`) para que correspondam ao texto, visibilidade, estado ou contagem de elementos esperados na UI atual.

**Testes afetados e pontos de atenção específicos:**
*   `admin-backoffice-global-crud.spec.ts` (linha 16): 'expect heading 'Sergio Amim' não encontrado.' - Verificar o fluxo de navegação até a página de detalhes e a localização exata do cabeçalho. Pode ser que a navegação para o detalhe tenha mudado ou o elemento foi realocado.
*   `backoffice-global.spec.ts` (linha 5): 'gerencia academias e unidades pelo fluxo principal (timeout/assertion).' - Investigar timeouts, que geralmente indicam seletores não encontrados ou elementos que não aparecem no tempo esperado. Focar na sequência de ações e estados da página.
*   `backoffice-impersonation.spec.ts` (linha 420): 'banner de impersonação e audit log (assertion failure).' - Validar a presença e o conteúdo do banner de impersonação e dos logs de auditoria.
*   `backoffice-seguranca-rollout.spec.ts` (linha 333): 'fila de revisões e exceção controlada (seletores desatualizados).' - Foco na atualização direta dos seletores para os elementos da fila de revisões.
*   `backoffice-seguranca.spec.ts` (linha 689): 'memberships, perfis e política, elegibilidade em unidades e onboarding (timeout + assertions).' - Problema abrangente, requer análise de múltiplos pontos de interação e verificação nessas seções.
*   `bi-operacional.spec.ts` (linha 505): 'visão unitária e rede com filtros gerenciais (seletores mudaram).' - Atualizar seletores para os elementos de filtro e exibição nas visões de BI.
*   `backoffice-entrar-como-academia.spec.ts` (linha 255): 'super user entra como unidade (flaky, elementos mudaram).' - Debugar a 'flakiness', que pode ser causada por condições de corrida ou elementos que aparecem/desaparecem rapidamente. Considerar o uso de `page.waitFor()` ou asserções mais resilientes.

**Test Strategy:**

1.  **Execução Individual:** Para cada arquivo `.spec.ts` modificado, execute-o individualmente (ex: `npx playwright test tests/e2e/admin-backoffice-global-crud.spec.ts`) para garantir que o teste passe de forma consistente.
2.  **Execução da Suíte Backoffice:** Após as correções individuais, execute a suíte completa de testes E2E relacionados ao backoffice para verificar se não foram introduzidas regressões ou se outros testes foram afetados indiretamente.
3.  **Análise de `error-context.md`:** Confirmar que, em caso de novas falhas (não esperadas), os novos `error-context.md` gerados fornecem informações precisas para depuração.
4.  **Revisão de Código:** Submeter as mudanças para revisão de código, com foco na robustez dos seletores e clareza das asserções, aderindo às melhores práticas de testes E2E com Playwright.
