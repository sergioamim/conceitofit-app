# Task ID: 427

**Title:** Corrigir falha no teste E2E 'prospect vira cliente com matrícula' (comercial-smoke-real.spec.ts)

**Status:** done

**Dependencies:** None

**Priority:** high

**Description:** Investigar e corrigir a falha no teste E2E 'prospect vira cliente com matrícula' em 'comercial-smoke-real.spec.ts', que ocorre porque 'Conversao concluida, mas aluno/matricula/pagamento nao ficaram legiveis'. Após análise do OpenAPI do backend real (localhost:8080/api-docs), confirmou-se que o problema NÃO é um path mismatch nos endpoints, mas sim prováveis inconsistências no polling de artefatos pós-conversão (`resolveConvertedArtifacts`) ou no tratamento da resposta direta da API de conversão, especialmente em relação aos dados de pagamento.

**Details:**

O teste E2E 'prospect vira cliente com matrícula' no arquivo `tests/e2e/comercial-smoke-real.spec.ts` falha com a mensagem 'Conversao concluida, mas aluno/matricula/pagamento nao ficaram legiveis'. Uma investigação aprofundada da interação do teste com o backend real revelou novas pistas:

1.  **Reprodução e Análise Inicial:**
    *   Executar o teste específico `npx playwright test tests/e2e/comercial-smoke-real.spec.ts --grep "prospect vira cliente com matrícula" --headed` para observar o fluxo e a falha em tempo real.
    *   Utilizar as ferramentas de inspeção de rede do Playwright para capturar as requisições e respostas da API durante o processo de conversão do prospect.

2.  **Confirmação de Endpoints:**
    *   Após análise do OpenAPI do backend real (localhost:8080/api-docs), confirmou-se que os endpoints `/api/v1/crm/prospects/converter` e `/api/v1/academia/prospects/converter` coexistem como aliases no backend. O problema NÃO é uma discrepância de path no endpoint de conversão.

3.  **Análise Detalhada do Polling de Artefatos Pós-Conversão (`resolveConvertedArtifacts`):**
    *   **Dados de Pagamento:** Investigar se os campos `Pagamento.descricao` ou `Pagamento.dataVencimento` podem estar vindo `null` do backend na resposta da API ou durante o polling. Consultar a definição do DTO de resposta da conversão (e.g., `src/modules/academia/prospects/dtos/convert-prospect-response.dto.ts` ou interfaces relacionadas) para entender o contrato. O teste atualmente exige a presença de ambos (linha 348 em `comercial-smoke-real.spec.ts`).
    *   **Status do Pagamento:** Verificar se o `status` do pagamento retornado pelo backend é sempre `PENDENTE` ou `ABERTO`, conforme esperado pelo teste (linha 346 em `comercial-smoke-real.spec.ts`). Se outros status forem possíveis, o teste precisará ser ajustado.
    *   **Matching de CPF:** Analisar a lógica de comparação de CPF. Pode haver uma divergência no formato (com/sem pontos) entre os dados fornecidos pelo backend e o que o teste está utilizando para validação.
    *   **Uso da Resposta Direta:** O backend retorna a `ConversaoProspectResponse` contendo os objetos `cliente`, `aluno`, `matricula` e `pagamento` diretamente. O teste pode estar ignorando essa resposta inicial e realizando um polling separado, o que pode levar a um atraso ou inconsistência na disponibilidade dos dados. Considerar usar a resposta direta da API para as asserções iniciais.

4.  **Ajuste de Asserções e Lógica do Teste:**
    *   Com base na análise do item 3, refatorar as asserções nas linhas 346 e 348 do teste para refletir o contrato real da API e a disponibilidade dos dados. Isso pode incluir adicionar verificações para valores `null` ou ajustar os status esperados.
    *   Avaliar a possibilidade de utilizar a `ConversaoProspectResponse` direta para validar os artefatos convertidos, reduzindo a dependência do polling ou otimizando-o.
    *   Se for confirmado que o problema é de timing (ex: backend lento para persistir os dados do pagamento), considerar ajustar o timeout do Playwright com cautela, priorizando a otimização do backend.

5.  **Refatoração e Alinhamento:**
    *   Garantir que a lógica do teste reflita com precisão o fluxo de conversão e a validação dos dados pós-conversão, de acordo com o comportamento atual do backend e frontend. Isso pode envolver ajustar seletores, textos esperados ou a sequência de ações, com foco na estabilidade dos dados de pagamento.

**Test Strategy:**

1.  **Execução do Teste Específico com Rastreamento:** Executar o teste `npx playwright test tests/e2e/comercial-smoke-real.spec.ts --grep "prospect vira cliente com matrícula"` em modo `headed` e com `trace` para depuração visual detalhada e análise do fluxo de rede e DOM.
2.  **Verificação do Fluxo e Polling:** Observar se o processo de conversão ocorre sem erros visíveis na interface e acompanhar a execução da função `resolveConvertedArtifacts` para entender qual o estado dos dados de aluno, matrícula e pagamento durante o polling. 
3.  **Inspeção Detalhada da Resposta da API:** Utilizar `page.waitForResponse` para interceptar a requisição de conversão (`POST /api/v1/crm/prospects/converter` ou similar) e inspecionar o corpo da resposta (`ConversaoProspectResponse`). Validar os objetos `cliente`, `aluno`, `matricula` e, crucialmente, os campos `pagamento.descricao`, `pagamento.dataVencimento` e `pagamento.status` para garantir que estão presentes e com os valores esperados diretamente na resposta do backend.
4.  **Validação das Asserções e Dados Pós-Conversão:** Confirmar que o teste passa sem a falha 'Conversao concluida, mas aluno/matricula/pagamento nao ficaram legiveis' após as correções. Focar nas linhas 346 e 348 do teste para verificar se as asserções de pagamento estão agora alinhadas com o comportamento do backend.
5.  **Execução Completa do Arquivo:** Rodar todos os testes em `comercial-smoke-real.spec.ts` para garantir que a correção não introduziu regressões em outros cenários.
