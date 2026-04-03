# Task ID: 343

**Title:** Corrigir buckets Playwright do app autenticado e jornada de clientes

**Status:** done

**Dependencies:** 3 ✓, 338 ✓, 339 ✓, 340 ✓, 341 ✓, 342 ✓

**Priority:** high

**Description:** Ajustar os testes E2E dos buckets clientes-cadastro, clientes-exclusao-controlada, clientes-url-state, clientes-context-recovery, clientes-migracao-unidade, clientes-nfse, comercial-fluxo e onboarding-fluxo-completo para ficarem verdes.

**Details:**

1.  **Revisar Falhas:** Analisar as falhas reportadas na Task 340 especificamente para os seguintes buckets do Playwright localizados em `tests/e2e/`:
    *   `clientes-cadastro.spec.ts`
    *   `clientes-exclusao-controlada.spec.ts`
    *   `clientes-url-state.spec.ts`
    *   `clientes-context-recovery.spec.ts`
    *   `clientes-migracao-unidade.spec.ts`
    *   `clientes-nfse.spec.ts`
    *   `comercial-fluxo.spec.ts`
    *   `onboarding-fluxo-completo.spec.ts`
2.  **Contrato de Contexto e Navegação Pós-login:**
    a.  **Contexto:** Garantir que os testes respeitem e simulem corretamente a lógica de contexto da aplicação (ex: `AcademiaContext`, `UnidadeContext`), conforme estabelecido na Task 3.
    b.  **Navegação:** Validar que a navegação pós-login para as áreas de cliente e comercial está robusta, verificando redirecionamentos (`page.waitForURL`), estados da URL e a inicialização correta dos módulos após a autenticação. Verificar se o `storageState` está sendo corretamente utilizado e persistido entre os testes.
3.  **Payloads/Mocks de Cliente:**
    a.  **Mocks:** Auditar e corrigir os mocks de API relacionados a clientes (ex: `/api/v1/clientes/*`, `/api/v1/usuarios/*`) localizados em `tests/e2e/support/backend-only-stubs.ts` ou arquivos de mock específicos, garantindo que os contratos das APIs são respeitados.
    b.  **Payloads:** Assegurar que os payloads de resposta dos mocks refletem o contrato atual da API e fornecem dados consistentes e completos para os testes de UI, cobrindo cenários de sucesso e falha.
4.  **Estabilidade dos Fluxos CRUD/Publicação:**
    a.  **Interação UI:** Revisar os passos dos testes para fluxos complexos como cadastro, edição, exclusão controlada, migração de unidade e fluxos de NFSe e comercial. Corrigir seletores (`locators`), garantir que os awaits adequados (`page.waitForSelector`, `page.waitForLoadState('networkidle')`, `page.waitForResponse`) sejam utilizados para evitar condições de corrida.
    b.  **Assertions:** Ajustar quaisquer `expect` assertions que não correspondam mais ao comportamento esperado da UI ou aos dados mockados.
5.  **Detecção de Regressões:** Investigar se as correções realizadas nas Tasks 338 e 339 impactaram a estabilidade desses fluxos e ajustar conforme necessário.

**Test Strategy:**

1.  **Execução Individual:** Executar os testes Playwright individualmente para cada um dos buckets listados:
    *   `npx playwright test tests/e2e/clientes-cadastro.spec.ts`
    *   `npx playwright test tests/e2e/clientes-exclusao-controlada.spec.ts`
    *   `npx playwright test tests/e2e/clientes-url-state.spec.ts`
    *   `npx playwright test tests/e2e/clientes-context-recovery.spec.ts`
    *   `npx playwright test tests/e2e/clientes-migracao-unidade.spec.ts`
    *   `npx playwright test tests/e2e/clientes-nfse.spec.ts`
    *   `npx playwright test tests/e2e/comercial-fluxo.spec.ts`
    *   `npx playwright test tests/e2e/onboarding-fluxo-completo.spec.ts`
2.  **Passagem Total:** Todos os testes dentro dos buckets especificados devem passar (status 'green').
3.  **Verificação de Logs:** Monitorar os logs do console do navegador e do terminal do Playwright durante a execução para identificar erros de runtime, avisos ou falhas de requisição de rede que possam indicar problemas não capturados diretamente pelas assertions.
4.  **Funcionalidade:** Confirmar que a navegação, submissão de formulários, exibição e manipulação de dados relacionados a clientes e fluxos comerciais funcionam conforme o esperado em todos os cenários de teste.
