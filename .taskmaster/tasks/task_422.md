# Task ID: 422

**Title:** Corrigir loading state travado na tela de colaboradores (admin-unidade-base-equipe)

**Status:** done

**Dependencies:** 3 ✓, 342 ✓

**Priority:** high

**Description:** Resolver o problema de carregamento infinito na página de colaboradores (admin-unidade-base-equipe), onde o conteúdo principal não é renderizado e o seletor de unidade aparece vazio.

**Details:**

O teste `admin-unidade-base-equipe:21` (em `tests/e2e/admin-unidade-base-equipe.spec.ts`) falha devido a um loading state travado na página de cargos e funcionários da unidade. A página exibe 'Carregando base operacional de colaboradores...' indefinidamente, mesmo com a sidebar e outros elementos carregados. O seletor de unidade exibe 'Selecionar unidade', indicando que nenhuma unidade ativa está sendo resolvida.

Investigar os seguintes pontos:

1.  **Reprodução e Debugging:**
    *   Rodar o teste `tests/e2e/admin-unidade-base-equipe.spec.ts` com `--headed` e `--debug` para observar o comportamento da UI e a sequência de requisições de rede.
    *   Focar na rota `/admin/unidade/base-equipe`.

2.  **Verificação do Contexto da Unidade Ativa:**
    *   O problema 'Selecionar unidade' sugere que o `unitId` ou o contexto da unidade ativa não está sendo resolvido corretamente ou não está disponível antes da chamada da API de colaboradores.
    *   Analisar como a unidade ativa é obtida e passada para o componente principal (provavelmente `src/app/(backoffice)/admin/unidade/base-equipe/page.tsx` ou um componente filho).
    *   Verificar o uso de `useUnitContext` ou similar para garantir que o `unitId` esteja presente e seja válido quando a requisição de colaboradores é feita.

3.  **Inspeção das Requisições de API de Colaboradores:**
    *   Usar as ferramentas de rede do navegador (ou Playwright trace) para verificar se a requisição GET para `/api/v1/admin/unidade/{unitId}/colaboradores` (ou rota similar) está sendo feita.
    *   **Se a requisição não estiver sendo feita:** A causa pode ser a ausência do `unitId` ou uma lógica condicional incorreta impedindo o fetch.
    *   **Se a requisição estiver sendo feita:**
        *   Inspecionar o `unitId` no payload ou na URL da requisição. Ele deve corresponder à unidade esperada (ex: 'Unidade Barra').
        *   Verificar a resposta da API: status code (200 OK?), corpo da resposta (dados de colaboradores ou erro?).
        *   Confirmar se o mock de colaboradores em `tests/e2e/support/backend-only-stubs.ts` (ou similar) está configurado para retornar dados válidos para a `unitId` em questão.

4.  **Estado de Carregamento (`loading` state):**
    *   Rastrear o estado `loading` no componente principal e seus filhos. Identificar onde ele é definido como `true` e, crucialmente, onde ele deveria ser definido como `false` após a conclusão (ou falha) da requisição da API.
    *   Garantir que não há um `Promise` não resolvido, um erro silencioso, ou um `useEffect` com dependências incompletas que impeça o `loading` de ser atualizado.

5.  **Dependência Circular (menos provável, mas verificar):**
    *   Confirmar que o carregamento dos colaboradores não está inadvertidamente esperando por algum dado que, por sua vez, depende dos colaboradores para ser resolvido (ex: o seletor de unidade tentando popular com dados que dependem da unidade já selecionada).

**Arquivos Chave:**
*   `tests/e2e/admin-unidade-base-equipe.spec.ts`
*   `src/app/(backoffice)/admin/unidade/base-equipe/page.tsx` (e quaisquer componentes relacionados neste diretório)
*   `src/lib/context/unit-context.ts` (ou o local onde o contexto da unidade é definido)
*   `tests/e2e/support/backend-only-stubs.ts` (para mocks de API)

**Test Strategy:**

1.  **Reprodução da Falha:** Executar `npx playwright test tests/e2e/admin-unidade-base-equipe.spec.ts --grep='admin-unidade-base-equipe:21'` para confirmar que a falha persiste.
2.  **Verificação da Unidade Ativa:** Após o login e navegação para `/admin/unidade/base-equipe`, inspecionar o DOM para garantir que o seletor de unidade exiba o nome da unidade ativa (ex: 'Unidade Barra') e não 'Selecionar unidade'.
3.  **Monitoramento de Rede:** Usar as ferramentas de desenvolvedor para garantir que a requisição GET para `/api/v1/admin/unidade/{unitId}/colaboradores` (ou similar) seja feita com o `unitId` correto e retorne um status 200 OK com dados de colaboradores válidos.
4.  **Verificação da UI:** Confirmar que a página renderiza a listagem de colaboradores, incluindo os nomes esperados ('Lúcia Souza') e outras informações da unidade ('Unidade Barra').
5.  **Teste de Regressão:** Executar o conjunto completo de testes `tests/e2e/admin-unidade-base-equipe.spec.ts` para garantir que nenhuma outra funcionalidade foi afetada e que todos os cenários estão verdes.
