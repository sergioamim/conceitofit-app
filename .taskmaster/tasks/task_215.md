# Task ID: 215

**Title:** Expandir cobertura de testes de componentes

**Status:** done

**Dependencies:** None

**Priority:** low

**Description:** Apenas 11 testes de componentes existem. Componentes críticos como novo-cliente-wizard, clientes-client, plano-form, treino-form não têm cobertura.

**Details:**

Componentes prioritários para testes: 1) novo-cliente-wizard.tsx - testar fluxo multi-step, validação, draft persistence. 2) clientes-client.tsx - testar filtros, paginação, bulk actions. 3) plano-form.tsx - testar validação de campos, preview. 4) treino-form.tsx - testar adição de exercícios, configuração de séries. 5) receber-pagamento-modal.tsx - testar fluxo de recebimento. 6) nova-matricula-modal.tsx - testar seleção de plano e confirmação. Usar @testing-library/react com happy-dom (já configurado). Criar mocks de API calls com vi.mock().

**Test Strategy:**

Todos os testes passam. Cobertura de componentes > 60%. Componentes críticos têm testes de happy path e error path.
