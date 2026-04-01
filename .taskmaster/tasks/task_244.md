# Task ID: 244

**Title:** Criar API client para billing recorrente (gateway)

**Status:** done

**Dependencies:** None

**Priority:** medium

**Description:** Criar src/lib/api/billing.ts com: criar assinatura, cancelar, listar, status. Types para Assinatura, CobrancaRecorrente.

**Details:**

API client tipado para gateway escolhido (Pagar.me ou Asaas). Endpoints: POST criar assinatura, DELETE cancelar, GET listar, GET status. Types: Assinatura (id, alunoId, planoId, status, valor, ciclo, proximaCobranca), CobrancaRecorrente (id, assinaturaId, valor, status, dataPagamento). Normalização de response no padrão do projeto.

**Test Strategy:**

Client tipado. Testes unitários com mock de responses.
