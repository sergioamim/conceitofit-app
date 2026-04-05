# Task ID: 421

**Title:** Corrigir redirecionamento pós-login auth-rede (identifier contextualizado)

**Status:** done

**Dependencies:** 164 ✓, 332 ✓

**Priority:** high

**Description:** Resolver o problema de redirecionamento incorreto após login com identificador contextualizado em fluxos auth-rede, onde o usuário não é direcionado para /dashboard ou /first-access conforme esperado.

**Details:**

O problema surge ao fazer login com um identificador contextualizado (ex: ana@qa.local para Rede Norte), onde a URL permanece em /app/rede-norte/login?next=%2Fdashboard em vez de redirecionar. Isso também afeta o fluxo de primeiro acesso.

1.  **Investigar `src/app/(public)/app/[redeSlug]/login/`:**
    *   Analisar a lógica do handler de submissão do formulário de login para redes específicas. 
    *   Verificar como o parâmetro `?next=` é lido e utilizado para o redirecionamento. A função `resolvePostLoginPath` de `src/lib/tenant/auth-redirect.ts` (ou similar) é a provável candidata para processar este parâmetro.
    *   Assegurar que, após a autenticação bem-sucedida, a navegação é acionada corretamente. Pode ser um `router.push()` ou `redirect()` que não está sendo executado ou está sendo sobrescrito.

2.  **Mocks de Autenticação:**
    *   Revisar o mock de autenticação para `auth-rede` em `tests/e2e/support/backend-only-stubs.ts` ou arquivos relacionados. 
    *   Confirmar que o mock retorna o token/sessão esperado e que o contrato da resposta do backend permite o processamento correto pelo frontend, especialmente no que diz respeito a informações necessárias para redirecionamento (ex: necessidade de primeiro acesso).

3.  **Lógica de Redirecionamento:**
    *   Rastrear o fluxo de redirecionamento pós-login. O componente de login precisa ler o `next` parâmetro da URL e passá-lo para a lógica de redirecionamento.
    *   Verificar `src/lib/tenant/auth-redirect.ts` (conforme mencionado na Task 164) e `src/lib/auth.ts` para funções de manipulação de redirecionamento como `buildLoginHref` e `resolvePostLoginPath`. Pode haver um erro na interpretação do `next` ou na execução do redirecionamento.
    *   Considerar cenários de `first-access` onde um redirecionamento condicional deve ocorrer para `/app/[redeSlug]/first-access`.

4.  **Race Condition:**
    *   Investigar a possibilidade de uma condição de corrida onde o estado da sessão não é totalmente estabelecido antes que o redirecionamento seja tentado, ou vice-versa. 
    *   Pode ser necessário garantir que o token de sessão esteja persistido (e.g., em cookies/localStorage) e disponível *antes* de qualquer lógica de redirecionamento ser executada. 
    *   Utilizar `await` em operações assíncronas relacionadas à autenticação e ao set de sessão para garantir a ordem de execução.

**Test Strategy:**

1.  **Reprodução:** Rodar os testes `tests/e2e/auth-rede.spec.ts` (`auth-rede:263` e `auth-rede:391`) para confirmar a falha inicial.
2.  **Debugging:** Utilizar o Playwright em modo `headed` e com `trace` para depurar o fluxo de login e redirecionamento, observando as requisições de rede, estado do browser e logs do console.
    *   `npx playwright test tests/e2e/auth-rede.spec.ts --grep "@auth-rede-263|@auth-rede-391" --headed`
3.  **Verificação de Redirecionamento `/dashboard`:** Após a correção, garantir que o login com identificador contextualizado (ex: `ana@qa.local` na `Rede Norte` ou similar) redireciona com sucesso para `/dashboard`.
    *   O teste `auth-rede:263` deve passar, com `expect(page).toHaveURL(/.\/dashboard$/)`.
4.  **Verificação de Redirecionamento `/first-access`:** Assegurar que o login de um usuário que exige primeiro acesso (mockado para isso) redirecione para `/app/rede-norte/first-access`.
    *   O teste `auth-rede:391` deve passar, verificando a URL correta após o login.
5.  **Testes de Regressão:** Rodar o conjunto completo de testes `auth-rede.spec.ts` para garantir que a correção não introduziu novas regressões em outros cenários de autenticação por rede.
    *   `npx playwright test tests/e2e/auth-rede.spec.ts`
