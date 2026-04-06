# Task ID: 475

**Title:** Backend: Criar endpoints de billing recorrente com gateway

**Status:** pending

**Dependencies:** None

**Priority:** high

**Description:** Implementar no backend Java endpoints para criar/gerenciar assinaturas recorrentes via gateway de pagamento (Pagar.me/Stripe).

**Details:**

Endpoints necessários: (1) POST /api/v1/billing/assinaturas — criar assinatura recorrente para matrícula, (2) GET /api/v1/billing/assinaturas/{id} — detalhes da assinatura, (3) POST /api/v1/billing/assinaturas/{id}/cancelar — cancelar recorrência, (4) POST /api/v1/billing/webhook — receber eventos do gateway (cobrança criada, paga, falhou), (5) GET /api/v1/billing/academia/config — configuração de billing da academia, (6) POST /api/v1/billing/academia/config — atualizar configuração (gateway, API keys). Model: Assinatura com status (ATIVA, CANCELADA, SUSPENSA), gateway, externalId, matrículaId, valor, ciclo.

**Test Strategy:**

Testes de integração backend para cada endpoint. Teste de webhook simulando eventos do gateway. Teste de idempotência para criação de assinatura.
