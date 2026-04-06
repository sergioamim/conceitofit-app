# Task ID: 478

**Title:** Frontend: Vincular matrícula a assinatura recorrente no fluxo de matrícula

**Status:** pending

**Dependencies:** 476, 477

**Priority:** high

**Description:** Integrar fluxo de criação/renovação de matrícula com criação de assinatura recorrente no gateway.

**Details:**

No fluxo de matrícula (nova-matricula-modal e conversão de prospect): (1) Se billing automatizado está ON e plano permite recorrência, oferecer opção 'Cobrança automática', (2) Se selecionado, capturar dados de pagamento (cartão/boleto) e criar assinatura via API, (3) Exibir status da assinatura no detalhe da matrícula, (4) Permitir trocar forma de cobrança (manual vs automática) no detalhe do cliente, (5) Webhook do gateway atualiza status de pagamento automaticamente.

**Test Strategy:**

Teste E2E: criar matrícula com cobrança automática → assinatura criada no gateway → webhook recebido → pagamento marcado. Teste de fallback: se gateway indisponível, matrícula é criada com cobrança manual.
