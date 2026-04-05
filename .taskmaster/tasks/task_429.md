# Task ID: 429

**Title:** Corrigir falha no teste E2E de recuperação de contexto de planos

**Status:** done

**Dependencies:** 3 ✓

**Priority:** medium

**Description:** Investigar e corrigir a falha no teste E2E 'recupera contexto operacional sem hydration overlay' em planos-context-recovery.spec.ts, onde o aplicativo não faz o retry da requisição de planos após a recuperação do contexto.

**Details:**

O teste `tests/e2e/planos-context-recovery.spec.ts` falha com `networkidle timeout` ao navegar para `/planos`. A sequência esperada é: 1) A primeira chamada a `/api/v1/comercial/planos` retorna 400 (contexto inválido); 2) O aplicativo deve fazer um `PUT /api/v1/context/unidade-ativa` para recuperar o contexto; 3) A segunda chamada a `/api/v1/comercial/planos` deve ser retentada e ter sucesso. A falha indica que o fluxo de recuperação de contexto ou o retry subsequente não está funcionando conforme o esperado nos componentes de planos.

1.  **Reprodução da Falha:** Executar o teste `npx playwright test tests/e2e/planos-context-recovery.spec.ts` para confirmar a falha específica.
2.  **Análise do Teste E2E e Mocks:** Examinar `tests/e2e/planos-context-recovery.spec.ts` para entender os mocks de rede configurados (especialmente para `/api/v1/comercial/planos` e `/api/v1/context/unidade-ativa`) e as expectativas de interação com a UI.
3.  **Localização da Lógica de Fetch de Planos:** Identificar o componente ou hook no frontend responsável por buscar os dados de planos (ex: `src/app/(backoffice)/[slug]/planos/page.tsx`, `src/components/planos/PlanosList.tsx` ou um hook `usePlanos` que utilize `TanStack Query`).
4.  **Investigação do Mecanismo de Recuperação de Contexto:**
    *   Verificar o `apiClient` (provavelmente em `src/lib/api/axios-config.ts` ou similar) por interceptores que tratem erros HTTP 400 ou 401 que sinalizem um contexto inválido.
    *   Localizar a lógica que dispara a chamada `PUT /api/v1/context/unidade-ativa`. Isso deve residir em um serviço ou hook que gerencia o estado da unidade ativa e o contexto global (ex: `src/hooks/useUnidadeContext.ts` ou `src/lib/context/UnidadeContext.tsx`).
5.  **Verificação do Retry e Invalidação da Query:**
    *   O ponto crucial é garantir que, após o sucesso da chamada de `PUT` para recuperação do contexto, a query de planos (que falhou inicialmente) seja invalidada e retentada automaticamente. Se `TanStack Query` estiver sendo usado, isso pode exigir uma chamada explícita a `queryClient.invalidateQueries(['planos'])` ou `queryClient.refetchQueries` no momento correto após a atualização do contexto.
    *   Investigar se o estado do aplicativo impede o retry ou se há algum bloqueio que mantém a UI em um estado de espera indefinido, causando o `networkidle timeout`.
6.  **Correção:** Implementar a lógica necessária para garantir que a recuperação do contexto seja acionada corretamente e que a requisição de dados de planos seja retentada com o contexto atualizado, resolvendo assim o `timeout`.

**Test Strategy:**

1.  Executar `npx playwright test tests/e2e/planos-context-recovery.spec.ts` em modo `headed` (`--headed`) e com `trace` para depurar visualmente o fluxo, observar as requisições de rede e os estados da UI.
2.  Confirmar que o teste passa sem falhas de `timeout` após a aplicação das correções.
3.  (Opcional) Realizar um teste manual em ambiente de desenvolvimento, simulando um contexto inválido (via manipulação de localStorage ou mock de API) na página de planos e verificando se o fluxo de recuperação e retry funciona corretamente, levando à exibição dos dados de planos.
