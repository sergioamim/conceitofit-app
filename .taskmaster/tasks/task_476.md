# Task ID: 476

**Title:** Frontend: API client e tipos para billing recorrente

**Status:** pending

**Dependencies:** 475

**Priority:** high

**Description:** Criar API client TypeScript para endpoints de billing, com tipos Zod e integração com TanStack Query.

**Details:**

Criar src/lib/api/billing.ts com: createSubscription(), getSubscription(), cancelSubscription(), getAcademyBillingConfig(), updateAcademyBillingConfig(). Tipos Zod para request/response de cada endpoint. Hooks TanStack Query: useCreateSubscription(), useSubscription(id), useAcademyBillingConfig(). Tratar erros do gateway (cartão recusado, saldo insuficiente, etc).

**Test Strategy:**

Testes unitários do API client com mocks de fetch. Testes unitários dos hooks com Testing Library.
