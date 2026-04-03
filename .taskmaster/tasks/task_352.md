# Task ID: 352

**Title:** Investigar Resíduos de Backend Expostos por Testes Playwright

**Status:** done

**Dependencies:** 348 ✓, 324 ✓, 333 ✓, 62 ✓, 63 ✓

**Priority:** high

**Description:** Analisar as interações backend detectadas por testes Playwright, focando no smoke comercial e fluxos de autenticação/onboarding, para identificar e documentar resíduos que requerem correção no backend (academia-java) ou clarificação no frontend.

**Details:**

Esta tarefa exige uma análise aprofundada dos resultados dos testes Playwright, especialmente aqueles relacionados ao fluxo comercial (Task 324) e à jornada de adesão pública (Task 333), utilizando as descobertas da Task 348 como ponto de partida. O foco é identificar qualquer requisição HTTP ou interação com o backend que pareça residual, inesperada ou que utilize contratos desatualizados ou incompletos.

Passos de implementação:
1.  **Revisar Relatórios Playwright:** Consultar os logs e traces gerados pelos testes Playwright, em particular os cenários que cobrem o fluxo de "Prospect → Cliente → Matrícula → Pagamento" (Task 324) e a "Jornada Pública de Adesão" (Task 333). Utilizar os dados e a classificação de falhas da Task 348.
2.  **Identificar Padrões de Interação Suspeitos:** Procurar por:
    *   Requisições para URLs `localhost:9323` ou qualquer outro endpoint que não corresponda ao ambiente de backend configurado (academia-java).
    *   Envio de headers ou parâmetros de query legados (ex: `tenantId` em fluxos que deveriam usar `X-Rede-Identifier` conforme Task 63).
    *   Exposição de dados sensíveis ou informações de debug em respostas de APIs públicas ou sem autenticação.
    *   Endpoints que não estão documentados ou que parecem ser utilizados de forma não intencional pelo frontend.
3.  **Reprodução e Análise:** Para cada "resíduo" identificado, tentar reproduzir o cenário manualmente no navegador com as ferramentas de desenvolvedor abertas ou via um proxy de rede (como o Playwright utiliza internamente ou um proxy externo como o Charles/Fiddler) para capturar o tráfego de rede detalhado. Isso ajudará a entender o contexto da requisição.
4.  **Documentação dos Resíduos:** Para cada item encontrado, documentar:
    *   **Endpoint:** A URL completa da requisição.
    *   **Método HTTP:** (GET, POST, PUT, etc.).
    *   **Payload/Resposta:** Partes relevantes do corpo da requisição e da resposta.
    *   **Contexto do Teste:** Qual cenário Playwright ou fluxo de usuário disparou essa interação.
    *   **Problema Potencial:** Explicar por que é considerado um resíduo ou um problema (e.g., segurança, contrato desatualizado, erro).
    *   **Ação Proposta:** Classificar se a correção é necessária no `academia-java` (backend, e.g., remover endpoint, ajustar contrato de API) ou no frontend (e.g., remover chamada legada, tratar erro).
    *   **Evidências:** Capturas de tela dos devtools, logs de rede.
5.  **Relatório Consolidado:** Gerar um relatório final com a lista de todos os resíduos documentados, a classificação das ações (frontend/backend) e as recomendações de prioridade para correção.

**Test Strategy:**

A validação da tarefa será a entrega de um relatório abrangente e bem-estruturado. O relatório deve conter:
1.  Uma lista detalhada de todas as interações backend consideradas "resíduos" com base na análise dos testes Playwright (especialmente Task 324 e 333).
2.  Para cada item na lista, deve haver uma descrição clara do problema, a URL do endpoint, o contexto em que foi observado e a classificação da responsabilidade (correção no `academia-java` ou no frontend).
3.  As classificações de responsabilidade devem ser justificadas com base nos contratos de autenticação (Tasks 62, 63) e nas expectativas do fluxo comercial e de onboarding.
4.  O relatório deve incluir evidências visuais (capturas de tela das ferramentas de desenvolvedor, logs de rede) para cada resíduo identificado.
5.  A ausência de um relatório ou um relatório incompleto indicará que a tarefa não foi concluída com sucesso. A análise deve cobrir de forma satisfatória os fluxos de autenticação, onboarding e o smoke comercial.
