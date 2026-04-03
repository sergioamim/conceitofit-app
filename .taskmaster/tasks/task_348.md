# Task ID: 348

**Title:** Revalidar Relatório Playwright de 2026-04-02

**Status:** done

**Dependencies:** 324 ✓, 333 ✓

**Priority:** high

**Description:** Revalidar o relatório Playwright gerado em 2026-04-02, identificando e separando falhas 'stale' de falhas reais, e estabelecendo uma baseline de resíduos com evidências.

**Details:**

Esta tarefa envolve a análise profunda do relatório de testes Playwright datado de 2026-04-02. Primeiro, localizar o relatório específico no ambiente de relatórios do projeto. Em seguida, identificar os cenários de teste que resultaram em falhas ou instabilidades, com foco especial naqueles que se referem a `localhost:9323`. Rerodar esses cenários individualmente ou em grupos menores para verificar a consistência das falhas. Utilizar comandos como `npx playwright test <caminho/do/arquivo/de/teste.spec.ts> --project=chromium --headed` para rerodar, observando os fluxos cobertos por tarefas como 'Smoke test E2E' (Task 324) e 'Jornada pública de adesão' (Task 333).

Após as rerodadas, classificar as falhas:
1.  **Falhas 'Stale'**: Aquelas que não se reproduzem após a rerodagem, possivelmente devido a condições ambientais temporárias, intermitência de rede ou bugs já resolvidos.
2.  **Falhas Reais**: Aquelas que se reproduzem consistentemente e indicam problemas persistentes no código da aplicação.

Por fim, documentar uma 'baseline objetiva de resíduos'. Isso significa criar um documento (por exemplo, `docs/Playwright_Report_2026-04-02_Revalidation.md`) que categorize cada falha persistente (residue) e forneça evidências claras (screenshots, vídeos gerados pelo Playwright, logs). Cada 'bucket' de falhas deve ter suas evidências consolidadas, detalhando o contexto e a potencial causa-raiz.

**Test Strategy:**

A estratégia de teste para esta tarefa é predominantemente manual e de documentação. Primeiro, garantir que os cenários de teste identificados foram rerodados e seus resultados registrados. Validar que todas as falhas no relatório original foram analisadas e classificadas como 'stale' ou 'reais'. Confirmar a existência de um documento (`docs/Playwright_Report_2026-04-02_Revalidation.md`) que detalhe a revalidação, categorize as falhas reais ('resíduos') e inclua links ou referências para as evidências (screenshots/vídeos do Playwright). Os testes críticos, como o `tests/e2e/smoke-test.spec.ts` e `tests/e2e/adesao-publica.spec.ts`, devem ter seus estados de passagem/falha atualizados e documentados no relatório final após a revalidação.
