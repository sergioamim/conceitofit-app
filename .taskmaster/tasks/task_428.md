# Task ID: 428

**Title:** Corrigir redirecionamento pós-troca de senha forçada

**Status:** done

**Dependencies:** 421 ✓, 332 ✓

**Priority:** high

**Description:** Corrigir a falha no teste E2E onboarding-fluxo-completo.spec.ts onde, após a troca de senha forçada, a página permanece em /primeiro-acesso/trocar-senha?next=%2Fdashboard em vez de redirecionar para /dashboard.

**Details:**

O problema está localizado em src/components/auth/forced-password-change-flow.tsx, onde o router.replace() é chamado antes que o flag forcePasswordChangeRequired seja limpo da sessão, causando um re-redirecionamento indesejado.

1.  **Reprodução da Falha:** Executar o teste `tests/e2e/onboarding-fluxo-completo.spec.ts` para confirmar a falha no cenário de troca de senha forçada.
2.  **Análise de `src/components/auth/forced-password-change-flow.tsx`:**
    *   Inspecionar o componente `ForcedPasswordChangeFlow` para entender a sequência de chamadas para `changeForcedPasswordApi()` e `router.replace()`.
    *   O diagnóstico indica que `router.replace()` é invocado antes que o estado da sessão (especificamente o flag `forcePasswordChangeRequired`) seja atualizado para `false` ou removido. Isso cria uma condição de corrida onde o guard do componente ou a lógica de renderização ainda vê a necessidade de troca de senha, mantendo o usuário na página de primeiro acesso.
3.  **Investigação de `changeForcedPasswordApi()` em `src/lib/auth/auth.ts`:**
    *   Verificar se a função `changeForcedPasswordApi()` notifica corretamente o frontend (via um `AuthContext` ou mecanismo de sessão) sobre a conclusão da troca de senha e a remoção da necessidade de `forcePasswordChangeRequired`.
    *   Garantir que a resposta da API é processada de forma a invalidar/atualizar o estado da sessão local imediatamente após o sucesso.
4.  **Revisar a Lógica de Redirecionamento e Guards:**
    *   Analisar a lógica de guard presente em `forced-password-change-flow.tsx` ou em layouts/componentes pais que verificam o estado `forcePasswordChangeRequired`.
    *   A correção deve garantir que o flag `forcePasswordChangeRequired` seja **confirmadamente limpo da sessão** ANTES que `router.replace('/dashboard')` seja executado. Isso pode ser alcançado esperando por uma confirmação da atualização da sessão ou reestruturando a lógica para que o redirecionamento ocorra *apenas* quando a sessão indica explicitamente que a troca de senha forçada não é mais necessária. Pode ser necessário um `await` ou um callback dentro da lógica de `onSuccess` da chamada da API que atualiza a sessão.
5.  **Proposta de Correção:** Ajustar a lógica para que a atualização do estado da sessão (limpando `forcePasswordChangeRequired`) seja concluída e propagada antes que o redirecionamento com `router.replace('/dashboard')` seja acionado, resolvendo a condição de corrida.

**Test Strategy:**

1.  Executar o teste E2E específico `npx playwright test tests/e2e/onboarding-fluxo-completo.spec.ts` para verificar se o cenário de troca de senha forçada passa sem falhas e redireciona corretamente para `/dashboard`.
2.  Realizar um teste manual em ambiente de desenvolvimento: criar um usuário com senha forçada, efetuar o login, trocar a senha e observar se o redirecionamento final para `/dashboard` ocorre conforme o esperado.
3.  Verificar o estado da sessão (e.g., via ferramentas de desenvolvimento do navegador) após a troca de senha para confirmar que o flag `forcePasswordChangeRequired` não está mais presente ou tem o valor `false`.
4.  Confirmar que esta correção não introduz regressões em outros fluxos de login e redirecionamento, especialmente aqueles que envolvem o parâmetro `?next=` ou fluxos de primeiro acesso.
