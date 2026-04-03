# Task ID: 350

**Title:** Corrigir falhas Playwright do backoffice global e financeiro

**Status:** done

**Dependencies:** 338 ✓, 339 ✓, 341 ✓, 342 ✓, 348 ✓

**Priority:** high

**Description:** Resolver falhas persistentes nos testes Playwright E2E para os módulos do backoffice global e financeiro, cobrindo admin coverage, CRUD global, catálogo, financeiro operacional, segurança, impersonation, BI e importação EVO, com foco no alinhamento de contratos de UI e stubs do shell global.

**Details:**

Esta tarefa visa estabilizar e refinar os testes Playwright E2E para as áreas críticas do backoffice global e financeiro. Com base no relatório de revalidação de testes (Task 348) e nos esforços anteriores de correção (Tasks 338, 339, 341, 342), o foco será em:

1.  **Análise de Falhas:** Revisar as falhas identificadas no relatório da Task 348 que se referem aos arquivos de teste em `tests/e2e/` relacionados a `admin-coverage.spec.ts`, `admin-backoffice-global-crud.spec.ts`, `admin-catalogo-crud.spec.ts`, `backoffice-financeiro-operacional-crud.spec.ts`, `backoffice-seguranca.spec.ts`, `backoffice-impersonation.spec.ts`, `bi-operacional.spec.ts` e `admin/importacao-evo-p0/page.tsx`, `backoffice-financeiro-integracoes.spec.ts`.
2.  **Alinhamento de Contratos de UI:** Para cada fluxo falho, auditar a interação entre a interface de usuário e as APIs. Garantir que os componentes de frontend estejam fazendo as chamadas corretas, com os payloads esperados, e que estejam interpretando as respostas do backend conforme o contrato atual.
3.  **Refinamento de Stubs do Shell Global:** Revisar e ajustar `tests/e2e/support/backend-only-stubs.ts` e outros arquivos de stubbing para garantir que os mocks das APIs financeiras e globais (ex: `/api/v1/admin/...`) reflitam precisamente o comportamento atual do backend, incluindo cenários de sucesso, erro, validação, paginação e diferentes permissões de usuário (admin, operador, etc.). Prestar atenção especial a contratos de dados e esquemas de resposta.
4.  **Cobertura Específica:**
    *   **Admin Coverage e CRUD Global:** Validar operações CRUD para entidades globais e a navegação/exibição em telas de cobertura administrativa.
    *   **Catálogo:** Assegurar a estabilidade das operações de criação, leitura, atualização e exclusão de itens de catálogo.
    *   **Financeiro Operacional:** Testar fluxos de transações, relatórios e configurações financeiras.
    *   **Segurança e Impersonation:** Verificar permissões, acesso baseado em regras e o funcionamento da funcionalidade de impersonation em diversos módulos.
    *   **BI:** Garantir que os dashboards e relatórios de Business Intelligence carreguem e exibam dados corretamente.
    *   **Importação EVO:** Validar o fluxo de importação, exibição de status, tratamento de erros e consistência de dados após a importação. Reassegurar que a integração com o shell global não gere regressões.
5.  **Robustez contra Falhas Intermitentes:** Priorizar a identificação e correção de falhas que ocorrem de forma não determinística, utilizando ferramentas de depuração do Playwright para entender o estado da aplicação e do DOM no momento da falha.

**Test Strategy:**

1.  **Execução Detalhada:** Rodar os testes Playwright para cada bucket afetado individualmente, utilizando `npx playwright test <caminho/do/arquivo/de/teste.spec.ts> --headed` para depuração visual.
2.  **Verificação de Contratos:** Para cada correção, inspecionar as requisições de rede feitas pelos testes Playwright (via `page.route` ou logs) para garantir que os contratos de UI/API estejam sendo respeitados, tanto para o frontend quanto para os stubs.
3.  **Ambientes Múltiplos:** Testar em diferentes configurações de ambiente (ex: com stubs ativados e desativados, se aplicável, e contra um backend real em ambiente de staging) para identificar discrepâncias.
4.  **Impersonation e Permissões:** Executar testes críticos sob diferentes perfis de usuário (admin, operador, com e sem impersonation) para verificar que as regras de segurança e acesso continuam válidas.
5.  **Regressão:** Após as correções, executar um ciclo completo dos testes de backoffice global e financeiro para garantir que nenhuma nova regressão foi introduzida nas áreas já estabilizadas. A validação final será com todos os testes Playwright dos escopos mencionados passando consistentemente em múltiplos runs, sem falhas intermitentes.
