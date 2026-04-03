# Task ID: 351

**Title:** Corrigir falhas Playwright dos fluxos publicos e de autenticacao contextualizada

**Status:** done

**Dependencies:** 3 ✓, 164 ✓, 332 ✓, 333 ✓, 348 ✓

**Priority:** high

**Description:** Esta tarefa visa resolver as falhas de testes Playwright E2E nos fluxos de adesão pública, demo account, autenticação por rede, security-flows e onboarding completo, garantindo o correto bootstrap, redirecionamento e sincronização de tenant/rede.

**Details:**

Com base na revalidação dos relatórios de testes (Task 348) e nos esforços anteriores para estabilizar fluxos de autenticação (Tasks 332, 333) e multiunidade (Task 3), o foco desta tarefa será em:

1.  **Adesão Pública:** Revisar e estabilizar os cenários em `tests/e2e/adesao-publica.spec.ts`. Garantir que os mocks definidos em `tests/e2e/support/backend-only-stubs.ts` para `installPublicJourneyApiMocks` estejam alinhados com o runtime atual, cobrindo trial, cadastro, checkout e pendências.
2.  **Auth-Rede e Subdomínio:** Corrigir falhas em `tests/e2e/auth-rede.spec.ts`. Validar a função `buildHostBasedUrl` e as rotas `/app/[rede]/login`, `forgot-password` e `first-access` para que resolvam corretamente o contexto da rede via subdomínio/hostname e headers, evitando 404s ou carregamentos infinitos.
3.  **Demo Account:** Investigar a existência de fluxos e testes para 'demo account'. Se houver falhas, corrigir os cenários de criação/login e navegação como conta demo. Se inexistentes, avaliar a necessidade de criar um cenário básico de teste para este fluxo.
4.  **Security Flows:** Analisar e corrigir testes relacionados a fluxos de segurança (ex: reset de senha, primeiro acesso, autenticação de dois fatores se aplicável) que possam estar falhando. Consultar `tests/e2e/backoffice-seguranca.spec.ts` e arquivos relacionados.
5.  **Onboarding Completo:** Validar a jornada completa do usuário desde a adesão pública até o primeiro login e acesso ao dashboard. Isso envolve a sequência de `adesao-publica` seguida pela experiência de 'primeiro acesso' e configuração inicial.
6.  **Bootstrap, Redirect e Sincronização de Tenant/Rede:**
    *   **Bootstrap:** Assegurar que o bootstrap da sessão (`tests/e2e/support/auth-utils.ts`, `backend-only-stubs.ts`) funcione corretamente para usuários autenticados e fluxos públicos.
    *   **Redirect:** Verificar o correto funcionamento dos redirecionamentos pós-login/logout e em situações de troca de contexto, utilizando as correções da Task 164 (`src/lib/tenant/auth-redirect.ts`).
    *   **Sincronização de Tenant/Rede:** Garantir que a troca e resolução do contexto de academia/unidade/rede esteja estável, conforme estabelecido na Task 3, refletindo-se em todos os fluxos acima. Isso inclui validação de `tenantId` e `networkId` nos payloads e URLs.

**Test Strategy:**

1.  **Execução Focada:** Rodar os testes Playwright para cada arquivo `.spec.ts` afetado individualmente (ex: `npx playwright test tests/e2e/adesao-publica.spec.ts --headed`) para facilitar a depuração visual.
2.  **Validação de Rede:** Utilizar o Playwright Inspector e as ferramentas de rede do navegador para inspecionar requisições e respostas HTTP durante os testes, comparando os payloads mockados com os esperados pelo runtime.
3.  **Cobertura de Fluxos:** Garantir que todos os subfluxos (ex: trial, cadastro, checkout, pendências para adesão; login, forgot-password, first-access para auth-rede) estejam sendo percorridos sem falhas.
4.  **Verificação de Contexto:** Confirmar que o `tenantId` e o `networkId` estão sendo corretamente resolvidos e mantidos no contexto da aplicação e nas URLs durante a navegação e após os redirecionamentos.
5.  **Teste de Regressão:** Após as correções, executar novamente os testes completos relacionados a auth-rede, adesão pública e onboarding para garantir que nenhuma regressão foi introduzida.
