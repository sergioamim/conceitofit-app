# Task ID: 109

**Title:** Reforço Técnico e Remoção de Mocks Comerciais

**Status:** todo

**Dependencies:** 106, 108

**Priority:** high

**Description:** Migração final dos domínios transacionais para API real e expansão de validações assíncronas globais.

**Details:**

Remover dependências de `localStorage` e `mock/services` nos fluxos de venda e cadastro, garantindo integridade de dados via API.

**Test Strategy:**

Executar a suíte Playwright completa para o fluxo de "Cadastro -> Venda -> Recebimento" sem interceptação de mocks.

## Subtasks

### 109.1. Globalizar Validação Assíncrona (CPF/Email)

**Status:** todo
**Dependencies:** None

Levar a lógica de validação asynca de CPF/Email do Wizard para os formulários de edição de cliente e nova venda.

### 109.2. Eliminar Mocks nos Domínios de Vendas e Pagamentos

**Status:** todo
**Dependencies:** None

Substituir todos os imports remanescentes de `mock/services` por chamadas diretas aos adapters da `src/lib/api/vendas.ts` e `pagamentos.ts`.

### 109.3. Remover Dependência de `localStorage` para Dados de Domínio

**Status:** todo
**Dependencies:** 109.2

Garantir que o recarregamento da página (F5) não perca ou altere estados transacionais por falta de persistência no backend.
