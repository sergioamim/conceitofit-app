# Task ID: 246

**Title:** Vincular matrícula a assinatura recorrente

**Status:** pending

**Dependencies:** 244, 245

**Priority:** medium

**Description:** No fluxo de criação de matrícula, se plano recorrente → criar assinatura no gateway. Cancelamento propaga.

**Details:**

Alterar fluxo de criação de matrícula: se plano.cobrancaRecorrente === true, após criar matrícula, criar assinatura via billing API. Exibir status da assinatura na tela de matrículas (badge). Cancelamento de matrícula dispara cancelamento de assinatura.

**Test Strategy:**

Matrícula recorrente cria assinatura. Cancelamento propaga. Status visível.
