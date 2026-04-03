# Task ID: 346

**Title:** Executar Rerun Final da Suíte Playwright e Estabelecer Baseline 100% Verde

**Status:** done

**Dependencies:** 340 ✓, 341 ✓, 342 ✓, 343 ✓, 344 ✓, 345 ✓

**Priority:** high

**Description:** Realizar a execução completa da suíte de testes E2E do Playwright, garantindo que todos os testes passem, consolidar o relatório final e documentar a nova baseline sem resíduos pendentes.

**Details:**

1.  **Execução Completa da Suíte:** Após a conclusão de todas as tasks de correção de testes (340, 341, 342, 343, 344, 345), executar a suíte Playwright completa utilizando `npx playwright test`. É crucial que esta execução resulte em 100% dos testes passando ("verde").2.  **Verificação dos Buckets:** Confirmar que todos os buckets de testes mencionados nas tasks anteriores (financeiro, backoffice global, app autenticado/clientes, multiunidade/contexto, treinos/reservas/operacional) estão cobertos na execução e que não há falhas remanescentes.3.  **Consolidação do Relatório:** Gerar o relatório HTML do Playwright (`playwright show-report`) e consolidar os resultados. Criar um resumo detalhado em `docs/E2E_PLAYWRIGHT_FINAL_BASELINE.md` que inclua: Data e hora da execução; Versão do código-fonte (e.g., hash do commit); Screenshot do relatório Playwright (ou link para o artefato); Confirmação de 100% de sucesso; Lista de quaisquer observações, se houver, mas o objetivo é que esta lista esteja vazia.4.  **Remoção de Backlog Transitório:** Revisar qualquer backlog ou lista de "resíduos abertos" transitórios (e.g., Gists, tickets temporários, seções de "known issues" em documentos internos) que foram criados durante as fases de correção (como os mencionados na testStrategy da Task 340) e marcá-los como resolvidos/removidos, uma vez que a suíte esteja 100% verde.5.  **Atualização da Governança:** Atualizar, se necessário, `docs/TEST_COVERAGE_GOVERNANCE.md` com a nova realidade de estabilidade da suíte E2E, talvez adicionando um selo de "100% verde" para a baseline atual.

**Test Strategy:**

1.  Executar `npx playwright test` na branch principal para o ambiente de CI/QA.2.  Verificar que o comando retorna sucesso (exit code 0) e que o console ou log de CI reporta 100% de testes passando.3.  Acessar o relatório HTML gerado (`playwright-report/index.html`) e confirmar visualmente que não há falhas.4.  Validar a existência e o conteúdo do documento `docs/E2E_PLAYWRIGHT_FINAL_BASELINE.md`, garantindo que ele reflita a conclusão de 100% verde e que não há menções a resíduos abertos.5.  Confirmar que todos os backlogs transitórios ou listas de falhas foram limpos ou marcados como resolvidos.
