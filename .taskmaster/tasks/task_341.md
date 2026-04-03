# Task ID: 341

**Title:** Corrigir testes Playwright dos buckets financeiros

**Status:** done

**Dependencies:** 337 ✓, 340 ✓

**Priority:** high

**Description:** Ajustar os testes E2E dos módulos financeiros admin-financeiro-integracoes, admin-financeiro-operacional-crud, financeiro-admin e billing-config para ficarem verdes, corrigindo mocks, contratos e fluxos de UI.

**Details:**

1.  Revisar as falhas identificadas na Task 340 relacionadas aos buckets `tests/e2e/backoffice-financeiro-integracoes.spec.ts`, `tests/e2e/backoffice-financeiro-operacional-crud.spec.ts`, `tests/e2e/billing-config.spec.ts` e quaisquer outros testes em `tests/e2e/` que cubram `admin/financeiro`.
2.  Para cada falha:
    a.  **Mocks e Contratos:** Auditar `tests/e2e/support/backend-only-stubs.ts` e outros arquivos de stubbing para garantir que os mocks das APIs financeiras (ex: `/api/v1/admin/financeiro/*`, `/api/v1/billing/*`) reflitam os contratos e payloads mais recentes do backend. Corrigir incompatibilidades.
    b.  **Fluxos de UI:** Navegar manualmente pelas telas em `src/app/(backoffice)/admin/financeiro/` e `src/app/(backoffice)/admin/billing/` para reproduzir os cenários de teste e identificar desvios no comportamento da interface (ex: elementos não encontrados, estados de carregamento infinito, crashes).
    c.  **Payloads e Lógica Frontend:** Garantir que os dados manipulados no frontend correspondam aos tipos esperados pelos componentes e APIs. Corrigir `asserts` quebrados nos testes Playwright que não refletem o comportamento real esperado.
    d.  **Casos Específicos:**
        i.  Em `billing-config.spec.ts`, verificar especialmente os seletores de elementos e a lógica de verificação de webhooks e toasts, como já abordado na Task 337.
        ii. Para `admin-financeiro-integracoes` e `admin-financeiro-operacional-crud`, focar em cenários de listagem, CRUD (criação, leitura, atualização, exclusão) e interações específicas de cada integração/operação.
        iii. Para `financeiro-admin`, garantir que as rotas gerais de administração financeira (ex: relatórios, configurações globais) estejam estáveis.

**Test Strategy:**

1.  Executar os testes Playwright individualmente ou por tag para cada bucket financeiro:
    *   `npx playwright test tests/e2e/backoffice-financeiro-integracoes.spec.ts`
    *   `npx playwright test tests/e2e/backoffice-financeiro-operacional-crud.spec.ts`
    *   `npx playwright test tests/e2e/billing-config.spec.ts`
    *   Identificar e executar outros testes relevantes sob `tests/e2e/admin/financeiro/` se houver.
2.  Verificar que cada teste conclua com sucesso (fique "verde"), sem falhas de `assert`, carregamentos infinitos ou crashes.
3.  Confirmar que os fluxos de UI testados (navegação, preenchimento de formulários, interações) funcionam como esperado em um ambiente de desenvolvimento local.
